const Timelock = artifacts.require("Timelock");
const TimeCheck = artifacts.require("TimeCheck");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const chainID = await web3.eth.getChainId();
    const founder = "0x2f7ab204f3675353F37c70f180944a65b9890a9a";

    switch (chainID) {

      case 1: // Main network
        await deployer.deploy(Timelock, [founder]);
        break;

      case 1337:   // Network ID 1337 is for Ganache
        await deployer.deploy(TimeCheck);
        break;

    }
  });
};
