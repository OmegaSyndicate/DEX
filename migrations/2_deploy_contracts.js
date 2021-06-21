const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");
const TokenC = artifacts.require("TokenC");
const TokenD = artifacts.require("TokenD");
const TokenE = artifacts.require("TokenE");
const TokenF = artifacts.require("TokenF");
const TokenG = artifacts.require("TokenG");
const TokenH = artifacts.require("TokenH");
const TokenI = artifacts.require("TokenI");
const TokenJ = artifacts.require("TokenJ");
const TokenK = artifacts.require("TokenK");
const TokenL = artifacts.require("TokenL");
const TokenM = artifacts.require("TokenM");
const TokenN = artifacts.require("TokenN");
const TokenY = artifacts.require("TokenY");
const TokenZ = artifacts.require("TokenZ");
const DeFiPlaza = artifacts.require("DeFiPlaza");
const DFPgov = artifacts.require("DFPgov");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const networkID = await web3.eth.net.getId();
    switch (networkID) {

      case 1:   // Network ID 1 is for main net (and forks thereof). The real deal is deployed here.
        const addresses = require("../tokens.json");
        await deployer.deploy(DFPgov, "0x2f7ab204f3675353F37c70f180944a65b9890a9a", 1624356000);  // 22nd of June 2021 12:00 GMT+2
        tokens = Object.values(addresses);
        tokens.push(DFPgov.address.toLowerCase());
        await deployer.deploy(DeFiPlaza, tokens.sort(), "DeFi Plaza Main Index", "XDP1");
        break;

      default:  // All other networks are test networks requiring test token config
        await deployer.deploy(TokenA);
        await deployer.deploy(TokenB);
        await deployer.deploy(TokenC);
        await deployer.deploy(TokenD);
        await deployer.deploy(TokenE);
        await deployer.deploy(TokenF);
        await deployer.deploy(TokenG);
        await deployer.deploy(TokenH);
        await deployer.deploy(TokenI);
        await deployer.deploy(TokenJ);
        await deployer.deploy(TokenK);
        await deployer.deploy(TokenL);
        await deployer.deploy(TokenM);
        await deployer.deploy(TokenN);
        await deployer.deploy(TokenY);
        await deployer.deploy(TokenZ);
        await deployer.deploy(DFPgov, accounts[5], 1624356000);
        tokens = [TokenA.address.toLowerCase(), TokenB.address.toLowerCase(), TokenC.address.toLowerCase(),
          TokenD.address.toLowerCase(), TokenE.address.toLowerCase(), TokenF.address.toLowerCase(),
          TokenG.address.toLowerCase(), TokenH.address.toLowerCase(), TokenI.address.toLowerCase(),
          TokenJ.address.toLowerCase(), TokenK.address.toLowerCase(), TokenL.address.toLowerCase(),
          TokenM.address.toLowerCase(), TokenN.address.toLowerCase(), DFPgov.address.toLowerCase()];
        await deployer.deploy(DeFiPlaza, tokens.sort(), "DeFi Plaza Main Index", "XDP1");
    }
  });
};
