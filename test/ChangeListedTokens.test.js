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
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D, trader_E] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
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

  it('rejects wrong listed bootstrap token C', async () => {
    await tokenC.transfer(trader_C, 10000n * ONE)
    await tokenC.approve(omegaDEX.address, 10000n*ONE, { from : trader_C })
    await expectRevert(
      omegaDEX.bootstrapNewToken(
        tokenC.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_C }
      ),
      "ODX: Wrong token."
    );
  });

  it('rejects wrong non-listed bootstrap token E', async () => {
    await tokenE.transfer(trader_E, 10000n * ONE)
    await tokenE.approve(omegaDEX.address, 10000n*ONE, { from : trader_E })
    await expectRevert(
      omegaDEX.bootstrapNewToken(
        tokenE.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_E }
      ),
      "ODX: Wrong token."
    );
  });

  it('accepts one-shot bootstrapping', async () => {
    await tokenD.approve(omegaDEX.address, 40000n*ONE, { from : trader_D })
    await omegaDEX.bootstrapNewToken(
      tokenD.address,
      40000n * ONE,
      tokenA.address,
      { from: trader_D }
    );
    update = await omegaDEX.listingUpdate()
    expect(update.tokenToList).to.equal(constants.ZERO_ADDRESS);
    expect(update.tokenToDelist).to.equal(constants.ZERO_ADDRESS);
    expect(await tokenD.balanceOf(omegaDEX.address)).to.be.bignumber.equal('20000000000000000000000');
    expect(await tokenA.balanceOf(trader_D)).to.be.bignumber.equal('10000000000000000000000');
    expect((await omegaDEX.listedTokens(tokenA.address)).state).to.be.bignumber.equal('0');
    tokenD_status = await omegaDEX.listedTokens(tokenD.address);
    expect(tokenD_status.state).to.be.bignumber.equal('3');
  });

});
