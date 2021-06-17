const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n

/**
 * Initialization after deploying on main net fork
 */
 module.exports = async function (done) {
   try {
     defiPlaza = await DeFiPlaza.deployed();

     // Unlock Exchange
     console.log("Unlocking exchange");
     await defiPlaza.unlockExchange();
     console.log("Completed");
   } catch (e) {
     console.log(e);
     console.log("Terminating");
   }
   done();
 };
