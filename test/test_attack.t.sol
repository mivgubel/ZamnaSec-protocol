// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZamnaFactory} from "../src/ZamnaFactory.sol";
import {ZamnaInvariantsEnforcer} from "../src/ZamnaInvariantsEnforcer.sol";
import {ZamnaUSDC} from "../src/Mock/ZamnaUSDC.sol";
import {FeeVault} from "../src/Mock/FeeVault.sol";
import {Vault_ProtocolX} from "../src/Mock/Vault_ProtocolX.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZamnaInvariantsEnforcerTest is Test {
    ZamnaFactory public zamnaFactory;
    ZamnaInvariantsEnforcer public zamnaEnforcer;
    Vault_ProtocolX public vaultX;

    address public invariantContract;
    FeeVault public feeVault;
    IERC20 public feetoken;
    uint256 public feeAmount = 1 ether; // 1 ZamnaUSDC

    address public configurer = 0x79ca0378515232218094a16B2CEdB7f3f0c6b657;
    address public asker = address(2);
    address public allowedDeployer = address(3);
    address public attacker = 0x43852311efE123c19a63542ac1A38F5Ca6B110Dd;

    function setUp() public {
        // Create Fork for Mantle Sepolia from Block: 24363340
        uint256 forkId = vm.createFork(vm.envString("MANTLE_RPC_URL"), 24363340);
        vm.selectFork(forkId);

        feeVault = FeeVault(0x731ff72Ca6D46214177Ed95A068320467A2A9c42);
        feetoken = ZamnaUSDC(0x1Cbb54E74dc1Ad1dE064DFe0Dd7a3160f00c1c11);
        vaultX = Vault_ProtocolX(0xC142a813B5f20a1031449E8bb0A776EFeE722F8A);
        zamnaFactory = ZamnaFactory(0x002c970F848662d3dd14711301839E2637daa383);
        zamnaEnforcer = ZamnaInvariantsEnforcer(0x5D7d1e2b318721E3d2c075a6F636794A68837f16);
    }

    function test_First_Depositor_Attack() public {
        // Invariant Reverts if called for a different address from the address allowed in the invariant.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(attacker);
        vaultX.deposit(1);
    }
}
