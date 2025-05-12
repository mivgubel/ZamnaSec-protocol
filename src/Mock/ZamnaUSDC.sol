// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZamnaUSDC is ERC20, Ownable {
    constructor() ERC20("ZamnaUSDC", "ZmUSDC") Ownable(msg.sender) {
        _mint(msg.sender, 100_000 ether);
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
