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
     dfpGov = await DFPgov.deployed();
     wallets = await web3.eth.getAccounts();

     await time.advanceBlock();
     quote = await dfpGov.rewardsQuote(wallets[0]);
     console.log("Quote: ", quote.toString());
     console.log("Completed");
   } catch (e) {
     console.log(e);
     console.log("Terminating");
   }
   done();
 };
