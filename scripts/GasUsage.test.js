const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenD = artifacts.require('TokenD');
const TokenE = artifacts.require('TokenE');
const TokenF = artifacts.require('TokenF');
const TokenG = artifacts.require('TokenG');
const TokenH = artifacts.require('TokenH');
const TokenI = artifacts.require('TokenI');
const TokenJ = artifacts.require('TokenJ');
const TokenK = artifacts.require('TokenK');
const TokenL = artifacts.require('TokenL');
const TokenM = artifacts.require('TokenM');
const TokenN = artifacts.require('TokenN');
const TokenZ = artifacts.require('TokenZ');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('GasUsage', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
    tokenD = await TokenD.deployed()
    tokenE = await TokenE.deployed();
    tokenF = await TokenF.deployed();
    tokenG = await TokenG.deployed();
    tokenH = await TokenH.deployed();
    tokenI = await TokenI.deployed();
    tokenJ = await TokenJ.deployed();
    tokenK = await TokenK.deployed();
    tokenL = await TokenL.deployed();
    tokenM = await TokenM.deployed();
    tokenN = await TokenN.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dfpGov = await DFPgov.deployed();
    startState = await dfpGov.stakingState();

    await defiPlaza.send(10e18);
    await dfpGov.setIndexToken(defiPlaza.address);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenB.transfer(defiPlaza.address, 10000n * ONE);
    await tokenC.transfer(defiPlaza.address, 10000n * ONE);
    await tokenD.transfer(defiPlaza.address, 10000n * ONE);
    await tokenE.transfer(defiPlaza.address, 10000n * ONE);
    await tokenF.transfer(defiPlaza.address, 10000n * ONE);
    await tokenG.transfer(defiPlaza.address, 10000n * ONE);
    await tokenH.transfer(defiPlaza.address, 10000n * ONE);
    await tokenI.transfer(defiPlaza.address, 5000n * ONE);
    await tokenJ.transfer(defiPlaza.address, 5000n * ONE);
    await tokenK.transfer(defiPlaza.address, 5000n * ONE);
    await tokenL.transfer(defiPlaza.address, 5000n * ONE);
    await tokenM.transfer(defiPlaza.address, 20000n * ONE);
    await tokenN.transfer(defiPlaza.address, 20000n * ONE);
    await defiPlaza.unlockExchange();

    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);
  });

  it('swap ETH to A high gas usage (no A yet)', async () => {
    await truffleCost.log(
      defiPlaza.swap(
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
      defiPlaza.swap(
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
    await tokenA.approve(defiPlaza.address, 4000n * ONE, { from : trader_A })
    await truffleCost.log(
      defiPlaza.swap(
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
      defiPlaza.swap(
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
      defiPlaza.swap(
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
      defiPlaza.swap(
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
    await tokenB.approve(defiPlaza.address, 3000n * ONE, { from : trader_B })
    await truffleCost.log(
      defiPlaza.swap(
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
      defiPlaza.swap(
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
      defiPlaza.swap(
        tokenB.address,
        constants.ZERO_ADDRESS,
        1000n*ONE,
        0n,
        { from : trader_B }
      )
    );
  });

  it('add ETH liquidity high (no XDP1 yet)', async () => {
    await truffleCost.log(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('add ETH liquidity low (has XDP1)', async () => {
    await truffleCost.log(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 1e18}
      )
    );
  });

  it('add A liquidity high (no XDP1 yet, keep some A)', async () => {
    await tokenA.transfer(trader_A, 3000n * ONE);
    await tokenA.approve(defiPlaza.address, 4000n * ONE, { from : trader_A })
    await truffleCost.log(
      defiPlaza.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity medium (has XDP1, keep some A)', async () => {
    await truffleCost.log(
      defiPlaza.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity low (has XDP1, spend all A)', async () => {
    await truffleCost.log(
      defiPlaza.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('add A liquidity lowest (has XDP1, spend all A & allowance)', async () => {
    await tokenA.transfer(trader_A, 1000n * ONE);
    await truffleCost.log(
      defiPlaza.addLiquidity(
        tokenA.address,
        1000n * ONE,
        0n,
        { from : trader_A }
      )
    );
  });

  it('remove ETH liquidity medium (keep some liquidity)', async () => {
    await defiPlaza.transfer(trader_C, 2n * ONE);
    await truffleCost.log(
      defiPlaza.removeLiquidity(
        1n * ONE,
        constants.ZERO_ADDRESS,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove ETH liquidity low (withdraw all)', async () => {
    await truffleCost.log(
      defiPlaza.removeLiquidity(
        1n * ONE,
        constants.ZERO_ADDRESS,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity high (no A yet, keep some liq)', async () => {
    await defiPlaza.transfer(trader_C, 3n * ONE);
    await truffleCost.log(
      defiPlaza.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity medium (has A, keep some liq)', async () => {
    await truffleCost.log(
      defiPlaza.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

  it('remove A liquidity low (has A, spend all liq)', async () => {
    await truffleCost.log(
      defiPlaza.removeLiquidity(
        1n * ONE,
        tokenA.address,
        0n,
        { from : trader_C }
      )
    );
  });

  it('staking all LPs with no stake existing yet', async () => {
    await defiPlaza.addLiquidity(constants.ZERO_ADDRESS, 5n*ONE, 0n, { value : 5e18});
    await dfpGov.stake(1600n * ONE);    // Need a minimum of 1600 staked at all times
    balance = await defiPlaza.balanceOf(trader_A);
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256, { from : trader_A });
    await truffleCost.log(
      dfpGov.stake(
        balance,
        { from : trader_A }
      )
    );
  });

  it('adding all LPs to existing stake', async () => {
    await tokenA.transfer(trader_A, 3000n * ONE);
    await tokenA.approve(defiPlaza.address, 4000n * ONE, { from : trader_A })
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : trader_A });
    balance = await defiPlaza.balanceOf(trader_A);
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256, { from : trader_A });
    await truffleCost.log(
      dfpGov.stake(
        balance,
        { from : trader_A }
      )
    );
  });

  it('claim first rewards without unstaking', async () => {
    await time.increase(2592000n); // 30d increase
    await truffleCost.log(
      dfpGov.unstake(
        0n,
        { from : trader_A }
      )
    );
  });

  it('unstake and claim everything (already has DFP)', async () => {
    stakerData = await dfpGov.stakerData(trader_A);
    await time.increase(2592000n); // 30d increase
    await truffleCost.log(
      dfpGov.unstake(
        stakerData.stake,
        { from : trader_A }
      )
    );
  });

  it('add multiple tokens', async () => {  // Relatively small variance so only one test here.
    tokens = [constants.ZERO_ADDRESS,
      tokenA.address.toLowerCase(), tokenB.address.toLowerCase(), tokenC.address.toLowerCase(),
      tokenD.address.toLowerCase(), tokenE.address.toLowerCase(), tokenF.address.toLowerCase(),
      tokenG.address.toLowerCase(), tokenH.address.toLowerCase(), tokenI.address.toLowerCase(),
      tokenJ.address.toLowerCase(), tokenK.address.toLowerCase(), tokenL.address.toLowerCase(),
      tokenM.address.toLowerCase(), tokenN.address.toLowerCase(), dfpGov.address.toLowerCase()].sort();

    maxAmounts = [];
    for (i = 0; i < 16; i++) {
      maxAmounts.push(1n * ONE);
    }

    await tokenA.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenB.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenC.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenD.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenE.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenF.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenG.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenH.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenI.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenJ.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenK.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenL.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenM.approve(defiPlaza.address, constants.MAX_UINT256);
    await tokenN.approve(defiPlaza.address, constants.MAX_UINT256);
    await dfpGov.approve(defiPlaza.address, constants.MAX_UINT256);
    await dfpGov.transfer(owner, 1000000n * ONE, { from: founder });

    await truffleCost.log(
      defiPlaza.addMultiple(
        tokens,
        maxAmounts,
        { value :  Number(maxAmounts[0]) }
      )
    );
  });

  it('remove multiple tokens high (no balances yet)', async () => {
    await defiPlaza.transfer(founder, 2n * ONE);

    await truffleCost.log(
      defiPlaza.removeMultiple(
        1n * ONE,
        tokens,
        { from: founder }
      )
    );
  });

  it('remove multiple tokens low (has balances)', async () => {
    await truffleCost.log(
      defiPlaza.removeMultiple(
        1n * ONE,
        tokens,
        { from: founder }
      )
    );
  });
});
