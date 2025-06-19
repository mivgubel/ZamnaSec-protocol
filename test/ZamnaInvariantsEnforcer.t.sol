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
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant INVARIANT_CONFIGURER = keccak256("INVARIANT_CONFIGURER");
    bytes32 public constant INVARIANT_ASKER = keccak256("INVARIANT_ASKER");

    ZamnaFactory public zamnaFactory;
    ZamnaInvariantsEnforcer public zamnaEnforcer;
    Vault_ProtocolX public vaultX;
    //ZamnaUSDC public zUSDC;

    address public invariantContract;
    FeeVault public feeVault;
    IERC20 public feetoken;
    uint256 public feeAmount = 1 ether; // 1 USDC

    address public owner_ZamnaPlatform = address(this);
    address public configurer = address(1);
    address public asker = address(2);
    address public allowedDeployer = address(3);
    address public attacker = address(4);

    function setUp() public {
        // Create el fork de arbitrum sepolia en el block: 148855678
        /*  uint256 forkId = vm.createFork(ARBITRUM_SEPOLIA_RPC_URL, 148855678);
        vm.selectFork(forkId); */

        feeVault = new FeeVault();
        feetoken = new ZamnaUSDC();
        vaultX = new Vault_ProtocolX(address(feetoken), address(zamnaEnforcer), address(feetoken));
        // Creamos el Factory, para deployar los contratos de invariants
        zamnaFactory = new ZamnaFactory(address(feetoken), feeAmount, address(feeVault));
        // Permitimos a un deployer
        zamnaFactory.allowInvariantsDeployer(allowedDeployer, true);
        //Deployamos el contrato de invariants
        vm.prank(allowedDeployer);
        invariantContract = zamnaFactory.deployInvariantsContract(configurer);
        // referenciamos la address devuelta a la variable local del ZamnaInvariantsEnforcer
        zamnaEnforcer = ZamnaInvariantsEnforcer(invariantContract);
    }

    /* 
    function test_First_Depositor_Attack() public {
        // **** Test Register Address Invariant *** //
        uint256 invariantID = 1;
        string memory name = "Prevent First Depositor Attack";
        uint8 invariantType = 3; // Address type
        uint8 rule = 3; // Rule: "=="
        bytes32 amountRegister = bytes32(uint256(uint160(asker)));
        uint256 balance_asker = feeAmount * 100;
        address contractValue = address(5);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, address(vaultX), invariantType, rule, amountRegister);

        // Send 100 zUSDC to the vault address to pay invariant fees
        feetoken.transfer(address(vaultX), balance_asker);

        // vault approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(address(vaultX));
        feetoken.approve(address(zamnaEnforcer), balance_asker);

        // Invariant Revert si no es llamada por el asker. Error: asker not allowed
        vm.expectRevert("Asker not Allowed");
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(address(vaultX));
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, contractValue);
    } 
    */

    function test_InvariantsContractDeployment() public view {
        // contract is deployed in the setUp function.
        // Validaciones
        // assertEq(zamnaEnforcer.owner(), address(zamnaFactory), "Error: Owner Incorrecto");
        // check DEFAULT_ADMIN_ROLE
        assertTrue(zamnaEnforcer.hasRole(DEFAULT_ADMIN_ROLE, address(zamnaFactory)), "Error: Factory is not ADMIN");
        // check INVARIANT_CONFIGURER
        assertTrue(zamnaEnforcer.hasRole(INVARIANT_CONFIGURER, configurer), "Error: Role Configured unsetted");
        // check INVARIANT_ASKER
        //assertTrue(zamnaEnforcer.hasRole(INVARIANT_ASKER, asker), "Error: Role asker unsetted");
    }

    //*** Test if the uint invariant was created correctly. ***//
    function test_Create_Invariant() public {
        uint256 invariantID = 1;
        string memory name = "Uint Invariant 1";
        uint8 invariantType = 1; // uint type
        uint8 rule = 1; // Rule: menor que
        bytes32 amountRegister = bytes32(uint256(100 ether));

        // Debe revertir con Error: AccessControlUnauthorizedAccount.
        vm.expectRevert();
        // ID: 1, Rule: menor que, value send by protocol to check: 1, Invariant value: 100 ether.
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // *** test register correctly:
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        (,,,, bytes32 _value) = zamnaEnforcer.getInvariant(invariantID);
        assertEq(amountRegister, _value, "Error: Amount no Register");
        bool isInvariantActive = zamnaEnforcer.isInvariantActive(invariantID);
        assertEq(isInvariantActive, true, "Error: Invariant is not active");

        // **** Test Register Address Invariant *** //
        uint256 invariantID2 = 2;
        string memory name2 = "Address Invariant";
        uint8 invariantType2 = 3; // Address type
        uint8 rule2 = 3; // Rule: "=="
        bytes32 amountRegister2 = bytes32(uint256(uint160(asker)));

        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name2, asker, invariantType2, rule2, amountRegister2);

        (,,,, bytes32 _value2) = zamnaEnforcer.getInvariant(invariantID2);
        assertEq(amountRegister2, _value2, "Error: Amount no Register");
        bool isInvariantActive2 = zamnaEnforcer.isInvariantActive(invariantID2);
        assertEq(isInvariantActive2, true, "Error: Invariant is not active");

        // **** Test Register Bool Invariant *** //
        uint256 invariantID3 = 3;
        string memory name3 = "bool Invariant";
        uint8 invariantType3 = 4; // Address type
        uint8 rule3 = 3; // Rule: "=="
        bytes32 amountRegister3 = bytes32(abi.encodePacked(true));

        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name3, asker, invariantType3, rule3, amountRegister3);

        (,,,, bytes32 _value3) = zamnaEnforcer.getInvariant(invariantID3);
        assertEq(amountRegister3, _value3, "Error: Amount no Register");
        bool isInvariantActive3 = zamnaEnforcer.isInvariantActive(invariantID3);
        assertEq(isInvariantActive3, true, "Error: Invariant is not active");
    }

    //*** Test if the uint invariant is updated correctly. *** //
    function test_Update_Invariant() public {
        uint256 invariantID = 1;
        string memory name = "Uint Invariant 1";
        uint8 invariantType = 1; // uint type
        uint8 rule = 1; // Rule: menor que
        bytes32 amountRegister = bytes32(uint256(100));

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // *** Test update *** //
        vm.expectRevert("Invariant Should be Disable Before Update."); // Revierte: Invariant Should be Disable Before Update.
        vm.prank(configurer);
        zamnaEnforcer.Update_Invariant(invariantID, name, asker, invariantType, rule, amountRegister);

        // Should update correctly:
        bytes32 amountRegister2 = bytes32(uint256(50));
        vm.startPrank(configurer);
        zamnaEnforcer.Disable_Invariant(invariantID, false);
        zamnaEnforcer.Update_Invariant(invariantID, name, asker, invariantType, rule, amountRegister2);
        vm.stopPrank();

        (,,,, bytes32 _value) = zamnaEnforcer.getInvariant(invariantID);
        assertEq(uint256(amountRegister2), uint256(_value), "Error: Amount no Register");
    }

    //*** Test Enforcement of uint invariant. ***//
    function test_Invariant_Enforcement_Uint() public {
        uint256 invariantID = 1;
        string memory name = "Uint Invariant 1";
        uint8 invariantType = 1; // uint type
        uint8 rule = 1; // Rule: menor que
        bytes32 amountRegister = bytes32(uint256(100));
        uint256 balance_asker = feeAmount * 100;
        uint256 contractValue = 101;

        // Debe revertir con invariant disable
        vm.expectRevert("Asker not Allowed");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Uint(invariantID, contractValue);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // Send 100 zUSDC to the asker address
        feetoken.transfer(asker, balance_asker);
        feetoken.transfer(configurer, balance_asker);

        // asker contract approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(asker);
        feetoken.approve(address(zamnaEnforcer), balance_asker);
        /* vm.prank(configurer);
        feetoken.approve(address(zamnaEnforcer), balance_asker); */

        // Invariant Revert si no es llamada por el asker. Error: AccessControlUnauthorizedAccount
        vm.expectRevert("Asker not Allowed");
        zamnaEnforcer.Enforce_Invariant_Uint(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Uint(invariantID, contractValue);
    }

    //*** Test CUE (Create, Update, Enforce) functionality of type Int invariants. *** //
    function test_CUE_Int_Invariants() public {
        uint256 invariantID = 1;
        string memory name = "Uint Invariant 1";
        uint8 invariantType = 3; // address type
        uint8 rule = 1; // Rule: menor que
        bytes32 amountRegister = bytes32(uint256(100));
        uint256 balance_asker = feeAmount * 100;
        int256 contractValue = 101;

        // Debe revertir con invariant disable
        vm.expectRevert("Asker not Allowed");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Int(invariantID, contractValue);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // Send 100 zUSDC to the asker address
        feetoken.transfer(asker, balance_asker);

        // asker contract approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(asker);
        feetoken.approve(address(zamnaEnforcer), balance_asker);

        // Invariant Revert si no es llamada por el asker. Error: AccessControlUnauthorizedAccount
        vm.expectRevert("Asker not Allowed");
        zamnaEnforcer.Enforce_Invariant_Int(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Int(invariantID, contractValue);
    }

    //*** Test CUE (Create, Update, Enforce) functionality of type Address Invariants. *** //
    function test_CUE_Address_Invariants() public {
        uint256 invariantID = 1;
        string memory name = "Address Invariant 1";
        uint8 invariantType = 3; // address type
        uint8 rule = 3; // Rule: igual a
        bytes32 amountRegister = bytes32(uint256(uint160(asker)));
        uint256 balance_asker = feeAmount * 100;
        address contractValue = address(5);

        // Debe revertir con invariant disable
        vm.expectRevert("Asker not Allowed");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, contractValue);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // Send 100 zUSDC to the asker address
        feetoken.transfer(asker, balance_asker);

        // asker contract approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(asker);
        feetoken.approve(address(zamnaEnforcer), balance_asker);

        // Invariant Revert si no es llamada por el asker. Error: AccessControlUnauthorizedAccount
        vm.expectRevert();
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, contractValue);
    }

    //*** Test CUE functionality of Invariants Type Bool. *** //
    function test_CUE_Bool_Invariants() public {
        uint256 invariantID = 1;
        string memory name = "Bool Invariant 1";
        uint8 invariantType = 4; // Bool type
        uint8 rule = 3; // Rule: igual a
        bytes32 amountRegister = bytes32(abi.encodePacked(true));
        uint256 balance_asker = feeAmount * 100;
        bool contractValue = false;

        // Debe revertir con invariant disable
        vm.expectRevert("Asker not Allowed");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Bool(invariantID, contractValue);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // Send 100 zUSDC to the asker address
        feetoken.transfer(asker, balance_asker);

        // asker contract approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(asker);
        feetoken.approve(address(zamnaEnforcer), balance_asker);

        // Invariant Revert si no es llamada por el asker. Error: AccessControlUnauthorizedAccount
        vm.expectRevert();
        zamnaEnforcer.Enforce_Invariant_Bool(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Bool(invariantID, contractValue);
    }

    //*** Test CUE functionality of Invariants Type Bytes32. *** //
    function test_CUE_Bytes32_Invariants() public {
        uint256 invariantID = 1;
        string memory name = "Bytes32 Invariant 1";
        uint8 invariantType = 5; // Bool type
        uint8 rule = 3; // Rule: igual a
        bytes32 amountRegister = bytes32("si");
        uint256 balance_asker = feeAmount * 100;
        bytes32 contractValue = bytes32("no");

        // Debe revertir con invariant disable
        vm.expectRevert("Asker not Allowed");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Bytes32(invariantID, contractValue);

        // Register the invariant.
        vm.prank(configurer);
        zamnaEnforcer.Create_Invariant(name, asker, invariantType, rule, amountRegister);

        // Send 100 zUSDC to the asker address
        feetoken.transfer(asker, balance_asker);

        // asker contract approve zamnaInvariantsEnforcer to transfer the fee for the invariant call.
        vm.prank(asker);
        feetoken.approve(address(zamnaEnforcer), balance_asker);

        // Invariant Revert si no es llamada por el asker. Error: AccessControlUnauthorizedAccount
        vm.expectRevert();
        zamnaEnforcer.Enforce_Invariant_Bytes32(invariantID, contractValue);

        // Invariant Reverts si es rota.
        vm.expectRevert("Hack Reverted: Invariant Broken");
        vm.prank(asker);
        zamnaEnforcer.Enforce_Invariant_Bytes32(invariantID, contractValue);
    }
}
