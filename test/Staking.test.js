const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const DeFiPlaza = artifacts.require('DPL1');
const DPLgov = artifacts.require('DPLgov');

const truffleCost = require('truffle-cost');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Staking for governance tokens', accounts => {
  const [owner, staker_1, staker_2, staker_3] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    tokenC = await TokenC.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dplGov = await DPLgov.deployed();
    startState = await dplGov.stakingState();

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

  it('correctly returns tokens when asked', async () => {
    await dplGov.unstake(12n * ONE);
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1588000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1588000000000000000000');
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.equal('0');
    returned = await defiPlaza.balanceOf(owner);
    expect(returned).to.be.bignumber.equal('12000000000000000000');
  }); //total stake now 1588

  it('correctly accepts stake from staker 1', async () => {
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenA.transfer(staker_1, 1000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : staker_1 });
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : staker_1 });
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_1 });

    await dplGov.stake(
      8n * ONE,
      { from : staker_1 }
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1596000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1596000000000000000000');
    staker = await dplGov.stakerData(staker_1);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
  }); //total stake now 1596

  it('correctly accepts stake from staker 2', async () => {
    await tokenA.transfer(staker_2, 1000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : staker_2 });
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : staker_2 });
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_2 });

    await dplGov.stake(
      4n * ONE,
      { from : staker_2 }
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
    staker = await dplGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('4000000000000000000');
  }); //total stake now 1600

  it('distributes rewards on zero unstake', async () => {
    await time.increaseTo(7884000n.add(startState.startTime)); // jump to a quarter year after program start
    await dplGov.unstake(
      0n * ONE,
      { from : staker_1 }
    );
    rewards = await dplGov.balanceOf(staker_1);
    expect(rewards).to.be.bignumber.equal('185937500000000000000000'); // 7/16th of rewards distributed
    staker = await dplGov.stakerData(staker_1);
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('28098080573074389021491200000');
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    state = await dplGov.stakingState();
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.equal('28098080573074389021491200000');
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
  }); //total stake now 1600

  it('gracefully handles adding zero stake', async () => {
    await time.increaseTo(1622498400+11826000); // jump to a quarter year after program start
    await dplGov.stake(
      0n * ONE,
      { from : staker_2 }
    );
    state = await dplGov.stakingState();  // 39/64th of rewards now distributed
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.equal('39136612226782184708505600000');
    staker = await dplGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('4000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('0');
  }); //total stake now 1600

  it('correctly adds to an existing stake', async () => {
    await time.increaseTo(1622498400+15768000); // jump to half a year after program start ahead
    await dplGov.stake(
      4n * ONE,
      { from : staker_2 }
    );
    staker = await dplGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('24084069062635190589849600000');  // 3/4th of rewards distributed
    rewards = await dplGov.balanceOf(staker_2);
    expect(rewards).to.be.bignumber.equal('0'); // No rewards given out yet
  }); //total stake now 1604

  it('correctly accepts stake from staker 3', async () => {
    await tokenA.transfer(staker_3, 2500n * ONE);
    await tokenA.approve(defiPlaza.address, 2500n*ONE, { from : staker_3 });
    await defiPlaza.addLiquidity(tokenA.address, 2500n * ONE, 0n, { from : staker_3 });
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_3 });

    await time.increaseTo(1622498400+23652000); // jump to three quarters after program start ahead
    await dplGov.stake(
      8n * ONE,
      { from : staker_3 }
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1612000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1612000000000000000000');
    staker = await dplGov.stakerData(staker_3);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
  }); //total stake now 1612

  it('returns tokens and rewards on unstake', async () => {
    await time.increaseTo(1622498400+23652000); // jump to 7/8th year after program start ahead
    await dplGov.unstake(
      4n * ONE,
      { from: owner }
    );
    balance = await defiPlaza.balanceOf(dplGov.address);
    expect(balance).to.be.bignumber.equal('1608000000000000000000');
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1608000000000000000000');
    staker = await dplGov.stakerData(owner);
    expect(staker.stake).to.be.bignumber.equal('1584000000000000000000');
    returned = await defiPlaza.balanceOf(owner);
    expect(returned).to.be.bignumber.equal('16000000000000000000');
    rewards = await dplGov.balanceOf(owner);
    expect(rewards).to.be.bignumber.equal('79050397443890274314214463');
  }); //total stake now 1608

  it('concludes program correctly', async () => {
    await time.increaseTo(1937858400); // jump to ten years after program start
    await dplGov.unstake(1584n * ONE, { from : owner });
    await dplGov.unstake(8n * ONE, { from : staker_1 });
    await dplGov.unstake(8n * ONE, { from : staker_2 });
    await dplGov.unstake(8n * ONE, { from : staker_3 });
    totalGov = await dplGov.totalSupply();
    expect(totalGov).to.be.bignumber.equal('89999999999999999999999997');
  });

});
