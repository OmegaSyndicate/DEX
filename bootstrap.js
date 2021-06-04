const DeFiPlaza = artifacts.require('DFP');
const DFPgov = artifacts.require('DFPgov');
const test = require('./tokens.json');
/**
 * Sets DEX address into staking contract
 * Stakes initial 1600 LPs
 */
 module.exports = async function (done) {

   console.log("Setting DEX address in staking contract.");
   defiPlaza = await DeFiPlaza.deployed();
   result = await defiPlaza.DFP_config();
   console.log(defiPlaza.address);

   console.log("Staking initial 1600 LP tokens for numerical stability.");
   done();
 };
