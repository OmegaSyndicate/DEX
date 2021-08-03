// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

/**
 * Utility contract for Ganache timestamp verification
 */
contract TimeCheck {
  function blockTime() public view returns(uint256 timestamp) {
    timestamp = block.timestamp;
  }
}
