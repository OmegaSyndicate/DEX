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

contract('(un)Listing tokens', accounts => {
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
    await tokenZ.transfer(trader_Z, 20000n * ONE);
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
    tokenStatusA = await defiPlaza.listedTokens(tokenA.address);
    expect(tokenStatusA.state).to.be.bignumber.equal('2');
    tokenStatusZ = await defiPlaza.listedTokens(tokenZ.address);
    expect(tokenStatusZ.state).to.be.bignumber.equal('1');
    expect(tokenStatusZ.listingTarget).to.be.bignumber.equal('20000000000000000000000');
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

  it('accepts token Z bootstrapping', async() => {
    await tokenZ.approve(defiPlaza.address, constants.MAX_UINT256, { from : trader_Z });
    await defiPlaza.bootstrapNewToken(
      tokenZ.address,
      10000n * ONE,
      tokenA.address,
      { from: trader_Z }
    );
    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenZ.address);
    expect(update.tokenToDelist).to.equal(tokenA.address);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('10000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('5000000000000000000000');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('2');
    expect((await defiPlaza.listedTokens(tokenZ.address)).state).to.be.bignumber.equal('1');
  });

  it('correctly handles over-bootstrapping', async () => {
    await defiPlaza.bootstrapNewToken(
      tokenZ.address,
      40000n * ONE,
      tokenA.address,
      { from: trader_Z }
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(constants.ZERO_ADDRESS);
    expect(update.tokenToDelist).to.equal(constants.ZERO_ADDRESS);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('20000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('10000000000000000000000');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('0');
    tokenZ_status = await defiPlaza.listedTokens(tokenZ.address);
    expect(tokenZ_status.state).to.be.bignumber.equal('3');
  });

  it('accepts listing A for Z', async () => {
    await defiPlaza.changeListing(
      tokenZ.address,
      tokenA.address,
      10000n * ONE
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenA.address);
    expect(update.tokenToDelist).to.equal(tokenZ.address);
    tokenStatusA = await defiPlaza.listedTokens(tokenA.address);
    expect(tokenStatusA.state).to.be.bignumber.equal('1');
    expect(tokenStatusA.listingTarget).to.be.bignumber.equal('10000000000000000000000');
    tokenStatusZ = await defiPlaza.listedTokens(tokenZ.address);
    expect(tokenStatusZ.state).to.be.bignumber.equal('2');
  });

  it('gracefully bootstraps with zero bonus', async () => {
    await tokenA.approve(defiPlaza.address, constants.MAX_UINT256, { from : trader_Z });

    await defiPlaza.bootstrapNewTokenWithBonus(
      tokenA.address,
      2000n * ONE,
      tokenZ.address,
      tokenB.address,
      { from: trader_Z }
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenA.address);
    expect(update.tokenToDelist).to.equal(tokenZ.address);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('16000000000000000000000');
    expect(await tokenA.balanceOf(defiPlaza.address)).to.be.bignumber.equal('2000000000000000000000');
    expect(await tokenZ.balanceOf(trader_Z)).to.be.bignumber.equal('4000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('8000000000000000000000');
    expect(await tokenB.balanceOf(defiPlaza.address)).to.be.bignumber.equal('10000000000000000000000');
    expect(await tokenB.balanceOf(trader_Z)).to.be.bignumber.equal('0');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('1');
    expect((await defiPlaza.listedTokens(tokenZ.address)).state).to.be.bignumber.equal('2');
  });

  it('accepts bonus change by owner', async () => {
    await defiPlaza.setDeListingBonus(1844674407370955264n); // as close to 10% as possible

    config = await defiPlaza.DFP_config();
    expect(config.delistingBonus).to.be.bignumber.equal('1844674407370955264');
  });

  it('rejects bonus change by others', async () => {
    await expectRevert(
      defiPlaza.setDeListingBonus(0n, { from: trader_B }),
      "Ownable: caller is not the owner"
    );

    config = await defiPlaza.DFP_config();
    expect(config.delistingBonus).to.be.bignumber.equal('1844674407370955264');
  });

  it('correctly bootstraps with ETH bonus', async () => {
    await defiPlaza.bootstrapNewTokenWithBonus(
      tokenA.address,
      2000n * ONE,
      tokenZ.address,
      constants.ZERO_ADDRESS,
      { from: trader_Z }
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenA.address);
    expect(update.tokenToDelist).to.equal(tokenZ.address);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('12000000000000000000000');
    expect(await tokenA.balanceOf(defiPlaza.address)).to.be.bignumber.equal('4000000000000000000000');
    expect(await tokenZ.balanceOf(trader_Z)).to.be.bignumber.equal('8000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('6000000000000000000000');
    expect(await web3.eth.getBalance(defiPlaza.address)).to.be.bignumber.equal('9799999999999999989');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('1');
    expect((await defiPlaza.listedTokens(tokenZ.address)).state).to.be.bignumber.equal('2');
  });

  it('correctly bootstraps with tokenB bonus', async () => {
    await defiPlaza.bootstrapNewTokenWithBonus(
      tokenA.address,
      2000n * ONE,
      tokenZ.address,
      tokenB.address,
      { from: trader_Z }
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(tokenA.address);
    expect(update.tokenToDelist).to.equal(tokenZ.address);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('8000000000000000000000');
    expect(await tokenA.balanceOf(defiPlaza.address)).to.be.bignumber.equal('6000000000000000000000');
    expect(await tokenZ.balanceOf(trader_Z)).to.be.bignumber.equal('12000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('4000000000000000000000');
    expect(await tokenB.balanceOf(defiPlaza.address)).to.be.bignumber.equal('9799999999999999988909');
    expect(await tokenB.balanceOf(trader_Z)).to.be.bignumber.equal('200000000000000011091');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('1');
    expect((await defiPlaza.listedTokens(tokenZ.address)).state).to.be.bignumber.equal('2');
  });

  it('gracefully handles outside bootstrapping', async () => {
    await tokenA.transfer(defiPlaza.address, 5000n * ONE);

    await defiPlaza.bootstrapNewTokenWithBonus(
      tokenA.address,
      2000n * ONE,
      tokenZ.address,
      tokenB.address,
      { from: trader_Z }
    );

    update = await defiPlaza.listingUpdate()
    expect(update.tokenToList).to.equal(constants.ZERO_ADDRESS);
    expect(update.tokenToDelist).to.equal(constants.ZERO_ADDRESS);
    expect(await tokenZ.balanceOf(defiPlaza.address)).to.be.bignumber.equal('0');
    expect(await tokenA.balanceOf(defiPlaza.address)).to.be.bignumber.at.least('10000000000000000000000');
    expect(await tokenZ.balanceOf(trader_Z)).to.be.bignumber.equal('20000000000000000000000');
    expect(await tokenA.balanceOf(trader_Z)).to.be.bignumber.equal('3999999999999999999999');
    expect(await tokenB.balanceOf(defiPlaza.address)).to.be.bignumber.equal('9799999999999999988909');
    expect(await tokenB.balanceOf(trader_Z)).to.be.bignumber.equal('200000000000000011091');
    expect((await defiPlaza.listedTokens(tokenA.address)).state).to.be.bignumber.equal('3');
    expect((await defiPlaza.listedTokens(tokenZ.address)).state).to.be.bignumber.equal('0');
  });
});
