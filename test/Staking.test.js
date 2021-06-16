const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

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
    dfpGov = await DFPgov.deployed();
    startState = await dfpGov.stakingState();

    await defiPlaza.unlockExchange();
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);
    await dfpGov.setIndexToken(defiPlaza.address);
    await dfpGov.stake(1600n * ONE);    // Need a minimum of 1600 staked at all times
  });

  it('correctly initializes to 1600 stake', async () => {
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
  }); //total stake now 1600

  it('correctly returns tokens when asked', async () => {
    await dfpGov.unstake(12n * ONE);
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1588000000000000000000');
    state = await dfpGov.stakingState();
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
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256, { from : staker_1 });

    await dfpGov.stake(
      8n * ONE,
      { from : staker_1 }
    );
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1596000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1596000000000000000000');
    staker = await dfpGov.stakerData(staker_1);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
  }); //total stake now 1596

  it('cannot unstake more than was staked', async () => {
    await expectRevert(
      dfpGov.unstake(1588n * ONE + 1n),
      "DFP: Insufficient stake"
    )
  });

  it('correctly accepts stake from staker 2', async () => {
    await tokenA.transfer(staker_2, 1000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : staker_2 });
    await defiPlaza.addLiquidity(tokenA.address, 1000n * ONE, 0n, { from : staker_2 });
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256, { from : staker_2 });

    await dfpGov.stake(
      4n * ONE,
      { from : staker_2 }
    );
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
    staker = await dfpGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('4000000000000000000');
  }); //total stake now 1600

  it('distributes rewards on zero unstake', async () => {
    await time.increaseTo(BigInt(startState.startTime.toString()) + 7884000n); // jump to a quarter year after program start
    await dfpGov.unstake(
      0n * ONE,
      { from : staker_1 }
    );
    rewards = await dfpGov.balanceOf(staker_1);
    expect(rewards).to.be.bignumber.at.least('185937500000000000000000'); // 7/16th of rewards distributed
    expect(rewards).to.be.bignumber.lt('185937530000000000000000'); // some leeway for ±1s execution time differences
    staker = await dfpGov.stakerData(staker_1);
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.at.least('28098080573074389021491200000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.lt('28098084000000000000000000000');
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.equal(staker.rewardsPerLPAtTimeStaked);
    expect(state.totalStake).to.be.bignumber.equal('1600000000000000000000');
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1600000000000000000000');
  }); //total stake now 1600

  it('gracefully handles adding zero stake', async () => {
    await time.increaseTo(BigInt(startState.startTime.toString()) + 11826000n); // jump to a quarter year after program start
    await dfpGov.stake(
      0n * ONE,
      { from : staker_2 }
    );
    state = await dfpGov.stakingState();  // 39/64th of rewards now distributed
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.at.least('39136612226782184708505599999');
    expect(state.rewardsAccumulatedPerLP).to.be.bignumber.lt('39136615000000000000000000000'); // some leeway for ±1s exectuion time differences
    staker = await dfpGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('4000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.equal('0');
  }); //total stake now 1600

  it('correctly adds to an existing stake', async () => {
    await time.increaseTo(BigInt(startState.startTime.toString()) + 15768000n); // jump to half a year after program start ahead
    await dfpGov.stake(
      4n * ONE,
      { from : staker_2 }
    );
    staker = await dfpGov.stakerData(staker_2);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.at.least('24084069062635190589849599999');  // 3/4th of rewards distributed
    expect(staker.rewardsPerLPAtTimeStaked).to.be.bignumber.lt('24084080000000000000000000000');  // some leeway for <1s execution time differences
    rewards = await dfpGov.balanceOf(staker_2);
    expect(rewards).to.be.bignumber.equal('0'); // No rewards given out yet
  }); //total stake now 1604

  it('correctly accepts stake from staker 3', async () => {
    await tokenA.transfer(staker_3, 2500n * ONE);
    await tokenA.approve(defiPlaza.address, 2500n*ONE, { from : staker_3 });
    await defiPlaza.addLiquidity(tokenA.address, 2500n * ONE, 0n, { from : staker_3 });
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256, { from : staker_3 });

    await time.increaseTo(BigInt(startState.startTime.toString()) + 23652000n); // jump to three quarters after program start ahead
    await dfpGov.stake(
      8n * ONE,
      { from : staker_3 }
    );
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1612000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1612000000000000000000');
    staker = await dfpGov.stakerData(staker_3);
    expect(staker.stake).to.be.bignumber.equal('8000000000000000000');
  }); //total stake now 1612

  it('returns tokens and rewards on unstake', async () => {
    await dfpGov.unstake(
      4n * ONE,
      { from: owner }
    );
    balance = await defiPlaza.balanceOf(dfpGov.address);
    expect(balance).to.be.bignumber.equal('1608000000000000000000');
    state = await dfpGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('1608000000000000000000');
    staker = await dfpGov.stakerData(owner);
    expect(staker.stake).to.be.bignumber.equal('1584000000000000000000');
    returned = await defiPlaza.balanceOf(owner);
    expect(returned).to.be.bignumber.equal('16000000000000000000');
    rewards = await dfpGov.balanceOf(owner);
    expect(rewards).to.be.bignumber.at.least('79050397443890274314214463');
    expect(rewards).to.be.bignumber.lt('79050401000000000000000000'); // some leeway for small execution time differences
  }); //total stake now 1608

  it('concludes program correctly', async () => {
    await time.increaseTo(1937858400); // jump to ten years after program start
    await dfpGov.unstake(1584n * ONE, { from : owner });
    await dfpGov.unstake(8n * ONE, { from : staker_1 });
    await dfpGov.unstake(8n * ONE, { from : staker_2 });
    await dfpGov.unstake(8n * ONE, { from : staker_3 });
    totalGov = await dfpGov.totalSupply();
    expect(totalGov).to.be.bignumber.at.least('89999999999999999999999997');
    expect(totalGov).to.be.bignumber.at.most('90000000000000000000000000'); // some leeway for ±1s execution time differences
  });

});
