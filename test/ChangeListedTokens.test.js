const DeFiPlaza = artifacts.require('DPL1');
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
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenD.transfer(trader_D, 100000n * ONE);
    await defiPlaza.unlockExchange();
  });

  it('rejects delisting of ETH', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        constants.ZERO_ADDRESS,
        tokenD.address,
        20000n * ONE
      ),
      "DPL: Cannot delist ETH."
    );
  });

  it('rejects delisting non-listed token D', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenD.address,
        tokenD.address,
        20000n * ONE
      ),
      "DPL: Token not listed."
    );
  });


  it('rejects to list already listed token B', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenA.address,
        tokenB.address,
        20000n * ONE
      ),
      "DPL: Token already listed."
    );
  });

  it('accepts change of A to D', async () => {
    await defiPlaza.changeListing(
      tokenA.address,
      tokenD.address,
      20000n * ONE
    );
    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenD.address);
    expect(update.tokenToDelist).to.equal(tokenA.address);
  });

  it('rejects new change when change pending', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenB.address,
        tokenE.address,
        20000n * ONE
      ),
      "DPL: Previous update incomplete."
    );
  });

  it('rejects wrong listed bootstrap token C', async () => {
    await tokenC.transfer(trader_C, 10000n * ONE)
    await tokenC.approve(defiPlaza.address, 10000n*ONE, { from : trader_C })
    await expectRevert(
      defiPlaza.bootstrapNewToken(
        tokenC.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_C }
      ),
      "DPL: Wrong token."
    );
  });

  it('rejects wrong non-listed bootstrap token E', async () => {
    await tokenE.transfer(trader_E, 10000n * ONE)
    await tokenE.approve(defiPlaza.address, 10000n*ONE, { from : trader_E })
    await expectRevert(
      defiPlaza.bootstrapNewToken(
        tokenE.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_E }
      ),
      "DPL: Wrong token."
    );
  });

  it('accepts one-shot bootstrapping', async () => {
    await tokenD.approve(defiPlaza.address, 40000n*ONE, { from : trader_D })
    await defiPlaza.bootstrapNewToken(
      tokenD.address,
      40000n * ONE,
      tokenA.address,
      { from: trader_D }
    );
    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(constants.ZERO_ADDRESS);
    expect(update.tokenToDelist).to.equal(constants.ZERO_ADDRESS);
    expect(await tokenD.balanceOf(defiPlaza.address)).to.be.bignumber.equal('20000000000000000000000');
    expect(await tokenA.balanceOf(trader_D)).to.be.bignumber.equal('10000000000000000000000');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('0');
    tokenD_status = await defiPlaza.listedTokens(tokenD.address);
    expect(tokenD_status.state).to.be.bignumber.equal('3');
  });

});
