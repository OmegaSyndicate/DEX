const DFPgovBridged = artifacts.require("DFPgovBridged");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    await deployer.deploy(DFPgovBridged);
  });
};
