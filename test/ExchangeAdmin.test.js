const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenZ = artifacts.require('TokenZ');
const DeFiPlaza = artifacts.require('DeFiPlaza');
const DFPgov = artifacts.require('DFPgov');

const truffleCost = require('truffle-cost');
const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('Admin features of exchange contract', accounts => {
  const [owner, multisig, other, other2, admin, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    tokenC = await TokenC.deployed();
    tokenZ = await TokenZ.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dfpGov = await DFPgov.deployed();
    startState = await dfpGov.stakingState();

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenB.transfer(defiPlaza.address, 10000n * ONE);
    await tokenC.transfer(defiPlaza.address, 10000n * ONE);

    await defiPlaza.unlockExchange();
    await defiPlaza.approve(dfpGov.address, constants.MAX_UINT256);
    await dfpGov.setIndexToken(defiPlaza.address);
    await dfpGov.stake(1600n * ONE);    // Need a minimum of 1600 staked at all times
  });

  it('owner can update admin', async () => {
    before = await defiPlaza.admin();

    await defiPlaza.setAdmin(
      admin,
      { from: owner }
    );

    after = await defiPlaza.admin();
    expect(before).to.be.equal(constants.ZERO_ADDRESS);
    expect(after).to.be.equal(admin);
  });

  it('others cannot update admin', async () => {
    await expectRevert(
      defiPlaza.setAdmin(
        admin,
        { from: other }
      ),
      "Ownable: caller is not the owner"
    );
  });

  it('owner can lock exchange', async () => {
    before = (await defiPlaza.DFPconfig()).unlocked;

    defiPlaza.lockExchange({ from: owner });

    after = (await defiPlaza.DFPconfig()).unlocked;
    expect(before).to.be.true;
    expect(after).to.be.false;
  });

  it('owner can unlock exchange', async () => {
    before = (await defiPlaza.DFPconfig()).unlocked;

    defiPlaza.unlockExchange({ from: owner });

    after = (await defiPlaza.DFPconfig()).unlocked;
    expect(before).to.be.false;
    expect(after).to.be.true;
  });

  it('admin can lock exchange', async () => {
    before = (await defiPlaza.DFPconfig()).unlocked;

    defiPlaza.lockExchange({ from: admin });

    after = (await defiPlaza.DFPconfig()).unlocked;
    expect(before).to.be.true;
    expect(after).to.be.false;
  });

  it('admin can unlock exchange', async () => {
    before = (await defiPlaza.DFPconfig()).unlocked;

    defiPlaza.unlockExchange({ from: admin });

    after = (await defiPlaza.DFPconfig()).unlocked;
    expect(before).to.be.false;
    expect(after).to.be.true;
  });

  it('others cannot lock exchange', async () => {
    await expectRevert(
      defiPlaza.lockExchange({ from: other }),
      "DFP: admin rights required"
    );
  });

  it('others cannot unlock exchange', async () => {
    await defiPlaza.lockExchange();

    await expectRevert(
      defiPlaza.unlockExchange({ from: other }),
      "DFP: admin rights required"
    );
  });

  it('owner can change trading fee', async () => {
    before = (await defiPlaza.DFPconfig()).oneMinusTradingFee;

    await defiPlaza.setTradingFee(
      18409850585562132480n,
      { from: owner }
    );

    after = (await defiPlaza.DFPconfig()).oneMinusTradingFee;
    expect(before).to.be.bignumber.equal('18428297329635842048'); // 0.1% fee
    expect(after).to.be.bignumber.equal('18409850585562132480'); // 0.2% fee
  });

  it('others cannot change trading fee', async () => {
    await expectRevert(
      defiPlaza.setTradingFee(
        18428297329635842048n,
        { from: other }
      ),
      "Ownable: caller is not the owner"
    );
  });

  it('delisting bonus unavailable when no active change', async () => {
    await expectRevert(
      defiPlaza.setDeListingBonus(
        922337203685477632n,
        { from: owner }
      ),
      "DFP: No active delisting"
    );
  });

  it('others cannot change listing', async () => {
    await expectRevert(
      defiPlaza.changeListing(
        tokenA.address,
        tokenZ.address,
        10000n * ONE,
        { from: other }
      ),
      "Ownable: caller is not the owner"
    );
  });

  it('owner can change listing', async () => {
    await defiPlaza.changeListing(
      tokenA.address,
      tokenZ.address,
      10000n * ONE,
      { from: owner }
    );

    update = await defiPlaza.listingUpdate();
    expect(update.tokenToDelist).to.be.equal(tokenA.address);
    expect(update.tokenToList).to.be.equal(tokenZ.address);
  });

  it('owner can change delisting bonus when change pending', async () => {
    before = (await defiPlaza.DFPconfig()).delistingBonus;

    await defiPlaza.setDeListingBonus(
      922337203685477632n,
      { from: owner }
    );

    after = (await defiPlaza.DFPconfig()).delistingBonus;
    expect(before).to.be.bignumber.equal('0');
    expect(after).to.be.bignumber.equal('922337203685477632');
  });

});
