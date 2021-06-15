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
     wallets = await web3.eth.getAccounts();
     defiPlaza = await DeFiPlaza.deployed();
     dfpGov = await DFPgov.deployed();
     const addresses = require("../tokens.json");
     tokens = Object.values(addresses);
     tokens.push(DFPgov.address.toLowerCase());
     tokens.push(constants.ZERO_ADDRESS);

     // Claim all tokens
     console.log("Removing all 16 tokens");
     balance = await defiPlaza.balanceOf(wallets[0])
     await defiPlaza.removeMultiple(balance, tokens.sort());
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
