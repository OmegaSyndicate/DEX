// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "../interfaces/IDeFiPlaza.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * DeFi Plaza is a single controct, multi token DEX which allows trades between any two tokens.
 * Trades between two tokens always follow the familiar localized bonding curve x*y=k
 * The number of tokens used is hardcoded to 16 for efficiency reasons.
 */
contract DeFiPlaza is IDeFiPlaza, Ownable, ERC20 {
  using SafeMath for uint256;

  // States that each token can be in
  enum State {Unlisted, PreListing, Delisting, Listed}

  // Configuration per token. Still some bits available if needed
  struct TokenSettings {
    State state;                      // What state the token is currently in
    uint112 listingTarget;            // Amount of tokens needed to activate listing
  }

  // Exchange configuration
  struct Config {
    bool unlocked;                    // Locked for trading to prevent re-entrancy misery
    uint64 oneMinusTradingFee;        // One minus the swap fee (0.64 fixed point integer)
    uint40 delistingBonus;            // Amount of additional tokens to encourage immediate delisting (0.40 fixed point)
  }

  // Keeps track of whether there is a listing change underway and if so between which tokens
  struct ListingUpdate {
    address tokenToDelist;            // Token to be removed
    address tokenToList;              // Token to be listed
  }

  // Mapping to keep track of the listed tokens
  mapping(address => TokenSettings) public listedTokens;
  Config public DFP_config;
  ListingUpdate public listingUpdate;

  /**
  * Sets up default configuration
  * Initialize with ordered list of 15 token addresses (ETH is always listed)
  * Doesn't do any checks. Make sure you ONLY add well behaved ERC20s!!
  */
  constructor(address[] memory tokensToList, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    // Basic exchange configureation
    Config memory config;
    config.unlocked = false;
    config.oneMinusTradingFee = 0xffbe76c8b4395800;   // approximately 0.999
    config.delistingBonus = 0;
    DFP_config = config;

    // Configure the listed tokens as such
    TokenSettings memory listed;
    listed.state = State.Listed;
    require(tokensToList.length == 15, "Incorrect number of tokens");
    address previous = address(0);
    address current = address(0);
    for (uint256 i = 0; i < 15; i++) {
      current = tokensToList[i];
      require(current > previous, "Require ordered list");
      listedTokens[current] = listed;
      previous = current;
    }

    // Generate the LP tokens reflecting the initial liquidity (to be loaded externally)
    _mint(msg.sender, 1600e18);
  }

  // For bootstrapping ETH liquidity
  receive() external payable {}

  // To safeguard some functionality is only applied to listed tokens
  modifier onlyListedToken(address token) {
    require(
      token == address(0) || listedTokens[token].state > State.Delisting,
      "DFP: Token not listed"
    );
    _;
  }

  /**
  * Allows users to swap between any two tokens listed on the DEX.
  * Follows the x*y=k swap invariant hyperbole
  * For ETH trades, send the ETH with the transaction and use the NULL address as inputToken.
  */
  function swap(
    address inputToken,
    address outputToken,
    uint256 inputAmount,
    uint256 minOutputAmount
  )
    external
    payable
    onlyListedToken(inputToken)
    onlyListedToken(outputToken)
    override
    returns (uint256 outputAmount)
  {
    // Check that the exchange is unlocked and thus open for business
    Config memory _config = DFP_config;
    require(_config.unlocked, "DFP: Locked");

    // Pull in input token and check the exchange balance for that token
    uint256 initialInputBalance;
    if (inputToken == address(0)) {
      require(msg.value == inputAmount, "DFP: bad ETH amount");
      initialInputBalance = address(this).balance - inputAmount;
    } else {
      initialInputBalance = IERC20(inputToken).balanceOf(address(this));
      require(
        IERC20(inputToken).transferFrom(msg.sender, address(this), inputAmount),
        "DFP: Transfer failed"
      );
    }

    // Check dex balance of the output token
    uint256 initialOutputBalance;
    if (outputToken == address(0)) {
      initialOutputBalance = address(this).balance;
    } else {
      initialOutputBalance = IERC20(outputToken).balanceOf(address(this));
    }

    // Calculate the output amount through the x*y=k invariant
    // Can skip overflow/underflow checks on this calculation as they will always work against an attacker anyway.
    uint256 netInputAmount = inputAmount * _config.oneMinusTradingFee;
    outputAmount = netInputAmount * initialOutputBalance / ((initialInputBalance << 64) + netInputAmount);
    require(outputAmount > minOutputAmount, "DFP: No deal");

    // Send output tokens to whoever invoked the swap function
    if (outputToken == address(0)) {
      address payable sender = msg.sender;
      sender.transfer(outputAmount);
    } else {
      IERC20(outputToken).transfer(msg.sender, outputAmount);
    }

    // Emit swap event to enable better governance decision making
    emit Swapped(msg.sender, inputToken, outputToken, inputAmount, outputAmount);
  }

  /**
  * Single sided liquidity add. More economic at moderate liquidity amounts.
  * Mathematically works as adding all tokens and swapping back to 1 token at no fee.
  *
  *         R = (1 + X_supplied/X_initial)^(1/N) - 1
  *         LP_minted = R * LP_total
  *
  * When adding ETH, the inputToken address to be used is the NULL address.
  * A fee is applied to prevent zero fee swapping through liquidity add/remove.
  */
  function addLiquidity(address inputToken, uint256 inputAmount, uint256 minLP)
    external
    payable
    onlyListedToken(inputToken)
    override
    returns (uint256 actualLP)
  {
    // Check that the exchange is unlocked and thus open for business
    Config memory _config = DFP_config;
    require(_config.unlocked, "DFP: Locked");

    // Pull in input token and check the exchange balance for that token
    uint256 initialBalance;
    if (inputToken == address(0)) {
      require(msg.value == inputAmount, "DFP: Incorrect amount of ETH");
      initialBalance = address(this).balance - inputAmount;
    } else {
      initialBalance = IERC20(inputToken).balanceOf(address(this));
      require(
        IERC20(inputToken).transferFrom(msg.sender, address(this), inputAmount),
        "DFP: Transfer failed"
      );
    }

    // Prevent excessive liquidity add which runs of the approximation curve
    require(inputAmount < initialBalance, "DFP: Too much at once");

    // 6th power binomial series approximation of R
    uint256 X = (inputAmount * _config.oneMinusTradingFee) / initialBalance;  // 0.64 bits
    uint256 X_ = X * X;                                // X^2   0.128 bits
    uint256 R_ = (X >> 4) - (X_ * 15 >> 73);           // R2    0.64 bits
    X_ = X_ * X;                                       // X^3   0.192 bits
    R_ = R_ + (X_ * 155 >> 141);                       // R3    0.64 bits
    X_ = X_ * X >> 192;                                // X^4   0.64 bits
    R_ = R_ - (X_ * 7285 >> 19);                       // R4    0.64 bits
    X_ = X_ * X;                                       // X^5   0.128 bits
    R_ = R_ + (X_ * 91791 >> 87);                      // R5    0.64 bits
    X_ = X_ * X;                                       // X^6   0.192 bits
    R_ = R_ - (X_ * 2417163 >> 156);                   // R6    0.64 bits

    // Calculate and mint LPs to be awarded
    actualLP = R_ * totalSupply() >> 64;
    require(actualLP > minLP, "DFP: No deal");
    _mint(msg.sender, actualLP);

    // Emitting liquidity add event to enable better governance decisions
    emit LiquidityAdded(msg.sender, inputToken, inputAmount, actualLP);
  }

  /**
  * Multi-token liquidity add. More economic for large amounts of liquidity.
  * Simply takes in all 16 listed tokens in ratio and mints the LPs accordingly.
  * For ETH, the inputToken address to be used is the NULL address.
  * A fee is applied to prevent zero fee swapping through liquidity add/remove.
  */
  function addMultiple(address[] calldata tokens, uint256[] calldata maxAmounts)
    external
    payable
    override
    returns (uint256 actualLP)
  {
    // Perform basic checks
    Config memory _config = DFP_config;
    require(_config.unlocked, "DFP: Locked");
    require(tokens.length == 16, "DFP: Bad tokens array length");
    require(maxAmounts.length == 16, "DFP: Bad maxAmount array length");

    // Check ETH amount/ratio first
    require(tokens[0] == address(0), "DFP: No ETH found");
    require(maxAmounts[0] == msg.value, "DFP: Incorrect ETH amount");
    uint256 dexBalance = address(this).balance - msg.value;
    uint256 actualRatio = msg.value.mul(1<<128) / dexBalance;

    // Check ERC20 amounts/ratios
    uint256 currentRatio;
    address previous;
    address token;
    for (uint256 i = 1; i < 16; i++) {
      token = tokens[i];
      require(token > previous, "DFP: Require ordered list");
      require(
        listedTokens[token].state > State.Delisting,
        "DFP: Token not listed"
      );
      dexBalance = IERC20(token).balanceOf(address(this));
      currentRatio = maxAmounts[i].mul(1<<128) / dexBalance;
      if (currentRatio < actualRatio) {
        actualRatio = currentRatio;
      }
      previous = token;
    }

    // Calculate how many LP will be generated
    actualLP = actualRatio.mul(totalSupply()) >> 128;

    // Collect ERC20 tokens
    previous = address(0);
    for (uint256 i = 1; i < 16; i++) {
      token = tokens[i];
      dexBalance = IERC20(token).balanceOf(address(this));
      require(
        IERC20(token).transferFrom(msg.sender, address(this), dexBalance.mul(actualRatio) >> 128),
        "DFP: token transfer failed"
      );
      previous = token;
    }

    // Mint the LP tokens
    _mint(msg.sender, actualLP);

    // Refund ETH change
    dexBalance = address(this).balance - msg.value;
    address payable sender = msg.sender;
    sender.transfer(msg.value - (dexBalance.mul(actualRatio) >> 128));
  }

  /**
  * Single sided liquidity withdrawal. More efficient at lower liquidity amounts.
  * Mathematically withdraws 16 tokens in ratio and then swaps 15 back in at no fees.
  * Calculates the following:
  *
  *        R = LP_burnt / LP_initial
  *        X_out = X_initial * (1 - (1 - R)^N)
  *
  * No fee is applied for withdrawals. For ETH output, use the NULL address as outputToken.
  */
  function removeLiquidity(uint256 LPamount, address outputToken, uint256 minOutputAmount)
    external
    onlyListedToken(outputToken)
    override
    returns (uint256 actualOutput)
  {
    // Checks the initial balance of the token desired as output token
    uint256 initialBalance;
    if (outputToken == address(0)) {
      initialBalance = address(this).balance;
    } else {
      initialBalance = IERC20(outputToken).balanceOf(address(this));
    }

    // Calculates intermediate variable F = (1-R)^16 and then the resulting output amount.
    uint256 F_;
    F_ = (1 << 64) - (LPamount << 64) / totalSupply();   // (1-R)      (0.64 bits)
    F_ = F_ * F_;                                       // (1-R)^2    (0.128 bits)
    F_ = F_ * F_ >> 192;                                // (1-R)^4    (0.64 bits)
    F_ = F_ * F_;                                       // (1-R)^8    (0.128 bits)
    F_ = F_ * F_ >> 192;                                // (1-R)^16   (0.64 bits)
    actualOutput = initialBalance * ((1 << 64) - F_) >> 64;
    require(actualOutput > minOutputAmount, "DFP: No deal");

    // Burns the LP tokens and sends the output tokens
    _burn(msg.sender, LPamount);
    if (outputToken == address(0)) {
      address payable sender = msg.sender;
      sender.transfer(actualOutput);
    } else {
      IERC20(outputToken).transfer(msg.sender, actualOutput);
    }

    // Emitting liquidity removal event to enable better governance decisions
    emit LiquidityRemoved(msg.sender, outputToken, actualOutput, LPamount);
  }

  function removeMultiple(uint256 LPamount, address[] calldata tokens)
    external
    override
    returns (bool success)
  {
    // Perform basic checks
    Config memory _config = DFP_config;
    require(_config.unlocked, "DFP: Locked");
    require(tokens.length == 16, "DFP: Bad tokens array length");

    // Calculate fraction of total liquidity to be returned
    uint256 fraction = (LPamount << 128) / totalSupply();

    // Send the ETH first (use transfer to prevent reentrancy)
    uint256 dexBalance = address(this).balance;
    address payable sender = msg.sender;
    sender.transfer(fraction * dexBalance >> 128);

    // Send the ERC20 tokens
    address previous;
    for (uint256 i = 1; i < 16; i++) {
      address token = tokens[i];
      require(token > previous, "DFP: Require ordered list");
      require(
        listedTokens[token].state > State.Delisting,
        "DFP: Token not listed"
      );
      dexBalance = IERC20(token).balanceOf(address(this));
      IERC20(token).transfer(msg.sender, fraction * dexBalance >> 128);
      previous = token;
    }

    // Burn the LPs
    _burn(msg.sender, LPamount);

    // That's all folks
    return true;
  }


  /** When a token is delisted and another one gets listed in its place, the users can
      call this function to provide liquidity for the new token in exchange for the old
      token. The ratio should be set such that the users have a financial incentive to
      perform this transaction.
   */
  function bootstrapNewToken(
    address inputToken,
    uint256 maxInputAmount,
    address outputToken
  ) external override returns (uint256 outputAmount) {
    // Check whether the valid token is being bootstrapped
    TokenSettings memory tokenToList = listedTokens[inputToken];
    require(
      tokenToList.state == State.PreListing,
      "DFP: Wrong token"
    );

    // Calculate how many tokens to actually take in (clamp at max available)
    uint256 initialInputBalance = IERC20(inputToken).balanceOf(address(this));
    uint256 availableAmount = tokenToList.listingTarget - initialInputBalance;
    uint256 actualInputAmount = maxInputAmount > availableAmount ? availableAmount : maxInputAmount;

    // Actually pull the tokens in
    require(
      IERC20(inputToken).transferFrom(msg.sender, address(this), actualInputAmount),
      "DFP: token transfer failed"
    );

    // Check whether the output token requested is indeed being delisted
    TokenSettings memory tokenToDelist = listedTokens[outputToken];
    require(
      tokenToDelist.state == State.Delisting,
      "DFP: Wrong token"
    );

    // Check how many of the output tokens should be given out and transfer those
    uint256 initialOutputBalance = IERC20(outputToken).balanceOf(address(this));
    outputAmount = actualInputAmount.mul(initialOutputBalance).div(availableAmount);
    IERC20(outputToken).transfer(msg.sender, outputAmount);

    // Emit event for better governance decisions
    emit LiquidityBootstrapped(
      msg.sender,
      inputToken,
      actualInputAmount,
      outputToken,
      outputAmount
    );

    // If the input token liquidity is now at the target we complete the (de)listing
    if (actualInputAmount == availableAmount) {
      tokenToList.state = State.Listed;
      listedTokens[inputToken] = tokenToList;
      delete listedTokens[outputToken];
      delete listingUpdate;
      emit BootstrapCompleted(outputToken, inputToken);
    }
  }

  /**
   * Initiates process to delist one token and list another.
   */
  function changeListing(
    address tokenToDelist,              // Address of token to be delisted
    address tokenToList,                // Address of token to be listed
    uint112 listingTarget               // Amount of tokens needed to activate listing
  ) external onlyListedToken(tokenToDelist) onlyOwner() {
    // Basic validity checks. ETH cannot be delisted, only one delisting at a time.
    require(tokenToDelist != address(0), "DFP: Cannot delist ETH");
    ListingUpdate memory update = listingUpdate;
    require(update.tokenToDelist == address(0), "DFP: Previous update incomplete");

    // Can't list an already listed token
    TokenSettings memory _token = listedTokens[tokenToList];
    require(_token.state == State.Unlisted, "DFP: Token already listed");

    // Set the delisting/listing struct.
    update.tokenToDelist = tokenToDelist;
    update.tokenToList = tokenToList;
    listingUpdate = update;

    // Configure the token states for incoming/outgoing tokens
    _token.state = State.PreListing;
    _token.listingTarget = listingTarget;
    listedTokens[tokenToList] = _token;
    listedTokens[tokenToDelist].state = State.Delisting;
  }

  /**
  * Sets exchange lock, under which swap and liquidity add (but not remove) are disabled
  */
  function lockExchange() external onlyOwner() {
    DFP_config.unlocked = false;
  }

  /**
  * Resets exchange lock.
  */
  function unlockExchange() external onlyOwner() {
    DFP_config.unlocked = true;
  }
}
