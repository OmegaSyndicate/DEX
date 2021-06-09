const DeFiPlaza = artifacts.require('XDP1');
const DFPgov = artifacts.require('DFPgov');
const TokenA = artifacts.require('TokenA');
const TokenZ = artifacts.require('TokenZ');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('LiquidityAdd', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_Z, founder] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed();
    tokenZ = await TokenZ.deployed();
    dfpGov = await DFPgov.deployed();
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenZ.transfer(defiPlaza.address, 100000n * ONE);
    await dfpGov.transfer(defiPlaza.address, 1000000n * ONE, { from : founder });
    await defiPlaza.unlockExchange();
  });

  it('accepts ETH as liquidity', async () => {
    await defiPlaza.addLiquidity(
      constants.ZERO_ADDRESS,
      ONE,
      0n,
      { from : trader_eth , value : 1e18}
    );
    expect(await defiPlaza.balanceOf(trader_eth))
      .to.be.bignumber.equal('9550315295767706786');
    expect(await web3.eth.getBalance(trader_eth))
      .to.be.bignumber.closeTo('99000000000000000000', '100000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.equal('11000000000000000000');
  });

  it('rejects incorrect ETH amounts', async () => {
    await expectRevert(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 0.99e18}
      ),
      "DFP: Incorrect amount of ETH"
    );
  });

  it('accepts listed tokenA as liquidity', async () => {
    await tokenA.transfer(trader_A, 10000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : trader_A });
    await defiPlaza.addLiquidity(
      tokenA.address,
      1000n*ONE,
      0n,
      { from : trader_A }
    );
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('9000000000000000000000');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('11000000000000000000000');
    expect(await defiPlaza.balanceOf(trader_A))
      .to.be.bignumber.equal('9607320622173065924');
  });

  it('rejects very large single side liquidity addition', async () => {
    await expectRevert(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        11n*ONE,
        0n,
        { from : trader_eth , value : 11e18}
      ),
      "DFP: Too much at once"
    );
  });

  it('rejects transaction when asking too many LP', async () => {
    await expectRevert(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        9550315293017774819n,
        { from : trader_eth , value : 1e18}
      ),
      "DFP: No deal"
    );
  });

  it('rejects non-listed tokenZ as liquidity', async () => {
    await tokenZ.transfer(trader_Z, 10000n * ONE);
    await tokenZ.approve(defiPlaza.address, 1000n*ONE, { from : trader_Z });
    await expectRevert(
      defiPlaza.addLiquidity(
        tokenZ.address,
        ONE,
        0n,
        { from : trader_Z }
      ),
      "DFP: Token not listed"
    );
  });

  it('rejects liquidity when locked', async () => {
    await defiPlaza.lockExchange();
    await expectRevert(
      defiPlaza.addLiquidity(
        tokenA.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      ),
      "DFP: Locked"
    );
  });
});
