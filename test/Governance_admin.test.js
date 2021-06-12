const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const DeFiPlaza = artifacts.require('XDP1');
const DFPgov = artifacts.require('DFPgov');

const truffleCost = require('truffle-cost');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Admin features of governance contract', accounts => {
  const [owner, multisig, other, other2, other3, founder] = accounts;

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

  it('cannot update index token once configured', async () => {
    await expectRevert(
      dfpGov.setIndexToken(other),
      "Already configured"
    )
  });

  it('owner can change multisig address', async () => {
    await dfpGov.setMultisigAddress(multisig);
    addr = await dfpGov.multisig();
    expect(addr).to.equal(multisig);
  });

  it('others cannot change multisig address', async () => {
    await expectRevert(
      dfpGov.setMultisigAddress(
        other,
        { from : other }
      ),
      "Ownable: caller is not the owner"
    );
  });

  it('multisig claim fails before rewards start', async () => {
    await expectRevert(
      dfpGov.claimMultisigAllocation(),
      "Too early guys"
    );
  });

  it('multisig claim gives out correct amount', async () => {
    await time.increaseTo(BigInt(startState.startTime.toString()) + 15768000n); // jump to half a year after program start
    await dfpGov.claimMultisigAllocation();
    balance = await dfpGov.balanceOf(multisig);
    expect(balance).to.be.bignumber.equal('3750000000000000000000000'); // three quarters of final
  });

  it('multisig asking again doesnt give more', async () => {
    await dfpGov.claimMultisigAllocation();
    balance = await dfpGov.balanceOf(multisig);
    expect(balance).to.be.bignumber.at.most('3750000158548954891268395'); // up to 1s execution time slack
  });

  it('non-founder cannot claim founder reward', async () => {
    await expectRevert(
      dfpGov.claimFounderAllocation(ONE, owner),
      "Not yours man"
    );
  });

  it('founder reward not available before end of program', async () => {
    await expectRevert(
      dfpGov.claimFounderAllocation(1000000n * ONE, other2, { from : founder}),
      "Too early man"
    );
  });

  it('founder reward available after end of program', async () => {
    await time.increaseTo(BigInt(startState.startTime.toString()) + 157680000n); // jump to 5 years after program start
    await dfpGov.claimFounderAllocation(
      1000000n * ONE,
      other2,
      { from : founder}
    );
    balance = await dfpGov.balanceOf(other2);
    expect(balance).to.be.bignumber.equal('1000000000000000000000000');
  });

  it('founder can claim up to 5M tokens', async () => {
    await dfpGov.claimFounderAllocation(
      4000000n * ONE,
      other3,
      { from : founder}
    );
    balance = await dfpGov.balanceOf(other3);
    expect(balance).to.be.bignumber.equal('4000000000000000000000000');
  });

  it('founder cannot claim more than 5M tokens', async () => {
    await expectRevert(
      dfpGov.claimFounderAllocation(
        1n,
        founder,
        { from : founder}
      ),
      "Too much man"
    );
    balance = await dfpGov.balanceOf(founder);
    expect(balance).to.be.bignumber.equal('4000000000000000000000000'); // these were issued at construction
  });

  it('multisig final amount is correct', async () => {
    await dfpGov.claimMultisigAllocation();
    balance = await dfpGov.balanceOf(multisig);
    expect(balance).to.be.bignumber.equal('5000000000000000000000000'); // all
  });
});
