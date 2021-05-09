const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");
const TokenC = artifacts.require("TokenC");
const TokenD = artifacts.require("TokenD");
const TokenE = artifacts.require("TokenE");
const DeFiPlaza = artifacts.require("DPL1");
const DPLgov = artifacts.require("DPLgov");

module.exports = function(deployer, network, accounts) {
    deployer.then(async () => {
      await deployer.deploy(TokenA);
      await deployer.deploy(TokenB);
      await deployer.deploy(TokenC);
      await deployer.deploy(TokenD);
      await deployer.deploy(TokenE);
      await deployer.deploy(DeFiPlaza, [TokenA.address, TokenB.address, TokenC.address]);
      await deployer.deploy(DPLgov, DeFiPlaza.address)
    });
};
