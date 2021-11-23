const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n;

/**
 * Initialization after deploying on main net
 */
 module.exports = async function (done) {
   if (await web3.eth.getChainId() != 1) {
     console.log("This script is just to generate some data, use mainnet");
     done();
   }

   try {
     dfpGov = await DFPgov.deployed();
     defiPlaza = await DeFiPlaza.deployed();

     const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
     const SPELL = "0x090185f2135308BaD17527004364eBcC2D37e5F6";
     const targetAmount = 15501790n * ONE; //325k @0.02096532
     //const targetAmount = 13673838n * ONE; //340k @0.024865

     max = constants.MAX_UINT256;
     b32empty = web3.utils.fromAscii("");
     data = defiPlaza.contract.methods.changeListing(AAVE, SPELL, targetAmount).encodeABI();

     console.log("MAXUINT:", max.toString());
     console.log("b32empty: ", b32empty);
     console.log("changeListing data: ", data);

     data = defiPlaza.contract.methods.setDeListingBonus(922337203685477632n).encodeABI();
     console.log("5% bonus data: ", data);

   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
