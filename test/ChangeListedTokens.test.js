const OmegaDEX = artifacts.require('OmegaDEX');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenD = artifacts.require('TokenD');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('ChangeListedTokens', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenD = await TokenD.deployed()
    omegaDEX = await OmegaDEX.deployed();
    dex = omegaDEX.address;

    await omegaDEX.send(10e18);
    await tokenA.transfer(omegaDEX.address, 10000n * ONE);
    await tokenD.transfer(trader_D, 100000n * ONE);
    await omegaDEX.unlockExchange();
  });

  it('rejects delisting of ETH', async () => {
    await expectRevert(
      omegaDEX.changeListing(
        constants.ZERO_ADDRESS,
        tokenD.address,
        20000n * ONE
      ),
      "ODX: Cannot delist ETH."
    );
  });


});
