// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IZamnaInvariantsEnforcer {
    // functions
    function configurer() external returns (address);
    function asker() external returns (address);
    function feeToken() external returns (IERC20);
    function feeAmount() external returns (uint256);
}
