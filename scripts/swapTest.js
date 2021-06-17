const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

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

     // Swapping ETH to USDC
     console.log("Swapping ETH to USDC");
     await defiPlaza.swap(constants.ZERO_ADDRESS, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 100n*FINNEY, 0n, { value: 1e18 });

     // Swapping ETH to USDT
     console.log("Swapping ETH to USDT");
     await defiPlaza.swap(constants.ZERO_ADDRESS, "0xdac17f958d2ee523a2206206994597c13d831ec7", 100n*FINNEY, 0n, { value: 1e17});
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
