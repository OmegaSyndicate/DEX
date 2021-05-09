const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const DeFiPlaza = artifacts.require('DPL1');
const DPLgov = artifacts.require('DPLgov');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
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

    await defiPlaza.transfer(staker_1, 200n*ONE);
    await defiPlaza.transfer(staker_2, 200n*ONE);
    await defiPlaza.transfer(staker_3, 200n*ONE);
  });

  it('Accepts stake', async () => {
    await defiPlaza.approve(dplGov.address, constants.MAX_UINT256, { from : staker_1 });
    await truffleCost.log(
      dplGov.stake(
        200n * ONE,
        { from : staker_1 }
      )
    );
    state = await dplGov.stakingState();
    expect(state.totalStake).to.be.bignumber.equal('200000000000000000000');
    staker = await dplGov.stakerData(staker_1);
    expect(state.totalStake).to.be.bignumber.equal('200000000000000000000');
  });

});
