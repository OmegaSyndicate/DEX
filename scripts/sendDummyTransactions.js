// Just send some 0 value transactions to self

 module.exports = async function (done) {
   try {
     accounts = await web3.eth.getAccounts();
     gasPrice = await web3.eth.getGasPrice();
     //console.log(accounts[0]);
     //console.log(gasPrice);
     for (let i = 0; i < 27; i++) {
       console.log("Iteration ", i);
       await web3.eth.sendTransaction({from: accounts[0],to: accounts[0], value: 0, maxFeePerGas: 200e9, maxPriorityFeePerGas: 5e9});
       await new Promise(r => setTimeout(r, 10000));
     }
   } catch (e) {
     console.log(e);
   }
   console.log("Completed");
   done();
 };
