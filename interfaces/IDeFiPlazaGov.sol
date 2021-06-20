// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.7.6;

interface IDeFiPlazaGov {
  function stake(
    uint96 LPamount
  ) external returns(bool success);

  function rewardsQuote(
    address stakerAddress
  ) external view returns(uint256 rewards);

  function unstake(
    uint96 LPamount
  ) external returns(uint256 rewards);

  event Staked(
    address staker,
    uint256 LPamount
  );

  event Unstaked(
    address staker,
    uint256 LPamount,
    uint256 rewards
  );
}
