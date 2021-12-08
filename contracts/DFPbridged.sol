// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DFPgovBridged is ERC20 {
  constructor() ERC20("DefiPlaza gov", "DFP2") {
    _mint(msg.sender, 67941915000000000000000000);
  }
}
