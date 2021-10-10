const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');
const Airdrop = artifacts.require('Airdrop');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n

const XDP2 = require('./XDP2_to_drop.json')
const DFP2 = require('./DFP2_to_drop.json')

/**
 * Airdrop tokens for v2 launch
 */
module.exports = async function (done) {
   if (await web3.eth.getChainId() == 1) {
     console.log("You don't want this on the live network");
     done();
   }

   try {
     dfpGov = await DFPgov.deployed();
     defiPlaza = await DeFiPlaza.deployed();
     airdrop = await Airdrop.deployed();

     console.log("Checking address list for tokens");
     for (const [key, value] of Object.entries(XDP2)) {
       actual = await defiPlaza.balanceOf(key);
       console.log("XDP balance expected: ", value, " -- Actual: ", await actual.toString());
     }
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
};
