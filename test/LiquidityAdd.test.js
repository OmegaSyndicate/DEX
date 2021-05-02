const OmegaDEX = artifacts.require('OmegaDEX');
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
    omegaDEX = await OmegaDEX.deployed();
    dex = omegaDEX.address;

    await omegaDEX.send(10e18);
    await tokenA.transfer(omegaDEX.address, 10000n * ONE);
    await tokenD.transfer(omegaDEX.address, 100000n * ONE);
    await omegaDEX.unlockExchange();
  });

  it('accepts ETH as liquidity', async () => {
    await omegaDEX.addLiquidity(
      constants.ZERO_ADDRESS,
      ONE,
      0n,
      { from : trader_eth , value : 1e18}
    );
    expect(await omegaDEX.balanceOf(trader_eth))
      .to.be.bignumber.equal('9550315293017774820');
    expect(await web3.eth.getBalance(trader_eth))
      .to.be.bignumber.closeTo('99000000000000000000', '100000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.equal('11000000000000000000');
  });

  it('rejects incorrect ETH amounts', async () => {
    await expectRevert(
      omegaDEX.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        0n,
        { from : trader_eth , value : 0.99e18}
      ),
      "ODX: Incorrect amount of ETH."
    );
  });

  it('accepts listed tokenA as liquidity', async () => {
    await tokenA.transfer(trader_A, 10000n * ONE);
    await tokenA.approve(omegaDEX.address, 2000n*ONE, { from : trader_A })
    await omegaDEX.addLiquidity(
      tokenA.address,
      1000n*ONE,
      0n,
      { from : trader_A }
    );
    expect(await omegaDEX.balanceOf(trader_A))
      .to.be.bignumber.equal('9607320619390305561');
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('9000000000000000000000');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('11000000000000000000000');
  });

  it('rejects very large single side liquidity addition', async () => {
    await expectRevert(
      omegaDEX.addLiquidity(
        constants.ZERO_ADDRESS,
        11n*ONE,
        0n,
        { from : trader_eth , value : 11e18}
      ),
      "ODX: Excessive add."
    );
  });

  it('rejects transaction when asking too many LP', async () => {
    await expectRevert(
      omegaDEX.addLiquidity(
        constants.ZERO_ADDRESS,
        ONE,
        9550315293017774819n,
        { from : trader_eth , value : 1e18}
      ),
      "ODX: No deal."
    );
  });

  it('rejects non-listed tokenD as liquidity', async () => {
    await tokenD.transfer(trader_D, 10000n * ONE);
    await tokenD.approve(omegaDEX.address, 1000n*ONE, { from : trader_D })
    await expectRevert(
      omegaDEX.addLiquidity(
        tokenD.address,
        ONE,
        0n,
        { from : trader_D }
      ),
      "ODX: Token not listed."
    );
  });

  it('rejects liquidity when locked', async () => {
    await omegaDEX.lockExchange();
    await expectRevert(
      omegaDEX.addLiquidity(
        tokenA.address,
        1000n*ONE,
        0n,
        { from : trader_A }
      ),
      "ODX: Locked."
    );
  });
});
