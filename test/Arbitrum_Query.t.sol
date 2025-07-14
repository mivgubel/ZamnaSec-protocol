// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZamnaFactory} from "../src/ZamnaFactory.sol";
import {ZamnaUSDC} from "../src/Mock/ZamnaUSDC.sol";
import {IZamnaInvariantsEnforcer} from "../src/IZamnaInvariantsEnforcer.sol";
import {FeeVault} from "../src/Mock/FeeVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Arbitrum_Query_Test is Test {
    ZamnaFactory public zamnaFactory;
    // ZamnaUSDC public zUSDC;
    IZamnaInvariantsEnforcer public zamnaEnforcer;
    FeeVault public feeVault;

    address public account = 0x79ca0378515232218094a16B2CEdB7f3f0c6b657;
    address public invariantContract;
    // Bitso token: MXNB in Sepolia Arbitrum.
    IERC20 public feetoken; // = 0x82B9e52b26A2954E113F94Ff26647754d5a4247D;
    uint256 public feeAmount = 1e6;

    function setUp() public {
        feeVault = FeeVault(0xD413911aEd4917224FA4Dd007d4Fe3d51FfF372e);
        //zUSDC = ZamnaUSDC();
        feetoken = IERC20(0x82B9e52b26A2954E113F94Ff26647754d5a4247D);
        zamnaFactory = ZamnaFactory(0x87c477d181Ab3133810dfca3B5D0c99bE7d2D64C);
        zamnaEnforcer = IZamnaInvariantsEnforcer(0x12B2F88f9F9830566dcbDe528a121c9830927A5E);
    }

    function test_queryContractsAmount() public view {
        uint32 numContracts = zamnaFactory.numContractsDeployedByUser(account);
        console.log("numContractsDeployedByUser:", numContracts);
    }
}
