const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const DeFiPlaza = artifacts.require('DPL1');
const DPLgov = artifacts.require('DPLgov');

const truffleCost = require('truffle-cost');
const { constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Staking for governance tokens', accounts => {
  const [owner, staker_1, staker_2, staker_3] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenB = await TokenB.deployed()
    tokenC = await TokenC.deployed()
    defiPlaza = await DeFiPlaza.deployed();
    dplGov = await DPLgov.deployed();

    await defiPlaza.unlockExchange();
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256);
    await dplGov.stake(1600n * ONE);    // Need a minimum of 1600 staked at all times
  });

  it('correctly initializes to 1600 stake', async () => {
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
  }); //total stake now 1600

  it('correctly accepts stake from staker 1', async () => {
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenA.transfer(staker_1, 1000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : staker_1 });
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : staker_1 });
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_1 });

    await truffleCost.log(
      dplGov.stake(
        8n * ONE,
        { from : staker_1 }
      )
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1608000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1608000000000000000000');
    staker = await dplGov.stakerData(staker_1);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
  }); //total stake now 1608

  it('correctly accepts stake from staker 2', async () => {
    await tokenA.transfer(staker_2, 1000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : staker_2 });
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : staker_2 });
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_2 });

    await truffleCost.log(
      dplGov.stake(
        4n * ONE,
        { from : staker_2 }
      )
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1612000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1612000000000000000000');
    staker = await dplGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('4000000000000000000');
  }); //total stake now 1612

  it('gracefully handles adding zero stake', async () => {
    await time.increaseTo(1638266400); // jump to half a year after program start ahead
    await truffleCost.log(
      dplGov.stake(
        0n * ONE,
        { from : staker_1 }
      )
    );
    state = await dplGov.stakingState();      // three fourth of rewards should be allocated at halftime
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.equal('47809566377439584297468188585');
    staker = await dplGov.stakerData(staker_1);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('0');
  }); //total stake now 1612

  it('correctly handles zero unstake', async () => {
    await truffleCost.log(
      dplGov.unstake(
        0n * ONE,
        { from : staker_1 }
      )
    );
    rewards = await dplGov.balanceOf(staker_1);
    expect(rewards).to.be.bignumber.equal('316377171215880893300248');
    staker = await dplGov.stakerData(staker_1);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    state = await dplGov.stakingState();
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal(state.rewardsAccumulatedPerLP);
  }); //total stake now 1612


  it('allows adding to an existing stake', async () => {
    await truffleCost.log(
      dplGov.stake(
        4n * ONE,
        { from : staker_2 }
      )
    );
    staker = await dplGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('23904783188719792148734094292');  // Should be half of the state.rewardsAccumulatedPerLP
    rewards = await dplGov.balanceOf(staker_2);
    expect(rewards).to.be.bignumber.equal('0'); // No rewards given out yet
  }); //total stake now 1616


});
