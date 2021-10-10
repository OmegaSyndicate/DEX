const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

//const test = require('./tokens.json');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const ONE = 1000000000000000000n

/**
 * Initialization after deploying on main net
 */
 module.exports = async function (done) {
   if (await web3.eth.getChainId() != 1) {
     console.log("This script is meant for main net");
     done();
   }

   try {
     dfpGov = await DFPgov.deployed();
     defiPlaza = await DeFiPlaza.deployed();
     const founder = "0x2f7ab204f3675353F37c70f180944a65b9890a9a";
     const dex = defiPlaza.address;
     console.log("DEX addres: ", dex);

     // Set DEX address in staking contract
     console.log("Setting DEX address in staking contract.");
     result = await dfpGov.setIndexToken(dex);

     // Change contract ownership to founder
     console.log("Setting staking contract ownership to founder");
     await dfpGov.transferOwnership(founder);
     console.log("Setting exchange ownership to founder");
     await defiPlaza.transferOwnership(founder);

     console.log("Transfering XDP balance to founder");
     wallets = await web3.eth.getAccounts();
     balance = await defiPlaza.balanceOf(wallets[0]);
     defiPlaza.transfer(founder, balance);
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
