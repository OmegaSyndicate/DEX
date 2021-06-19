const DeFiPlaza = artifacts.require('DeFiPlaza');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenE = artifacts.require('TokenE');
const TokenY = artifacts.require('TokenY');
const TokenZ = artifacts.require('TokenZ');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('(un)ListingTokens', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_Y, trader_Z] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
    tokenY = await TokenY.deployed()
    tokenZ = await TokenZ.deployed()
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenB.transfer(defiPlaza.address, 10000n * ONE);
    await tokenZ.transfer(trader_Z, 100000n * ONE);
    await defiPlaza.unlockExchange();
  });

  it('rejects delisting of ETH', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        constants.ZERO_ADDRESS,
        tokenZ.address,
        20000n * ONE
      ),
      "DFP: Cannot delist ETH"
    );
  });

  it('rejects delisting non-listed token Z', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenZ.address,
        tokenZ.address,
        20000n * ONE
      ),
      "DFP: Token not listed"
    );
  });


  it('rejects to list already listed token B', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenA.address,
        tokenB.address,
        20000n * ONE
      ),
      "DFP: Token already listed"
    );
  });

  it('accepts listing Z for A', async () => {
    await defiPlaza.changeListing(
      tokenA.address,
      tokenZ.address,
      20000n * ONE
    );
    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenZ.address);
    expect(update.tokenToDelist).to.equal(tokenA.address);
  });

  it('rejects new change when change pending', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenB.address,
        tokenY.address,
        20000n * ONE
      ),
      "DFP: Previous update incomplete"
    );
  });

  it('rejects listed bootstrap token C', async () => {
    await tokenC.transfer(trader_C, 10000n * ONE)
    await tokenC.approve(defiPlaza.address, 10000n*ONE, { from : trader_C })
    await expectRevert(
      defiPlaza.bootstrapNewToken(
        tokenC.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_C }
      ),
      "DFP: Wrong token"
    );
  });

  it('rejects non-listed bootstrap token Y', async () => {
    await tokenY.transfer(trader_Y, 10000n * ONE)
    await tokenY.approve(defiPlaza.address, 10000n*ONE, { from : trader_Y })
    await expectRevert(
      defiPlaza.bootstrapNewToken(
        tokenY.address,
        10000n * ONE,
        tokenA.address,
        { from: trader_Y }
      ),
      "DFP: Wrong token"
    );
  });

  it('accepts one-shot bootstrapping', async () => {
    await tokenZ.approve(defiPlaza.address, 40000n*ONE, { from : trader_Z })
    await truffleCost.log(defiPlaza.bootstrapNewToken(
      tokenZ.address,
      40000n * ONE,
      tokenA.address,
      { from: trader_Z }
    ));
    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(constants.ZERO_ADDRESS);
    expect(update.tokenToDelist).to.equal(constants.ZERO_ADDRESS);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('20000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('10000000000000000000000');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('0');
    tokenZ_status = await defiPlaza.listedTokens(tokenZ.address);
    expect(tokenZ_status.state).to.be.bignumber.equal('3');
  });

});
