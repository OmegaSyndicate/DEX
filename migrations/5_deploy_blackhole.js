const BlackHole = artifacts.require("BlackHole");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    await deployer.deploy(BlackHole);
  });
};
