const DeFiPlaza = artifacts.require('XDP1');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenD = artifacts.require('TokenD');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('LiquidityAdd', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenD.transfer(defiPlaza.address, 100000n * ONE);
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
      "DPL: Incorrect amount of ETH."
    );
  });

  it('accepts listed tokenA as liquidity', async () => {
    await tokenA.transfer(trader_A, 10000n * ONE);
    await tokenA.approve(defiPlaza.address, 2000n*ONE, { from : trader_A })
    await defiPlaza.addLiquidity(
      tokenA.address,
      1000n*ONE,
      0n,
      { from : trader_A }
    );
    expect(await defiPlaza.balanceOf(trader_A))
      .to.be.bignumber.equal('9607320622173065924');
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('9000000000000000000000');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('11000000000000000000000');
  });

  it('rejects very large single side liquidity addition', async () => {
    await expectRevert(
      defiPlaza.addLiquidity(
        constants.ZERO_ADDRESS,
        11n*ONE,
        0n,
        { from : trader_eth , value : 11e18}
      ),
      "DPL: Excessive add."
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
      "DPL: No deal."
    );
  });

  it('rejects non-listed tokenD as liquidity', async () => {
    await tokenD.transfer(trader_D, 10000n * ONE);
    await tokenD.approve(defiPlaza.address, 1000n*ONE, { from : trader_D })
    await expectRevert(
      defiPlaza.addLiquidity(
        tokenD.address,
        ONE,
        0n,
        { from : trader_D }
      ),
      "DPL: Token not listed."
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
      "DPL: Locked."
    );
  });
});
