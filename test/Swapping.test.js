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

contract('Swapping', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
    tokenD = await TokenD.deployed()
    omegaDEX = await OmegaDEX.deployed();
    dex = omegaDEX.address;

    await omegaDEX.send(10e18);
    await tokenA.transfer(omegaDEX.address, 10000n * ONE);
    await tokenB.transfer(omegaDEX.address, 20000n * ONE);
    await tokenC.transfer(omegaDEX.address, 50000n * ONE);
    await tokenD.transfer(omegaDEX.address, 100000n * ONE);
    await omegaDEX.unlockExchange();
  });

  it('correctly swaps ETH to tokenA', async () => {
    await tokenA.transfer(trader_eth, 10000n * ONE);
    await truffleCost.log(
      omegaDEX.swap(
        constants.ZERO_ADDRESS,
        tokenA.address,
        1001n*FINNEY,
        909n*ONE,
        { from : trader_eth , value : 1001e15}
      )
    );
    expect(await tokenA.balanceOf(trader_eth))
      .to.be.bignumber.equal('10909090082644384430019');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('9090909917355615569981');
    expect(await web3.eth.getBalance(trader_eth))
      .to.be.bignumber.closeTo('99000000000000000000', '100000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.equal('11001000000000000000');
  });

  it('correctly swaps tokenA to tokenB', async () => {
    await tokenA.transfer(trader_A, 10000n * ONE);
    await tokenB.transfer(trader_A, 10000n * ONE);
    await tokenA.approve(omegaDEX.address, 1001n * ONE, { from : trader_A })
    await truffleCost.log(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1001n*ONE,
        1818n*ONE,
        { from : trader_A }
      )
    );
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('8999000000000000000000');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('10091909917355615569981');
    expect(await tokenB.balanceOf(trader_A))
      .to.be.bignumber.equal('11981980034087696702569');
    expect(await tokenB.balanceOf(dex))
      .to.be.bignumber.equal('18018019965912303297431');
  });

  it('correctly swaps tokenB to ETH', async () => {
    await tokenB.transfer(trader_B, 10000n * ONE);
    await tokenB.approve(omegaDEX.address, 1001n * ONE, { from : trader_B })
    await truffleCost.log(
      omegaDEX.swap(
        tokenB.address,
        constants.ZERO_ADDRESS,
        1001n*ONE,
        196n*FINNEY,
        { from : trader_B }
      )
    );
    expect(await tokenB.balanceOf(trader_B))
      .to.be.bignumber.equal('8999000000000000000000');
    expect(await tokenB.balanceOf(dex))
      .to.be.bignumber.equal('19019019965912303297431');
    expect(await web3.eth.getBalance(trader_B))
      .to.be.bignumber.closeTo('100570000000000000000', '10000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.closeTo('10430000000000000000', '10000000000000000');
  });

  it('gracefully swaps tokenC to tokenC', async () => {
    await tokenC.transfer(trader_C, 10000n * ONE);
    await tokenC.approve(omegaDEX.address, 1001n * ONE, { from : trader_C })
    await truffleCost.log(
      omegaDEX.swap(
        tokenC.address,
        tokenC.address,
        1001n*ONE,
        1000n*ONE,
        { from : trader_C }
      )
    );
    expect(await tokenC.balanceOf(trader_C))
      .to.be.bignumber.to.be.below((10000n*ONE).toString());
    expect(await tokenC.balanceOf(dex))
      .to.be.bignumber.to.be.above((50000n*ONE).toString());
  });

  it('rejects to swap nonlisted tokenD', async () => {
    await tokenD.transfer(trader_D, 10000n * ONE);
    await tokenD.approve(omegaDEX.address, 1001n * ONE, { from : trader_D })
    await expectRevert(
      omegaDEX.swap(
        tokenD.address,
        tokenA.address,
        1001n*ONE,
        0,
        { from : trader_D }
      ),
      "ODX: Token not listed."
    );
  });

  it('rejects trades when exchange is locked', async () => {
    await omegaDEX.lockExchange({ from: owner })
    await tokenA.approve(omegaDEX.address, 1001n * ONE, { from : trader_A })
    await expectRevert(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1001n*ONE,
        0,
        { from : trader_A }
      ),
      "ODX: Locked."
    );
    await omegaDEX.unlockExchange({ from: owner })
  });

  it('rejects trades when asking too much', async () => {
    await tokenA.approve(omegaDEX.address, 1001n * ONE, { from : trader_A })
    await expectRevert(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1001n*ONE,
        1820n*ONE,
        { from : trader_A }
      ),
      "ODX: No deal."
    );
  });
});
