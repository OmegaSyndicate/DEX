const OmegaDEX = artifacts.require('OmegaDEX');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenD = artifacts.require('TokenD');
const TokenE = artifacts.require('TokenE');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('ChangeListedTokens', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenD = await TokenD.deployed()
    tokenE = await TokenE.deployed()
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

  it('rejects delisting non-listed token D', async () => {
    await expectRevert(
      omegaDEX.changeListing(
        tokenD.address,
        tokenD.address,
        20000n * ONE
      ),
      "ODX: Token not listed."
    );
  });


  it('rejects to list already listed token B', async () => {
    await expectRevert(
      omegaDEX.changeListing(
        tokenA.address,
        tokenB.address,
        20000n * ONE
      ),
      "ODX: Token already listed."
    );
  });

  it('accepts change of A to D', async () => {
    await omegaDEX.changeListing(
      tokenA.address,
      tokenD.address,
      20000n * ONE
    );
    update = await omegaDEX.listingUpdate()
    expect(update.tokenToList).to.equal(tokenD.address);
    expect(update.tokenToDelist).to.equal(tokenA.address);
  });

  it('rejects new change when change pending', async () => {
    await expectRevert(
      omegaDEX.changeListing(
        tokenB.address,
        tokenE.address,
        20000n * ONE
      ),
      "ODX: Previous update incomplete."
    );
  });


});
