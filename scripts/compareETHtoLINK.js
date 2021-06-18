const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');
const fs = require('fs');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

const link = "0x514910771af9ca656af840dff83e8264ecf986ca"
const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const bweth = "0x4f5704D9D2cbCcAf11e70B34048d41A0d572993F";
const bnt = "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C";
const beth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const eth_bnt = "0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533";
const link_bnt = "0x04D0231162b4784b706908c787CE32bD075db9b7";
const v2routerABI = require("./external/UniV2routerABI.json");
const v3routerABI = require("./external/UniV3routerABI.json");
const behodlerABI = require("./external/BehodlerABI.json");
const bancorABI = require("./external/BancorABI.json");

const uniV2 = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const uniV3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const behodler = "0x1B8568FbB47708E9E9D31Ff303254f748805bF21";
const bancor = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const balancerV2 = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const kyber = "0x9AAb3f75489902f3a48495025729a0AF77d4b11e";
const sushi = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const sake = "0x9C578b573EdE001b95d51a55A3FAfb45f5608b1f";
const defiswap = "0xCeB90E4C17d626BE0fACd78b79c9c87d7ca181b3";

/**
 * Initialization after deploying on main net fork
 */
 module.exports = async function (done) {
   if (await web3.eth.getChainId() == 1) {
     console.log("You don't want this on the live network");
     done();
   }

   try {
     defiPlaza = await DeFiPlaza.deployed();
     uniRouterV2 = new web3.eth.Contract(v2routerABI, uniV2);
     uniRouterV3 = new web3.eth.Contract(v3routerABI, uniV3);
     behodlerDex = new web3.eth.Contract(behodlerABI, behodler);
     bancorDex = new web3.eth.Contract(bancorABI, bancor);
     sushiDex = new web3.eth.Contract(v2routerABI, sushi);
     sakeDex = new web3.eth.Contract(v2routerABI, sake);
     defiDex = new web3.eth.Contract(v2routerABI, defiswap);
     bwethContract = new web3.eth.Contract(DeFiPlaza.abi, bweth); // Only using the ERC20 methods anyway
     linkContract = new web3.eth.Contract(DeFiPlaza.abi, link);   // Only using the ERC20 methods anyway
     wallets = await web3.eth.getAccounts();
     i = 4;

     receipts = {};
     // Swapping ETH to LINK comparison
     await defiPlaza.swap(constants.ZERO_ADDRESS, link, 10n*FINNEY, 0n, { value: 1e16, from: wallets[i] }); //get some LINK in advance
     console.log("Swapping ETH to LINK via DeFiPlaza");
     receipt = await defiPlaza.swap(constants.ZERO_ADDRESS, link, 10n*FINNEY, 0n, { value: 1e16, from: wallets[i] });
     receipts["DeFiPlaza"] = receipt.receipt.gasUsed;
     console.log(receipt.tx);

     console.log("Swapping ETH to LINK via UniSwap v2");
     receipt = await uniRouterV2.methods.swapExactETHForTokens(0,[weth, link], wallets[i], 1937858400).send({ from: wallets[i], value: 1e15 });
     receipts["UniSwapV2"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via Behodler");
     bwethBalance = await bwethContract.methods.balanceOf(behodler).call();
     linkBalance = await linkContract.methods.balanceOf(behodler).call();
     outputAmount = 995n*FINNEY*BigInt(linkBalance.toString())/(BigInt(bwethBalance.toString()) + 995n*FINNEY);
     receipt = await behodlerDex.methods.swap(bweth, link, 1n*ONE, outputAmount).send({ from: wallets[i], value: 1e18 });
     receipts["Behodler"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via Bancor");
     receipt = await bancorDex.methods.convertByPath(
       [beth, eth_bnt, bnt, link_bnt, link],
       1n * FINNEY,
       1n,
       constants.ZERO_ADDRESS,
       constants.ZERO_ADDRESS,
       0
     ).send({ from: wallets[i], value: 1e15 });
     receipts["Bancor"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via UniSwapV3");
     data = "0x414bf389000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca00000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000" + wallets[i].slice(2) + "00000000000000000000000000000000000000000000000000000000" + "73815f60" + "000000000000000000000000000000000000000000000000002386f26fc100000000000000000000000000000000000000000000000000000df0addc360494790000000000000000000000000000000000000000000000000000000000000000";
     receipt = await web3.eth.sendTransaction({ from: wallets[i], to: uniV3, data: data, value: 1e16 });
     receipts["UniSwapV3"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via BalancerV2");
     data = "0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000" + wallets[i].slice(2) + "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"+ wallets[i].slice(2) + "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000dd31ab4ebc043cdffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe99481dc77691d8e2456e5f3f61c1810adfc150300020000000000000000001800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
     receipt = await web3.eth.sendTransaction({ from: wallets[i], to: balancerV2, data: data, value: 1e16 });
     receipts["BalancerV2"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via Kyber");
     data = "0xae591d54000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca000000000000000000000000" + wallets[i].slice(2) + "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000bc87d21d0cf807a000000000000000000000000440bbd6a888a36de6e2f6a25f65bc4e16874faa9000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000000"
     receipt = await web3.eth.sendTransaction({ from: wallets[i], to: kyber, data: data, value: 1e16 });
     receipts["Kyber"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via SushiSwap");
     receipt = await sushiDex.methods.swapExactETHForTokens(0,[weth, link], wallets[i], 1937858400).send({ from: wallets[i], value: 1e16 });
     receipts["SushiSwap"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     console.log("Swapping ETH to LINK via defiSwap");
     receipt = await defiDex.methods.swapExactETHForTokens(0,[weth, link], wallets[i], 1937858400).send({ from: wallets[i], value: 1e16 });
     receipts["DefiSwap"] = receipt.gasUsed;
     console.log(receipt.transactionHash);

     fs.writeFileSync('./graphs/ETH_to_LINK.json', JSON.stringify(receipts, null, 4), (err) => {
         if (err) {
           throw err;
         }
     })
     console.log("Completed");
   } catch (e) {
     console.log(e);
     console.log("Terminating");
   }
   done();
 };
