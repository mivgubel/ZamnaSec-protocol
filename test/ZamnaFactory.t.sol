// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZamnaFactory} from "../src/ZamnaFactory.sol";
import {ZamnaUSDC} from "../src/Mock/ZamnaUSDC.sol";
import {IZamnaInvariantsEnforcer} from "../src/IZamnaInvariantsEnforcer.sol";
import {FeeVault} from "../src/Mock/FeeVault.sol";

contract ZamnaFactoryTest is Test {
    ZamnaFactory public zamnaFactory;
    ZamnaUSDC public zUSDC;
    IZamnaInvariantsEnforcer public zamnaEnforcer;
    FeeVault public feeVault;

    address public owner_ZamnaPlatform = address(this);
    address public allowedDeployer = address(3);
    address public configurer = address(1);
    address public asker = address(2);
    address public invariantContract;
    // Bitso token: MXNB in Sepolia Arbitrum.
    address public feetoken; // = 0x82B9e52b26A2954E113F94Ff26647754d5a4247D;
    uint256 public feeAmount = 1e6;

    function setUp() public {
        feeVault = new FeeVault();
        zUSDC = new ZamnaUSDC();
        feetoken = address(zUSDC);
        zamnaFactory = new ZamnaFactory(feetoken, feeAmount, address(feeVault));
        // Permitimos a una deployer
        zamnaFactory.allowInvariantsDeployer(allowedDeployer, true);

        vm.prank(allowedDeployer);
        invariantContract = zamnaFactory.deployInvariantsContract(configurer);
    }

    function test_InvariantDeployment() public view {
        // Validaciones de lo deployado en setUp()
        assertNotEq(invariantContract, address(0), "Error: Contrato no deployado");
        bool isRegistered = zamnaFactory.isInvariantContractActive(invariantContract);
        assertTrue(isRegistered, "Error:Registro no Actualizado");
    }

    function test_change_Configurer_Asker() public {
        zamnaEnforcer = IZamnaInvariantsEnforcer(invariantContract);

        // Validamos que cambia el configurer
        vm.prank(allowedDeployer);
        zamnaFactory.Change_Configurer_Role(asker, invariantContract);
        assertEq(asker, zamnaEnforcer.configurer(), "Configurer not Changed");
    }

    function test_FeeToken_FeeAmount_Change() public {
        vm.prank(allowedDeployer);
        address invariantContract2 = zamnaFactory.deployInvariantsContract(configurer);

        // Primer invariant contract
        IZamnaInvariantsEnforcer zamnaEnforcer1 = IZamnaInvariantsEnforcer(invariantContract);
        // Segundo invariant contract
        zamnaEnforcer = IZamnaInvariantsEnforcer(invariantContract2);
        address newFeeToken = address(new ZamnaUSDC());
        uint256 newAmount = 2e6;

        // Check in FeeToken was change successfully.
        zamnaFactory.setFeeToken(newFeeToken, invariantContract2);
        assertNotEq(newFeeToken, address(zamnaEnforcer1.feeToken()), "Fee Token Changed");
        assertEq(newFeeToken, address(zamnaEnforcer.feeToken()), "Fee Token not Changed");

        // Check if Fee amount was change
        zamnaFactory.setFeeAmount(newAmount, invariantContract2);
        assertEq(newAmount, zamnaEnforcer.feeAmount(), "Fee Amount not Changed");
    }
}
