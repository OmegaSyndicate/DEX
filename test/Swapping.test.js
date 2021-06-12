const DeFiPlaza = artifacts.require('DeFiPlaza');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenZ = artifacts.require('TokenZ');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Swapping', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_Z] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
    tokenZ = await TokenZ.deployed()
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenB.transfer(defiPlaza.address, 20000n * ONE);
    await tokenC.transfer(defiPlaza.address, 50000n * ONE);
    await tokenZ.transfer(defiPlaza.address, 100000n * ONE);
    await defiPlaza.unlockExchange();
  });

  it('correctly swaps ETH to tokenA', async () => {
    await tokenA.transfer(trader_eth, 10000n * ONE);
    await defiPlaza.swap(
      constants.ZERO_ADDRESS,
      tokenA.address,
      1001n*FINNEY,
      909n*ONE,
      { from : trader_eth , value : 1001e15}
    );
    expect(await tokenA.balanceOf(trader_eth))
      .to.be.bignumber.equal('10909090082644552966951');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('9090909917355447033049');
    expect(await web3.eth.getBalance(trader_eth))
      .to.be.bignumber.closeTo('99000000000000000000', '100000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.equal('11001000000000000000');
  });

  it('correctly swaps tokenA to tokenB', async () => {
    await tokenA.transfer(trader_A, 10000n * ONE);
    await tokenB.transfer(trader_A, 10000n * ONE);
    await tokenA.approve(defiPlaza.address, 1001n * ONE, { from : trader_A })
    await defiPlaza.swap(
      tokenA.address,
      tokenB.address,
      1001n*ONE,
      1818n*ONE,
      { from : trader_A }
    );
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('8999000000000000000000');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('10091909917355447033049');
    expect(await tokenB.balanceOf(trader_A))
      .to.be.bignumber.equal('11981980034088093935899');
    expect(await tokenB.balanceOf(dex))
      .to.be.bignumber.equal('18018019965911906064101');
  });

  it('correctly swaps tokenB to ETH', async () => {
    await tokenB.transfer(trader_B, 10000n * ONE);
    await tokenB.approve(defiPlaza.address, 1001n * ONE, { from : trader_B })
    await defiPlaza.swap(
      tokenB.address,
      constants.ZERO_ADDRESS,
      1001n*ONE,
      196n*FINNEY,
      { from : trader_B }
    );
    expect(await tokenB.balanceOf(trader_B))
      .to.be.bignumber.equal('8999000000000000000000');
    expect(await tokenB.balanceOf(dex))
      .to.be.bignumber.equal('19019019965911906064101');
    expect(await web3.eth.getBalance(trader_B))
      .to.be.bignumber.closeTo('100570000000000000000', '10000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.closeTo('10430000000000000000', '10000000000000000');
  });

  it('gracefully swaps ETH to ETH', async () => {
    before = await web3.eth.getBalance(dex);
    await defiPlaza.swap(
      constants.ZERO_ADDRESS,
      constants.ZERO_ADDRESS,
      1n*ONE,
      0n,
      { from : trader_eth, value : 1e18 }
    );
    after = await web3.eth.getBalance(dex);
    expect(after).to.be.bignumber.above(before);
  });

  it('gracefully swaps tokenC to tokenC', async () => {
    before = await tokenC.balanceOf(dex);
    await tokenC.transfer(trader_C, 10000n * ONE);
    await tokenC.approve(defiPlaza.address, 1001n * ONE, { from : trader_C })
    await defiPlaza.swap(
      tokenC.address,
      tokenC.address,
      1001n*ONE,
      0n,
      { from : trader_C }
    );
    after = await tokenC.balanceOf(dex);
    expect(after).to.be.bignumber.above(before);
  });

  it('rejects to swap nonlisted tokenZ', async () => {
    await tokenZ.transfer(trader_Z, 10000n * ONE);
    await tokenZ.approve(defiPlaza.address, 1001n * ONE, { from : trader_Z })
    await expectRevert(
      defiPlaza.swap(
        tokenZ.address,
        tokenA.address,
        1001n*ONE,
        0,
        { from : trader_Z }
      ),
      "DFP: Token not listed"
    );
  });

  it('rejects trades when exchange is locked', async () => {
    await defiPlaza.lockExchange({ from: owner })
    await tokenA.approve(defiPlaza.address, 1001n * ONE, { from : trader_A })
    await expectRevert(
      defiPlaza.swap(
        tokenA.address,
        tokenB.address,
        1001n*ONE,
        0,
        { from : trader_A }
      ),
      "DFP: Locked"
    );
    await defiPlaza.unlockExchange({ from: owner })
  });

  it('rejects trades when asking too much', async () => {
    await tokenA.approve(defiPlaza.address, 1001n * ONE, { from : trader_A })
    await expectRevert(
      defiPlaza.swap(
        tokenA.address,
        tokenB.address,
        1001n*ONE,
        1820n*ONE,
        { from : trader_A }
      ),
      "DFP: No deal"
    );
  });
});
