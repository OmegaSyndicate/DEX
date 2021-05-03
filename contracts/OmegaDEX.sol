// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "../interfaces/IOmegaDEX.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./derived/ERC20Lean.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/*
	OmegaDEX is a single controct, multi token DEX which allows trades between any two tokens.
    Trades between two tokens always follow the familiar local bonding curve x*y=k
    Flash loans of the reserves generate further revenue for LP providers
 */
contract OmegaDEX is IOmegaDEX, Ownable, ERC20 {
    using SafeMath for uint256;

    enum State {Unlisted, PreListing, Delisting, Listed}

    struct TokenSettings {
        State state;                                     // What state the token is currently in
        uint112 listingTarget;                    // Amount of tokens needed to activate listing
    }

    struct Config {
        bool unlocked;                              // Locked for trading to prevent re-entrancy misery
        uint40 oneMinusTradingFee;        // One minus the swap fee (0.40 fixed point integer)
        uint40 delistingBonus;                  // Amount of additional tokens to encourage people taking
    }

    struct ListingUpdate {
        address tokenToDelist;                    // Token to be removed
        address tokenToList;             // Token to be listed
    }

    mapping(address => TokenSettings) public listedTokens;
    Config public ODX_config;
    ListingUpdate public listingUpdate;

    /**
    * Only works correctly when invoked with full list of 15 token addresses.
    * Doesn't do any checks. Make sure you ONLY add well behaved ERC20s!!
    */
    constructor(address[] memory tokensToList) ERC20("ODX index 1", "OIX1") {
        Config memory config;
        config.unlocked = false;
        config.oneMinusTradingFee = 0xffbe76c8b4;
        config.delistingBonus = 0;
        ODX_config = config;

        TokenSettings memory listed;
        listed.state = State.Listed;
        uint256 nrOfTokens = tokensToList.length > 15 ? 15 : tokensToList.length;
        for (uint256 i = 0; i < nrOfTokens; i++) {
          listedTokens[tokensToList[i]] = listed;
        }

        _mint(msg.sender, 1600e18);
    }

    receive() external payable {}  // For bootstrapping ETH liquidity

    modifier onlyListedToken(address token) {
        require(
            token == address(0) || listedTokens[token].state > State.Delisting,
            "ODX: Token not listed."
        );
        _;
    }

    /**
        Allows users to swap between any two tokens listed on the DEX.
        The invariant used for swaps between two tokens is the familiar UniSwap AMM hyperbole:

                                                            x * y = k

        For ETH trades, send the ETH with the transaction and use the NULL address as inputToken.
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
        Config memory _config = ODX_config;
        require(_config.unlocked, "ODX: Locked.");

        uint256 initialInputBalance;
        if (inputToken == address(0)) {
            require(msg.value == inputAmount, "ODX: bad ETH amount.");
            initialInputBalance = address(this).balance - inputAmount;
        } else {
            initialInputBalance = IERC20(inputToken).balanceOf(address(this));
            require(
                IERC20(inputToken).transferFrom(msg.sender, address(this), inputAmount),
                "ODX: Transfer failed."
            );
        }

        uint256 initialOutputBalance;
        if (outputToken == address(0)) {
          initialOutputBalance = address(this).balance;
        } else {
          initialOutputBalance = IERC20(outputToken).balanceOf(address(this));
        }
        // Can skip overflow/underflow checks on this calculation as they will always work against an attacker anyway.
        uint256 netInputAmount = inputAmount * _config.oneMinusTradingFee;
        outputAmount = netInputAmount * initialOutputBalance / ((initialInputBalance << 40) + netInputAmount);
        require(outputAmount > minOutputAmount, "ODX: No deal.");

        if (outputToken == address(0)) {
            address payable sender = msg.sender;
            sender.transfer(outputAmount);
        } else {
            IERC20(outputToken).transfer(msg.sender, outputAmount);
        }
        // emitting events costs gas, but I feel it is needed to allow informed governance decisions
        emit Swapped(msg.sender, inputToken, outputToken, inputAmount, outputAmount);
    }

    /**
        Adding liquidity to the DEX is a single sided operation. For fair LP token distribution, we
        should actualy add to all tokens in the proper ratio, like UniSwap does with the two tokens in
        each pair. However, with up to 16 listed tokens this becomes impractical and expensive.
        Therefore, the liquidity is added only to a single token in practice. Mathematically, the
        DEX behaves as if liquidity were added to all listed tokens, and then all the added liquidity is
        swapped back to the selected token. For N listed tokens, we get:

              LP_minted = R * LP_total
              R = (1 + X_supplied/X_initial)^(1/N) - 1

        When adding ETH, the inputToken address to be used is the NULL address.
        Note that for withdrawal transactions, a swapping fee is taken into account. The reason for
        this is that it would otherwise be possible to add/withdraw liquidity rather than swapping,
        thereby avoiding the swapping fee.
    */
    function addLiquidity(address inputToken, uint256 inputAmount, uint256 minLP)
        external
        payable
        onlyListedToken(inputToken)
        override
        returns (uint256 actualLP)
    {
        Config memory _config = ODX_config;
        require(_config.unlocked, "ODX: Locked.");

        uint256 initialBalance;
        if (inputToken == address(0)) {
            require(msg.value == inputAmount, "ODX: Incorrect amount of ETH.");
            initialBalance = address(this).balance - inputAmount;
        } else {
            initialBalance = IERC20(inputToken).balanceOf(address(this));
            require(
                IERC20(inputToken).transferFrom(msg.sender, address(this), inputAmount),
                "ODX: Transfer failed."
            );
        }
        require(inputAmount < initialBalance, "ODX: Excessive add.");

        uint256 X = (inputAmount * _config.oneMinusTradingFee) / initialBalance;  // 0.40 bits
        uint256 X_ = X * X;                                // X^2   0.80 bits
        uint256 R_ = (X >> 4) - (X_ * 15 >> 49);           // R2    0.40 bits
        X_ = X_ * X;                                       // X^3   0.120 bits
        R_ = R_ + (X_ * 155 >> 93);                        // R3    0.40 bits
        X_ = X_ * X;                                       // X^4   0.160 bits
        R_ = R_ - (X_ * 7285 >> 139);                      // R4    0.40 bits
        X_ = X_ * X >> 120;                                // X^5   0.80 bits
        R_ = R_ + (X_ * 91791 >> 63);                      // R5    0.40 bits
        X_ = X_ * X;                                       // X^6   0.120 bits
        R_ = R_ - (X_ * 2417163 >> 108);                   // R6    0.40 bits

        actualLP = R_ * _totalSupply >> 40;
        require(actualLP > minLP, "ODX: No deal.");
        _mint(msg.sender, actualLP);
        // emitting events costs gas, but I feel it is needed to allow informed governance decisions
        emit LiquidityAdded(msg.sender, inputToken, inputAmount, actualLP);
    }

    /**
        Withdrawing liquidity from the DEX is a single sided operation. For fair LP token liquiadation
        the liquidity should be withdrawn from all tokens in the appropriate ratios. However, with up
        to 16 listed tokens this becomes impractical and expensive. Thus, liquidity is only withdrawn
        from a single token instead. Mathematically, the DEX behaves as if the liquidity was indeed
        withdrawn from all listed tokens, and then swapped back to the selected token at no fee.
        For N listed tokens, this works out to:

            LP_burnt = R * LP_initial
            X_withdrawn = X_initial * (1 -  (1 - R)^N)

     */
    function removeLiquidity(uint256 LPamount, address outputToken, uint256 minOutputAmount)
        external
        onlyListedToken(outputToken)
        override
        returns (uint256 actualOutput)
    {
        // no lock check -- can remove liquidity even if exchange is locked for trading
        uint256 initialBalance;
        if (outputToken == address(0)) {
            initialBalance = address(this).balance;
        } else {
            initialBalance = IERC20(outputToken).balanceOf(address(this));
        }

        // Actual amount of output token calculation.
        uint256 F_;
        F_ = (1 << 64) - (LPamount << 64) / _totalSupply;   // (1-R)      (0.60 bits)
        F_ = F_ * F_;                                       // (1-R)^2    (0.120 bits)
        F_ = F_ * F_ >> 192;                                // (1-R)^4    (0.60 bits)
        F_ = F_ * F_;                                       // (1-R)^8    (0.120 bits)
        F_ = F_ * F_ >> 192;                                // (1-R)^16   (0.60 bits)
        actualOutput = initialBalance * ((1 << 64) - F_) >> 64;
        require(actualOutput > minOutputAmount, "ODX: No deal.");

        _burn(msg.sender, LPamount);
        if (outputToken == address(0)) {
            address payable sender = msg.sender;
            sender.transfer(actualOutput);
        } else {
            IERC20(outputToken).transfer(msg.sender, actualOutput);
        }
        // emitting events costs gas, but I feel it is needed to allow informed governance decisions
        emit LiquidityRemoved(msg.sender, outputToken, actualOutput, LPamount);
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
      TokenSettings memory tokenToList = listedTokens[inputToken];
      require(
        tokenToList.state == State.PreListing,
        "ODX: Wrong token."
      );
      uint256 initialInputBalance = IERC20(inputToken).balanceOf(address(this));
      uint256 availableAmount = tokenToList.listingTarget - initialInputBalance;
      uint256 actualInputAmount = maxInputAmount > availableAmount ? availableAmount : maxInputAmount;

      require(
        IERC20(inputToken).transferFrom(msg.sender, address(this), actualInputAmount),
        "ODX: token transfer failed."
      );

      TokenSettings memory tokenToDelist = listedTokens[outputToken];
      require(
        tokenToDelist.state == State.Delisting,
        "ODX: Wrong token."
      );
      uint256 initialOutputBalance = IERC20(outputToken).balanceOf(address(this));
      outputAmount = actualInputAmount.mul(initialOutputBalance).div(availableAmount);
      IERC20(outputToken).transfer(msg.sender, outputAmount);

      emit LiquidityBootstrapped(
        msg.sender,
        inputToken,
        actualInputAmount,
        outputToken,
        outputAmount
      );

      if (actualInputAmount == availableAmount) {
        tokenToList.state = State.Listed;
        listedTokens[inputToken] = tokenToList;
        delete listedTokens[outputToken];
        delete listingUpdate;
        emit BootstrapCompleted(outputToken, inputToken);
      }
    }

    /**
     * @dev Update the fee structure for the exchange
     * @param tokenToDelist The token that is being delisted
     * @param tokenToList The token that is coming in its place
     * @param listingTarget The amount of tokens required for the listing to become active
     */
    function changeListing(
       address tokenToDelist,              // Address of token to be delisted
       address tokenToList,                // Address of token to be listed
       uint112 listingTarget               // Amount of tokens needed to activate listing
    ) external onlyListedToken(tokenToDelist) onlyOwner() {
        require(tokenToDelist != address(0), "ODX: Cannot delist ETH.");
        ListingUpdate memory update = listingUpdate;
        require(update.tokenToDelist == address(0), "ODX: Previous update incomplete.");

        TokenSettings memory _token = listedTokens[tokenToList];
        require(_token.state == State.Unlisted, "ODX: Token already listed.");

        update.tokenToDelist = tokenToDelist;
        update.tokenToList = tokenToList;
        listingUpdate = update;

        _token.state = State.PreListing;
        _token.listingTarget = listingTarget;
        listedTokens[tokenToList] = _token;
        listedTokens[tokenToDelist].state = State.Delisting;
    }

    /**
        Sets exchange lock.
    */
    function lockExchange() external onlyOwner() {
        ODX_config.unlocked = false;
    }

    /**
        Resets exchange lock.
    */
    function unlockExchange() external onlyOwner() {
        ODX_config.unlocked = true;
    }
}
