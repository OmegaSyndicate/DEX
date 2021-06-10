// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.7.6;

interface IDeFiPlaza {
  function swap(
    address inputToken,
    address outputToken,
    uint256 inputAmount,
    uint256 minOutputAmount
  ) external payable returns (uint256 outputAmount);

  function addLiquidity(
    address inputToken,
    uint256 inputAmount,
    uint256 minLP
  ) external payable returns (uint256 deltaLP);

  function addMultiple(
    address[] calldata tokens,
    uint256[] calldata maxAmounts,
    uint256 minLP
  ) external payable returns (uint256 actualLP);

  function removeLiquidity(
    uint256 LPamount,
    address outputToken,
    uint256 minOutputAmount
  ) external returns (uint256 actualOutput);

  function removeMultiple(
    uint256 LPamount,
    address[] calldata tokens
  ) external returns (bool success);

  function bootstrapNewToken(
    address inputToken,
    uint256 maxInputAmount,
    address outputToken
  ) external returns (uint256 outputAmount);

  event Swapped(
    address sender,
    address inputToken,
    address outputToken,
    uint256 inputAmount,
    uint256 outputAmount
  );

  event LiquidityAdded(
    address sender,
    address token,
    uint256 tokenAmount,
    uint256 LPs
  );

  event LiquidityRemoved(
    address recipient,
    address token,
    uint256 tokenAmount,
    uint256 LPs
  );

  event LiquidityBootstrapped(
    address sender,
    address inputToken,
    uint256 inputAmount,
    address outputToken,
    uint256 outputAmount
  );

  event BootstrapCompleted(
    address delistedToken,
    address listedToken
  );
}
