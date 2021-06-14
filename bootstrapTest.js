const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n
const pairABI = require("./external/UniV2pairABI.json");
const routerABI = require("./external/UniV2routerABI.json");
const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const dex = DeFiPlaza.address;

/**
 * Initialization after deploying on main net fork
 */
 module.exports = async function (done) {
   if (await web3.eth.getChainId() == 1) {
     console.log("You don't want this on the live network");
     done();
   }

   try {
     dfpGov = await DFPgov.deployed();
     defiPlaza = await DeFiPlaza.deployed();
     tokens = require('./tokens.json');
     wallets = await web3.eth.getAccounts();
     uniRouter = new web3.eth.Contract(routerABI, "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");

     // Set DEX address in staking contract
     console.log("Setting DEX address in staking contract.");
     result = await dfpGov.setIndexToken(DeFiPlaza.address);

     // Stake initial tokens
     console.log("Staking initial 1600 LP tokens for numerical stability.");
     await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);
     await dfpGov.stake(1600n * ONE);

     // Bootstrap DEX liquidity
     console.log("Bootstrapping liquidity for ETH");
     await web3.eth.sendTransaction({ from: wallets[1], to: dex, value: 4e18});
     for (const [key, value] of Object.entries(tokens)) {
       console.log("Bootstrapping liquidity for", key);
       await uniRouter.methods.swapExactETHForTokens(0,[weth, value], dex, 1937858400).send({ from: wallets[1], value: 4e18 });
     }

     // Unlock Exchange
     console.log("Unlocking exchange");
     dfp = new web3.eth.Contract(DeFiPlaza.abi, DeFiPlaza.address);
     await dfp.methods.unlockExchange().send({ from: wallets[0] });
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
