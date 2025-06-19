// SPDX-License-Identifier: BUSL-1.1
// ZamnaSec Protocol v0.2.0

/// @title The ZamnaSec Fee Vault.
/// @author Mike Bello - SC Security Researcher/Auditor - SC Developer.
/// @notice The vault where the Fee charge for invariants is saved.
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeeVault is Ownable {
    event Fees_Withdrawal(address token, address to, uint256 amount);

    constructor() Ownable(msg.sender) {
        //
    }
    // function to withdraw the fees.

    function withdrawFees(address _token, address _to, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(_to, _amount);
        emit Fees_Withdrawal(_token, _to, _amount);
    }
}
