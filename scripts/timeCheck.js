const TimeCheck = artifacts.require('TimeCheck');

/**
 * Checks the latest block timestamp
 */
 module.exports = async function (done) {
   if (await web3.eth.getChainId() == 1) {
     console.log("You don't want this on the live network");
     done();
   }

   try {
     timeCheck = await TimeCheck.deployed();

     timestamp = await timeCheck.blockTime();
     console.log("Last mined block timestamp: ", timestamp.toString());
     console.log("Completed");
   } catch (e) {
     console.log(e);
     console.log("Terminating");
   }
   done();
 };
