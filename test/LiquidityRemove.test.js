const DeFiPlaza = artifacts.require('DeFiPlaza');
const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
const TokenC = artifacts.require('TokenC');
const TokenD = artifacts.require('TokenD');

const truffleCost = require('truffle-cost');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const ONE = 1000000000000000000n
const FINNEY = 1000000000000000n

contract('LiquidityRemove', accounts => {
  const [owner, trader_eth, trader_A, trader_B, trader_C, trader_D] = accounts;

  before(async () => {
    tokenA = await TokenA.deployed()
    tokenD = await TokenD.deployed()
    defiPlaza = await DeFiPlaza.deployed();
    dex = defiPlaza.address;

    await defiPlaza.send(10e18);
    await tokenA.transfer(defiPlaza.address, 10000n * ONE);
    await tokenA.transfer(trader_A, 1000n * ONE);
    await tokenD.transfer(defiPlaza.address, 10000n * ONE);
    await tokenD.transfer(trader_D, 1000n * ONE);
    await defiPlaza.transfer(trader_eth, 100n * ONE);
    await defiPlaza.transfer(trader_A, 100n * ONE);
    await defiPlaza.transfer(trader_D, 100n * ONE);
    await defiPlaza.unlockExchange();
  });

  it('correctly processes ETH withdrawal', async () => {
    await defiPlaza.removeLiquidity(
      10n * ONE,
      constants.ZERO_ADDRESS,
      954000000000000000n,
      { from : trader_eth }
    );
    expect(await defiPlaza.balanceOf(trader_eth))
      .to.be.bignumber.equal('90000000000000000000');
    expect(await web3.eth.getBalance(trader_eth))
      .to.be.bignumber.closeTo('100954000000000000000', '100000000000000000');
    expect(await web3.eth.getBalance(dex))
      .to.be.bignumber.equal('9045535171661972976');
  });

  it('correctly processes TokenA withdrawal', async () => {
    await defiPlaza.removeLiquidity(
      10n * ONE,
      tokenA.address,
      960187926081688418377n,
      { from : trader_A }
    );
    expect(await defiPlaza.balanceOf(trader_A))
      .to.be.bignumber.equal('90000000000000000000');
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('1960187926107208037881');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('9039812073892791962119');
  });

  it('rejects non-listed TokenD withdrawal', async () => {
    await expectRevert(
      defiPlaza.removeLiquidity(
        10n * ONE,
        tokenD.address,
        0n,
        { from : trader_D }
      ),
      "ODX: Token not listed."
    );
  });

  it('rejects withdrawing more than owned', async () => {
    await expectRevert(
      defiPlaza.removeLiquidity(
        1000n * ONE,
        tokenA.address,
        0n,
        { from : trader_A }
      ),
      "ERC20: burn amount exceeds balance"
    );
  });

  it('rejects withdrawals when over-asking', async () => {
    await expectRevert(
      defiPlaza.removeLiquidity(
        10n * ONE,
        tokenA.address,
        873227774499616256905n,
        { from : trader_A }
      ),
      "ODX: No deal."
    );
  });

  it('allows withdrawals when locked', async () => {
    await defiPlaza.lockExchange();
    await defiPlaza.removeLiquidity(
      10n * ONE,
      tokenA.address,
      0n,
      { from : trader_A }
    );
    expect(await defiPlaza.balanceOf(trader_A))
      .to.be.bignumber.equal('80000000000000000000');
    expect(await tokenA.balanceOf(trader_A))
      .to.be.bignumber.equal('2833415700605589315874');
    expect(await tokenA.balanceOf(dex))
      .to.be.bignumber.equal('8166584299394410684126');
  });



});
