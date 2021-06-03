const DeFiPlaza = artifacts.require('DPL1');
const DPLgov = artifacts.require('DPLgov');

/**
 * Sets DEX address into staking contract
 * Stakes initial 1600 LPs
 */
 module.exports = async function (done) {

   console.log("Setting DEX address in staking contract.");
   defiPlaza = await DeFiPlaza.deployed();
   result = await defiPlaza.ODX_config();
   console.log(result);

   console.log("Staking initial 1600 LP tokens for numerical stability.");
   done();
 };
