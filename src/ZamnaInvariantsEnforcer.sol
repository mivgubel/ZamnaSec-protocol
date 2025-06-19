// SPDX-License-Identifier: BUSL-1.1
// ZamnaSec Protocol v0.2.0

pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title The ZamnaSec Invariants Enforcer.
/// @author Mike Bello - SC Security Researcher/Auditor - SC Developer.
/// @notice This contract is deployed with the invariants created for every contract/function a user wants to protect from Hacks.
/// @dev The invariants in this contract can be created, updated, enable/disable and enforce just calling the correct function from the protocol user's contract.
// A Protocol can deploy one or more instances of this contract.
contract ZamnaInvariantsEnforcer is AccessControl {
    using SafeERC20 for IERC20;

    event Invariant_Created(
        uint256 indexed invariantID,
        address indexed invariant_contract,
        address configurer,
        string name,
        address asker,
        uint8 _type,
        uint8 rule,
        bytes32 InvariantValue
    );
    event Invariant_updated(
        uint256 indexed invariantID,
        address indexed invariant_contract,
        address configurer,
        string name,
        address asker,
        uint8 _type,
        uint8 rule,
        bytes32 InvariantValue
    );
    ///@param invariant_contract: the address of this invariant contract, to identify this contract on the frontend.
    event Enforce_Invariant_uint(
        uint256 indexed invariantID, address indexed invariant_contract, uint256 valueToCheck, uint256 valueToEnforce
    );
    event Enforce_Invariant_int(
        uint256 indexed invariantID, address indexed invariant_contract, int256 valueToCheck, int256 valueToEnforce
    );
    event Enforce_Invariant_address(
        uint256 indexed invariantID, address indexed invariant_contract, address valueToCheck, address valueToEnforce
    );
    event Enforce_Invariant_Boolean(
        uint256 indexed invariantID, address indexed invariant_contract, bool valueToCheck, bool valueToEnforce
    );
    event Enforce_Invariant_bytes32(
        uint256 indexed invariantID, address indexed invariant_contract, bytes32 valueToCheck, bytes32 valueToEnforce
    );
    event Invariant_Disable(uint256 invariantID, address invariantContract, address configurer, bool isEnable);
    event Configurer_Changed(address invariantContract, address oldConfigurer, address newConfigurer);
    event FeeToken_Changed(address invariantContract, address oldFeeToken, address newFeeToken);
    event FeeAmount_Changed(address invariantContract, uint256 oldFeeAmount, uint256 newFeeAmount);

    bytes32 public constant INVARIANT_CONFIGURER = keccak256("INVARIANT_CONFIGURER");

    //@note agregar un registro de las wallets que han sido bloqueadas.

    address public configurer;
    // the vault that will get all the fee charge for invariant rules.
    address public feeVault;
    IERC20 public feeToken; // Token in which Fees are paid.
    uint256 public feeAmount;
    // current invariant ID number.
    uint256 public countInvariantID;

    // en las invariants
    struct Invariant {
        string name;
        address asker;
        // 1: uint, 2: int, 3: address, 4: bool, 5: bytes32
        uint8 invariantType;
        // 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">", 6: "!="
        uint8 rule;
        // keccak256 of the value to compare against
        bytes32 value;
    }
    // check if an invariant ID is actived.

    mapping(uint256 InvariantID => bool isActive) public isInvariantActive;
    // Invariants created on this contract.
    mapping(uint256 InvariantID => Invariant) public invariants;

    /// Constructor.
    /// @param _configurer - Address of the wallet of ZamnaSec Platform, also the owner of this contract.
    /// @dev the msg.sender is the Zamna Factory.
    constructor(address _configurer, address _FeeVault, address _feeToken, uint256 _feeAmount) {
        // role for admin functions (zamna factory)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INVARIANT_CONFIGURER, _configurer);
        configurer = _configurer;
        feeVault = _FeeVault;
        feeToken = IERC20(_feeToken);
        feeAmount = _feeAmount; // MxnB maneja 6 decimales == 1 peso de fee.
        countInvariantID++; // la iniciamos en 1
    }

    // ****** Functions to Create, Update Invariants. ******

    ///@dev Function to Create an Invariant.
    ///@param _name : Name for the Invariant.
    ///@param _asker : The Contract Address who can call Enforce_Invariant functions.
    ///@param _type: The invariant type (uint, int, address, bool, bytes32).
    ///@param _rule: The rule the invariant must validate.
    ///@param _InvariantValue: The invariant value to validate the rule against. Se debe enviar el valor como un Bytes32
    function Create_Invariant(string calldata _name, address _asker, uint8 _type, uint8 _rule, bytes32 _InvariantValue)
        external
        onlyRole(INVARIANT_CONFIGURER)
    {
        // Invariant struct to register.
        Invariant memory inv =
            Invariant({name: _name, asker: _asker, invariantType: _type, rule: _rule, value: _InvariantValue});

        // Register the invariant in the mapping.
        invariants[countInvariantID] = inv;
        // set the invariant as active.
        isInvariantActive[countInvariantID] = true;
        // emit the event of invariant creation.
        emit Invariant_Created(
            countInvariantID, address(this), msg.sender, _name, _asker, _type, _rule, _InvariantValue
        );
        // Increment the invariant counter.
        countInvariantID++;
    }

    ///@dev Function to Update an Invariant.
    ///@param _invariantID : Invariant ID to update.
    function Update_Invariant(
        uint256 _invariantID,
        string calldata _name,
        address _asker,
        uint8 _type,
        uint8 _rule,
        bytes32 _InvariantValue
    ) external onlyRole(INVARIANT_CONFIGURER) {
        // the invariant should be inactive to be able to update it.
        require(!isInvariantActive[_invariantID], "Invariant Should be Disable Before Update.");
        // Validate that the ID to update is a valid ID
        require(_invariantID < countInvariantID, "Invalid Invariant ID.");
        //@note falta validar que el valor sea un valor valido para el tipo de invariant.

        // Invariant struct to update.
        Invariant memory inv =
            Invariant({name: _name, asker: _asker, invariantType: _type, rule: _rule, value: _InvariantValue});
        // Update the Invariant in the invariants mapping.
        invariants[_invariantID] = inv;
        // Set the invariant as active again.
        isInvariantActive[_invariantID] = true;
        // Emit the update invariant event.
        emit Invariant_updated(_invariantID, address(this), msg.sender, _name, _asker, _type, _rule, _InvariantValue);
    }

    ///@dev Enforce an Invariant type uint. The asker should allow this contract to transfer the Fee token amount.
    // Estas funciones se ponen por separado para que el protocolo envie el valor tal cual y no tenga que convertirlo a un bytes32 antes de enviarlo.
    ///@param _invariantID: Invariant ID to enforce.
    ///@param _contractValue: Value to check.
    function Enforce_Invariant_Uint(uint256 _invariantID, uint256 _contractValue) external {
        Invariant memory inv = invariants[_invariantID];
        // only the address register as asker for this invariant can call it.
        require(inv.asker == msg.sender, "Asker not Allowed");

        // If invariant is active then we check the invariant, if not we do nothing. Not a requiere to not cause a DOS when an invariant is disable.
        if (isInvariantActive[_invariantID]) {
            // Convert the value from uint to bytes32
            bytes32 contractValue = bytes32(_contractValue);
            // transfert the fee to the Fee Vault contract.
            feeToken.safeTransferFrom(msg.sender, feeVault, feeAmount);
            // Emit the event before a possible revert.
            emit Enforce_Invariant_uint(_invariantID, address(this), _contractValue, uint256(inv.value));

            // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">", 6: "!="
            if (inv.rule == 1) {
                // el valor tiene que ser menor si no revierte la tx
                require(contractValue < inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 2) {
                require(contractValue <= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 3) {
                require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 4) {
                require(contractValue >= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 5) {
                require(contractValue > inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 6) {
                require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
            }
        }
    }

    ///@dev Enforce an Invariant type uint.
    // Estas funciones se ponen por separado para que el protocolo envie el valor tal cual y no tenga que convertirlo aun bytes32 antes de enviarlo.
    ///@param _invariantID: Invariant ID to enforce.
    ///@param _contractValue: Value to check.
    function Enforce_Invariant_Int(uint256 _invariantID, int256 _contractValue) external {
        Invariant memory inv = invariants[_invariantID];
        // only the address register as asker for this invariant can call it.
        require(inv.asker == msg.sender, "Asker not Allowed");
        //@note implementar safeCasting de OZ para todos los casting hechos en el contrato.

        // If invariant is active then we check the invariant, if not we do nothing. Not a requiere to not cause a DOS when an invariant is disable.
        if (isInvariantActive[_invariantID]) {
            // Convert the value to bytes32.
            bytes32 contractValue = bytes32(uint256(_contractValue));
            // Transfer and send the fee to the fee vault.
            feeToken.safeTransferFrom(msg.sender, feeVault, feeAmount);
            // Emit the event before a possible revert.
            emit Enforce_Invariant_int(_invariantID, address(this), _contractValue, int256(uint256(inv.value)));
            // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">", 6: "!="
            if (inv.rule == 1) {
                require(contractValue < inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 2) {
                require(contractValue <= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 3) {
                require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 4) {
                require(contractValue >= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 5) {
                require(contractValue > inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 6) {
                require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
            }
        }
    }

    ///@dev Enforce an Invariant type Address.
    function Enforce_Invariant_Address(uint256 _invariantID, address _contractValue) external {
        // Get Invariant Data.
        Invariant memory inv = invariants[_invariantID];
        // only the address register as asker for this invariant can call it.
        require(inv.asker == msg.sender, "Asker not Allowed");

        // If invariant is active then we check the invariant, if not we do nothing. Not a requiere to not cause a DOS when an invariant is disable.
        if (isInvariantActive[_invariantID]) {
            bytes32 contractValue = bytes32(uint256(uint160(_contractValue)));
            feeToken.safeTransferFrom(msg.sender, feeVault, feeAmount);
            emit Enforce_Invariant_address(
                _invariantID, address(this), _contractValue, address(uint160(uint256(inv.value)))
            );
            // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">", 6: "!="
            if (inv.rule == 1) {
                require(contractValue < inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 2) {
                require(contractValue <= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 3) {
                require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 4) {
                require(contractValue >= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 5) {
                require(contractValue > inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 6) {
                require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
            }
        }
    }

    ///@dev Enforce an Invariant type Bytes32.
    function Enforce_Invariant_Bytes32(uint256 _invariantID, bytes32 _contractValue) external {
        Invariant memory inv = invariants[_invariantID];
        require(inv.asker == msg.sender, "Asker not Allowed");

        if (isInvariantActive[_invariantID]) {
            feeToken.safeTransferFrom(msg.sender, feeVault, feeAmount);
            emit Enforce_Invariant_bytes32(_invariantID, address(this), _contractValue, inv.value);
            // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">", 6: "!="
            if (inv.rule == 1) {
                require(_contractValue < inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 2) {
                require(_contractValue <= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 3) {
                require(_contractValue == inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 4) {
                require(_contractValue >= inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 5) {
                require(_contractValue > inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 6) {
                require(_contractValue != inv.value, "Hack Reverted: Invariant Broken");
            }
        }
    }

    ///@dev Enforce an Invariant type Bool.
    function Enforce_Invariant_Bool(uint256 _invariantID, bool _contractValue) external {
        Invariant memory inv = invariants[_invariantID];
        require(inv.asker == msg.sender, "Asker not Allowed");

        if (isInvariantActive[_invariantID]) {
            bytes32 contractValue = bytes32(abi.encodePacked(_contractValue));
            feeToken.safeTransferFrom(msg.sender, feeVault, feeAmount);
            bool valueToEnforce = uint256(inv.value) == 1 ? true : false;
            emit Enforce_Invariant_Boolean(_invariantID, address(this), _contractValue, valueToEnforce);
            // Rules: 3: "==", 6: "!="
            if (inv.rule == 3) {
                require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
            } else if (inv.rule == 6) {
                require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
            }
        }
    }

    ///note Function to Disable Invariants.
    ///@param _invariantID : Invariant ID to Disable.
    function Disable_Invariant(uint256 _invariantID, bool _isEnable) external onlyRole(INVARIANT_CONFIGURER) {
        // Invariant should be active.
        require(isInvariantActive[_invariantID], "Invariant is already Disable.");
        // Disable the invariant in the mapping "isInvariantActive".
        isInvariantActive[_invariantID] = _isEnable;
        // Emit the event.
        emit Invariant_Disable(_invariantID, address(this), msg.sender, _isEnable);
    }

    // Function to return an Invariant Data.
    function getInvariant(uint256 _invariantID)
        public
        view
        returns (string memory _name, address _asker, uint8 _invariantType, uint8 _rule, bytes32 _value)
    {
        _name = invariants[_invariantID].name;
        _asker = invariants[_invariantID].asker;
        _invariantType = invariants[_invariantID].invariantType;
        _rule = invariants[_invariantID].rule;
        _value = invariants[_invariantID].value;
    }

    // Function to Change Configurer Role
    function setConfigurer(address _newConfigurer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Revoke the rol to the old account.
        _revokeRole(INVARIANT_CONFIGURER, configurer);
        // Set the role to the new account.
        _grantRole(INVARIANT_CONFIGURER, _newConfigurer);
        // Emit the event, before the variable update.
        emit Configurer_Changed(address(this), configurer, _newConfigurer);
        // udpate the contract's variable.
        configurer = _newConfigurer;
    }

    // Function to change the Feetoken
    function setFeetoken(address _newFeeToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Emit the event.
        emit FeeToken_Changed(address(this), address(feeToken), _newFeeToken);
        // Set the new Fee Token address.
        feeToken = IERC20(_newFeeToken);
    }

    // Function to change the feeAmount
    function setFeeAmount(uint256 _newFeeAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Emit the event.
        emit FeeAmount_Changed(address(this), feeAmount, _newFeeAmount);
        // Set the new Fee Amount to be charged for an invariant call.
        feeAmount = _newFeeAmount;
    }
}
