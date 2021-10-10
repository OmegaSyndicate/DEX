const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');
const Airdrop = artifacts.require('Airdrop');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n
const XDP2 = require('./XDP2_to_drop.json')

/**
 * Airdrop tokens for v2 launch
 */
module.exports = async function (done) {
   if (await web3.eth.getChainId() != 1) {
     console.log("This is designed for the main network");
     done();
   }

   try {
     dfpGov = await DFPgov.deployed();
     defiPlaza = await DeFiPlaza.deployed();
     airdrop = await Airdrop.deployed();

     console.log("Initiating XDP2 airdrop: ", defiPlaza.address);
     console.log("Setting allowance for airdrop contract");
     await defiPlaza.approve(airdrop.address, constants.MAX_UINT256);
     console.log("Airdropping XDP2");
     var amounts = [];
     for (const v of Object.values(XDP2)) {
       amounts.push(BigInt(v));
     }
     result = await airdrop.airdrop(defiPlaza.address, Object.keys(XDP2), amounts);
     console.log(result);

   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
};
