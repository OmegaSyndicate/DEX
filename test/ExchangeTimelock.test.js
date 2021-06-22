const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenZ = artifacts.require('TokenZ');
const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');
const Timelock = artifacts.require('Timelock');

const truffleCost = require('truffle-cost');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Timelock on exchange contract', accounts => {
  const [owner, multisig, other, other2, admin, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    tokenC = await TokenC.deployed();
    tokenZ = await TokenZ.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dfpGov = await DFPgov.deployed();
    timelock = await Timelock.deployed();
    startState = await dfpGov.stakingState();

    b32empty = web3.utils.fromAscii("");
    data = defiPlaza.contract.methods.setAdmin(admin).encodeABI();

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenB.transfer(defiPlaza.address, 10000n * ONE);
    await tokenC.transfer(defiPlaza.address, 10000n * ONE);

    await defiPlaza.unlockExchange();
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);
    await dfpGov.setIndexToken(defiPlaza.address);
    await dfpGov.stake(1600n * ONE);    // Need a minimum of 1600 staked at all times

    await defiPlaza.transferOwnership(timelock.address);
  });

  it('owner can no longer update admin directly', async () => {
    await expectRevert(
      defiPlaza.setAdmin(
        admin,
        { from: owner }
      ),
      "Ownable: caller is not the owner"
    );
  });

  it('founder cannot update admin without waiting', async () => {
    await timelock.schedule(defiPlaza.address, 0, data, b32empty, b32empty, 86400, { from: founder });

    await expectRevert(
      timelock.execute(
        defiPlaza.address,
        0,
        data,
        b32empty,
        b32empty,
        { from: founder }
      ),
      "TimelockController: operation is not ready"
    );
  });

  it('founder can update admin after waiting', async () => {
    before = await defiPlaza.admin();
    await time.increase(86400);

    await timelock.execute(
      defiPlaza.address,
      0,
      data,
      b32empty,
      b32empty,
      { from: founder }
    );

    after = await defiPlaza.admin();
    expect(before).to.be.equal(constants.ZERO_ADDRESS);
    expect(after).to.be.equal(admin);
  });
});
