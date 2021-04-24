const OmegaDEX = artifacts.require("OmegaDEX");
const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");
const TokenC = artifacts.require("TokenC");
const TokenD = artifacts.require("TokenD");

module.exports = function(deployer, network, accounts) {
    deployer.then(async () => {
      await deployer.deploy(TokenA);
      await deployer.deploy(TokenB);
      await deployer.deploy(TokenC);
      await deployer.deploy(TokenD);
      await deployer.deploy(OmegaDEX, [TokenA.address, TokenB.address, TokenC.address]);
    });
};
