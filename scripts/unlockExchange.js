const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n

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

     // Unlock Exchange
     console.log("Unlocking exchange");
     await defiPlaza.unlockExchange();
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
