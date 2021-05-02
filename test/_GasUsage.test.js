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

contract('GasUsage', accounts => {
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

  it('swap ETH to A high gas usage (no A yet)', async () => {
    await truffleCost.log(
      omegaDEX.swap(
        constants.ZERO_ADDRESS,
        tokenA.address,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('swap ETH to A low gas usage (already has A)', async () => {
    await truffleCost.log(
      omegaDEX.swap(
        constants.ZERO_ADDRESS,
        tokenA.address,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('swap A to B highest usage (no B yet, keeps some A)', async () => {
    await tokenA.transfer(trader_A, 3000n * ONE);
    await tokenA.approve(omegaDEX.address, 4000n * ONE, { from : trader_A })
    await truffleCost.log(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('swap A to B medium usage (has B, keeps some A)', async () => {
    await truffleCost.log(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('swap A to B low usage (has B, spends all A)', async () => {
    await truffleCost.log(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('swap A to B lowest usage (has B, spends all A & allowance)', async () => {
    await tokenA.transfer(trader_A, 1000n * ONE);
    await truffleCost.log(
      omegaDEX.swap(
        tokenA.address,
        tokenB.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('swap B to ETH medium usage (keeps some B)', async () => {
    await tokenB.transfer(trader_B, 2000n * ONE);
    await tokenB.approve(omegaDEX.address, 3000n * ONE, { from : trader_B })
    await truffleCost.log(
      omegaDEX.swap(
        tokenB.address,
        constants.ZERO_ADDRESS,
        1000n*ONE,
        0n,
        { from : trader_B }
      )
    );
  });

  it('swap B to ETH low usage (spends all B)', async () => {
    await truffleCost.log(
      omegaDEX.swap(
        tokenB.address,
        constants.ZERO_ADDRESS,
        1000n*ONE,
        0n,
        { from : trader_B }
      )
    );
  });

  it('swap B to ETH lowest usage (spends all B & allowance)', async () => {
    await tokenB.transfer(trader_B, 1000n * ONE);
    await truffleCost.log(
      omegaDEX.swap(
        tokenB.address,
        constants.ZERO_ADDRESS,
        1000n*ONE,
        0n,
        { from : trader_B }
      )
    );
  });

  it('add ETH liquidity high (no ODX yet)', async () => {
    await truffleCost.log(
      omegaDEX.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('add ETH liquidity low (has ODX)', async () => {
    await truffleCost.log(
      omegaDEX.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('add A liquidity high (no ODX yet, keep some A)', async () => {
    await tokenA.transfer(trader_A, 3000n * ONE);
    await tokenA.approve(omegaDEX.address, 4000n * ONE, { from : trader_A })
    await truffleCost.log(
      omegaDEX.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity medium (has ODX, keep some A)', async () => {
    await truffleCost.log(
      omegaDEX.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity low (has ODX, spend all A)', async () => {
    await truffleCost.log(
      omegaDEX.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity lowest (has ODX, spend all A & allowance)', async () => {
    await tokenA.transfer(trader_A, 1000n * ONE);
    await truffleCost.log(
      omegaDEX.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('remove ETH liquidity medium (keep some liquidity)', async () => {
    await omegaDEX.transfer(trader_C, 2n * ONE);
    await truffleCost.log(
      omegaDEX.removeLiquidity(
        1n * ONE,
        constants.ZERO_ADDRESS,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove ETH liquidity low (withdraw all)', async () => {
    await truffleCost.log(
      omegaDEX.removeLiquidity(
        1n * ONE,
        constants.ZERO_ADDRESS,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity high (no A yet, keep some liq)', async () => {
    await omegaDEX.transfer(trader_C, 3n * ONE);
    await truffleCost.log(
      omegaDEX.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity medium (has A, keep some liq)', async () => {
    await truffleCost.log(
      omegaDEX.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity low (has A, spend all liq)', async () => {
    await truffleCost.log(
      omegaDEX.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

});