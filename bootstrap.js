const DeFiPlaza = artifacts.require('XDP1');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n

/**
 * Does the initialization transactions
 */
 module.exports = async function (done) {
   console.log("Setting DEX address in staking contract.");
   defiPlaza = await DeFiPlaza.deployed();
   dfpGov = await DFPgov.deployed();
   result = await dfpGov.setIndexToken(defiPlaza.address);

   console.log("Approving LP tokens for staking.")
   await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);

   console.log("Staking initial 1600 LP tokens for numerical stability.");
   await dfpGov.stake(1600n * ONE);

   console.log("Completed.")
   done();
 };
