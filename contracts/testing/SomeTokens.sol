// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
import "../derived/ERC20Lean.sol";

contract SomeToken is ERC20 {
  constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    _mint(msg.sender, 1e24);
  }
}

contract TokenA is SomeToken {
  constructor() SomeToken("TokenA", "TOKA") {}
}
contract TokenB is SomeToken {
  constructor() SomeToken("TokenB", "TOKB") {}
}
contract TokenC is SomeToken {
  constructor() SomeToken("TokenC", "TOKC") {}
}
contract TokenD is SomeToken {
  constructor() SomeToken("TokenD", "TOKD") {}
}
contract TokenE is SomeToken {
  constructor() SomeToken("TokenD", "TOKD") {}
}
