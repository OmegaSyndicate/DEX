const TimeCheck = artifacts.require("TimeCheck");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const chainID = await web3.eth.getChainId();

    switch (chainID) {

      case 1337:   // Network ID 1337 is for Ganache
        await deployer.deploy(TimeCheck);
        break;

    }
  });
};
