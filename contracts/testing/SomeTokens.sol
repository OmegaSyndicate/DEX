// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
  constructor() SomeToken("TokenE", "TOKE") {}
}
contract TokenF is SomeToken {
  constructor() SomeToken("TokenF", "TOKF") {}
}
contract TokenG is SomeToken {
  constructor() SomeToken("TokenG", "TOKG") {}
}
contract TokenH is SomeToken {
  constructor() SomeToken("TokenH", "TOKH") {}
}
contract TokenI is SomeToken {
  constructor() SomeToken("TokenI", "TOKI") {}
}
contract TokenJ is SomeToken {
  constructor() SomeToken("TokenJ", "TOKJ") {}
}
contract TokenK is SomeToken {
  constructor() SomeToken("TokenK", "TOKK") {}
}
contract TokenL is SomeToken {
  constructor() SomeToken("TokenL", "TOKL") {}
}
contract TokenM is SomeToken {
  constructor() SomeToken("TokenM", "TOKM") {}
}
contract TokenN is SomeToken {
  constructor() SomeToken("TokenN", "TOKN") {}
}
contract TokenZ is SomeToken {
  constructor() SomeToken("TokenZ", "TOKZ") {}
}
