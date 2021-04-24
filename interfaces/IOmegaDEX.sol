// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.7.6;


interface IOmegaDEX {

    function swap(
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 minOutputAmount
    ) external payable returns (uint256 outputAmount);

    function addLiquidity(
      address inputToken,
      uint256 inputAmount,
      uint256 minLP,
      uint40 R
    ) external payable returns (uint256 deltaLP);

    function removeLiquidity(
      uint256 LPamount,
      address outputToken,
      uint256 minOutputAmount
    ) external returns (uint256 actualOutput);

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
}
