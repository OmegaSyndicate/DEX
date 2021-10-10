const Airdrop = artifacts.require("Airdrop");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    await deployer.deploy(Airdrop);
  });
};
