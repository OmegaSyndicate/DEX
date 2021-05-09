// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./DeFiPlaza.sol";

contract DPL1 is DeFiPlaza {
  constructor(address[] memory tokensToList) DeFiPlaza(tokensToList, "DeFi Plaza Main Index", "DPL1") {}
}
