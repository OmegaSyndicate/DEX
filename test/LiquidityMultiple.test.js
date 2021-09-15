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
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('AddMultipleTokens', accounts => {
  const [owner, trader_1, trader_2, trader_3, trader_4, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    tokenC = await TokenC.deployed();
    tokenD = await TokenD.deployed();
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
    dfpGov = await DFPgov.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await dfpGov.setIndexToken(dex);
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
    await dfpGov.transfer(owner, 4000000n * ONE, { from : founder });
    await defiPlaza.unlockExchange();

    tokens = [constants.ZERO_ADDRESS,
      tokenA.address.toLowerCase(), tokenB.address.toLowerCase(), tokenC.address.toLowerCase(),
      tokenD.address.toLowerCase(), tokenE.address.toLowerCase(), tokenF.address.toLowerCase(),
      tokenG.address.toLowerCase(), tokenH.address.toLowerCase(), tokenI.address.toLowerCase(),
      tokenJ.address.toLowerCase(), tokenK.address.toLowerCase(), tokenL.address.toLowerCase(),
      tokenM.address.toLowerCase(), tokenN.address.toLowerCase(), dfpGov.address.toLowerCase()].sort();
  });

  it('correctly processes multitoken add', async () => {
    let amounts = new Map();
    amounts.set(constants.ZERO_ADDRESS, 20n*ONE);
    amounts.set(tokenA.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenB.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenC.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenD.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenE.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenF.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenG.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenH.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenI.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenJ.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenK.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenL.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenM.address.toLowerCase(), 10000n*ONE);
    amounts.set(tokenN.address.toLowerCase(), 10000n*ONE);
    amounts.set(dfpGov.address.toLowerCase(), 4000000n*ONE);

    var maxAmounts = [];
    for (i = 0; i < 16; i++) {
      token = tokens[i];
      maxAmounts.push(amounts.get(token));
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

    await defiPlaza.addMultiple(
      tokens,
      maxAmounts,
      { value : Number(maxAmounts[0]) }
    );

    // Check one of each group
    balance = await web3.eth.getBalance(dex);
    expect(balance).to.be.bignumber.equal('15000000000000000000');
    balance = await tokenA.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('15000000000000000000000');
    balance = await tokenI.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('7500000000000000000000');
    balance = await tokenM.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('30000000000000000000000');
    balance = await dfpGov.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('1500000000000000000000000');

    // Check one of each group
    balance = await tokenA.balanceOf(owner);
    expect(balance).to.be.bignumber.equal('985000000000000000000000');
    balance = await tokenI.balanceOf(owner);
    expect(balance).to.be.bignumber.equal('992500000000000000000000');
    balance = await tokenM.balanceOf(owner);
    expect(balance).to.be.bignumber.equal('970000000000000000000000');
    balance = await dfpGov.balanceOf(owner);
    expect(balance).to.be.bignumber.equal('3500000000000000000000000');

    balance = await defiPlaza.balanceOf(owner);
    expect(balance).to.be.bignumber.equal('2399199999999999999289');
  });

  it('gracefully adds zero liquidity', async () => {
    await defiPlaza.addMultiple(
      tokens,
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      { value : 0 }
    );
  });

  it('rejects liquidity when locked', async () => {
    await defiPlaza.lockExchange();
    await expectRevert(
      defiPlaza.addMultiple(
        tokens,
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        { value : 0 }
      ),
      "DFP: Locked"
    );
  });

  it('rejects list not starting with null address (ETH)', async () => {
    await defiPlaza.unlockExchange();
    await expectRevert(
      defiPlaza.addMultiple(
        tokens.reverse(),
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        { value : 0 }
      ),
      "DFP: No ETH found"
    );
  });

  it('rejects list in incorrect order', async () => {
    tokens[0] = constants.ZERO_ADDRESS;
    await expectRevert(
      defiPlaza.addMultiple(
        tokens.reverse(),
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        { value : 0 }
      ),
      "DFP: Require ordered list"
    );
  });
});

contract('RemoveMultipleTokens', accounts => {
  const [owner, trader_1, trader_2, trader_3, trader_4, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenB = await TokenB.deployed();
    tokenC = await TokenC.deployed();
    tokenD = await TokenD.deployed();
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
    dfpGov = await DFPgov.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await dfpGov.setIndexToken(dex);
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
    await dfpGov.transfer(owner, 4000000n * ONE, { from : founder });
    await defiPlaza.unlockExchange();

    tokens = [constants.ZERO_ADDRESS,
      tokenA.address.toLowerCase(), tokenB.address.toLowerCase(), tokenC.address.toLowerCase(),
      tokenD.address.toLowerCase(), tokenE.address.toLowerCase(), tokenF.address.toLowerCase(),
      tokenG.address.toLowerCase(), tokenH.address.toLowerCase(), tokenI.address.toLowerCase(),
      tokenJ.address.toLowerCase(), tokenK.address.toLowerCase(), tokenL.address.toLowerCase(),
      tokenM.address.toLowerCase(), tokenN.address.toLowerCase(), dfpGov.address.toLowerCase()].sort();
  });

  it('correctly processes multitoken withdrawal', async () => {
    await defiPlaza.transfer(trader_1, 400n * ONE);

    await defiPlaza.removeMultiple(
      400n * ONE,
      tokens,
      { from: trader_1 }
    );

    // Check one of each group
    balance = await web3.eth.getBalance(dex);
    expect(balance).to.be.bignumber.equal('7500000000000000000');
    balance = await tokenA.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('7500000000000000000000');
    balance = await tokenI.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('3750000000000000000000');
    balance = await tokenM.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('15000000000000000000000');
    balance = await dfpGov.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('750000000000000000000000');

    // Check one of each group
    balance = await tokenA.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('2500000000000000000000');
    balance = await tokenI.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('1250000000000000000000');
    balance = await tokenM.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('5000000000000000000000');
    balance = await dfpGov.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('250000000000000000000000');

    balance = await defiPlaza.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('0');
  });

  it('gracefully withdraws zero liquidity', async () => {
    await defiPlaza.removeMultiple(
      0n,
      tokens,
      { from: trader_1 }
    );

    // Check one of each group
    balance = await web3.eth.getBalance(dex);
    expect(balance).to.be.bignumber.equal('7500000000000000000');
    balance = await tokenA.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('7500000000000000000000');
    balance = await tokenI.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('3750000000000000000000');
    balance = await tokenM.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('15000000000000000000000');
    balance = await dfpGov.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('750000000000000000000000');

    // Check one of each group
    balance = await tokenA.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('2500000000000000000000');
    balance = await tokenI.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('1250000000000000000000');
    balance = await tokenM.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('5000000000000000000000');
    balance = await dfpGov.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('250000000000000000000000');

    balance = await defiPlaza.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('0');
  });

  it('allows withdrawal when locked', async () => {
    await defiPlaza.lockExchange();
    await defiPlaza.transfer(trader_2, 400n * ONE);

    await defiPlaza.removeMultiple(
      400n * ONE,
      tokens,
      { from: trader_2 }
    );

    // Check one of each group
    balance = await web3.eth.getBalance(dex);
    expect(balance).to.be.bignumber.equal('5000000000000000001');
    balance = await tokenA.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('5000000000000000000001');
    balance = await tokenI.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('2500000000000000000001');
    balance = await tokenM.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('10000000000000000000001');
    balance = await dfpGov.balanceOf(dex);
    expect(balance).to.be.bignumber.equal('500000000000000000000001');

    balance = await defiPlaza.balanceOf(trader_1);
    expect(balance).to.be.bignumber.equal('0');
  });
});
