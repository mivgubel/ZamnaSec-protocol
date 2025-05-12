// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// se deployaraan uno mas contratos de estos por cada protocolo.
contract ZamnaInvariantsEnforcer is AccessControl, Ownable {
    using SafeERC20 for IERC20;

    bytes32 public constant INVARIANT_CONFIGURER = keccak256("INVARIANT_CONFIGURER");
    bytes32 public constant INVARIANT_ASKER = keccak256("INVARIANT_ASKER");

    address public configurer;
    address public asker;
    IERC20 public feeToken; // MXNB bitso token
    uint256 public feeAmount;
    // current invariant ID number.
    uint256 public countInvariantID;

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
    // valida si esta activa la invariant.

    mapping(uint256 InvariantID => bool isActive) public isInvariantActive;
    // registro de la invariant.
    mapping(uint256 InvariantID => Invariant) public invariants;

    /// Constructor.
    /// @param _configurer - Address of the wallet of ZamnaSec Platform, also the owner of this contract.
    /// @param _asker - Address of the contract of the protocol, who is gonna ask to validate the invariants.
    /// @dev the msg.sender is the Zamna Factory.
    constructor(address _configurer, address _asker, address _feeToken, uint256 _feeAmount) Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INVARIANT_CONFIGURER, _configurer);
        _grantRole(INVARIANT_ASKER, _asker);
        configurer = _configurer;
        asker = _asker;
        feeToken = IERC20(_feeToken);
        feeAmount = _feeAmount; // MxnB maneja 6 decimales == 1 peso de fee.
        countInvariantID++; // la iniciamos en 1
    }

    // ****** Functions to Create, Update Invariants. ******

    ///@dev Function to Create an Invariant.
    ///@param _name : Name for the Invariant.
    ///@param _contract : (asker) Contract Address.
    ///@param _rule: The rule the invariant must validate.
    ///@param _InvariantValue: The invariant value to validate the rule against. Se debe enviar el valor como un Bytes32
    function Create_Invariant(
        string calldata _name,
        address _contract,
        uint8 _type,
        uint8 _rule,
        bytes32 _InvariantValue
    ) external onlyRole(INVARIANT_CONFIGURER) {
        // creamos la struct invariant a registrar.
        Invariant memory inv =
            Invariant({name: _name, asker: _contract, invariantType: _type, rule: _rule, value: _InvariantValue});

        //@note agregar las validaciones para cuando sean un tipo: address, bool, bytes32 solo puedan usarse
        // reglas: "==","!="

        // Register the invariant en el mapping correspondiente.
        invariants[countInvariantID] = inv;
        // actualizar el mapping de activa para dejar la invarian activada.
        isInvariantActive[countInvariantID] = true;
        // Incrementamos el Invariants ID counter
        countInvariantID++;
    }

    ///@dev Function to Update an Invariant.
    ///@param _invariantID : Invariant ID to update.
    function Update_Invariant(
        uint256 _invariantID,
        string calldata _name,
        address _contract,
        uint8 _type,
        uint8 _rule,
        bytes32 _InvariantValue
    ) external onlyRole(INVARIANT_CONFIGURER) {
        // validar si la invariant esta activa, si esta activa revertir, primero deben deshabilitarla para poder actualizarla.
        require(!isInvariantActive[_invariantID], "Invariant Should be Disable Before Update.");
        // creamos la struct invariant a registrar.
        //@note agregar las validaciones para cuando sean un tipo: address, bool, bytes32 solo puedan usarse
        // reglas: "==","!="
        Invariant memory inv =
            Invariant({name: _name, asker: _contract, invariantType: _type, rule: _rule, value: _InvariantValue});
        // Register the invariant en el mapping correspondiente.
        invariants[_invariantID] = inv;
        // actualizar el mapping de activa para dejar la invarian activada.
        isInvariantActive[_invariantID] = true;
    }

    ///@dev Enforce an Invariant type uint.
    // Estas funciones se ponen por separado para que el protocolo envie el valor tal cual y no tenga que convertirlo aun bytes32 antes de enviarlo.
    ///@param _invariantID: Invariant ID to enforce.
    ///@param _contractValue: Value to check.
    function Enforce_Invariant_Uint(uint256 _invariantID, uint256 _contractValue) external onlyRole(INVARIANT_ASKER) {
        // validar que la invariant esta activa
        require(isInvariantActive[_invariantID], "Invalid Invariant ID.");
        // corroborar la invariant, si falla revertir la tx, si no terminar la funcion exitosamente.
        Invariant memory inv = invariants[_invariantID];
        // Convertimos el valor uint a bytes32
        bytes32 contractValue = bytes32(_contractValue);
        // Cobramos el fee por la llamada al invariant.
        feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">"
        if (inv.rule == 1) {
            // el valor tiene que ser menor si no revierte la tx
            require(contractValue < inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 2) {
            require(contractValue <= inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 3) {
            require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 4) {
            require(contractValue >= inv.value, "Hack Reverted: Invariant Broken");
        } else {
            // rule = 5
            require(contractValue > inv.value, "Hack Reverted: Invariant Broken");
        }
    }

    ///@dev Enforce an Invariant type uint.
    // Estas funciones se ponen por separado para que el protocolo envie el valor tal cual y no tenga que convertirlo aun bytes32 antes de enviarlo.
    ///@param _invariantID: Invariant ID to enforce.
    ///@param _contractValue: Value to check.
    function Enforce_Invariant_Int(uint256 _invariantID, int256 _contractValue) external onlyRole(INVARIANT_ASKER) {
        // validar que la invariant esta activa
        require(isInvariantActive[_invariantID], "Invalid Invariant ID.");
        // corroborar la invariant, si falla revertir la tx, si no terminar la funcion exitosamente.
        Invariant memory inv = invariants[_invariantID];
        // Convertimos el valor uint a bytes32
        //@note implementar safeCasting de OZ para todos los casting hechos en el contrato.
        bytes32 contractValue = bytes32(uint256(_contractValue));
        // Cobramos el fee por la llamada al invariant.
        feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Rules: 1: "<", 2: "<=", 3: "==", 4: ">=", 5: ">"
        if (inv.rule == 1) {
            // el valor tiene que ser menor si no revierte la tx
            require(contractValue < inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 2) {
            require(contractValue <= inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 3) {
            require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 4) {
            require(contractValue >= inv.value, "Hack Reverted: Invariant Broken");
        } else {
            // rule = 5
            require(contractValue > inv.value, "Hack Reverted: Invariant Broken");
        }
    }

    ///@dev Enforce an Invariant type Address.
    function Enforce_Invariant_Address(uint256 _invariantID, address _contractValue)
        external
        onlyRole(INVARIANT_ASKER)
    {
        // validar que la invariant esta activa
        require(isInvariantActive[_invariantID], "Invalid Invariant ID.");
        // Leemos los datos registrados en la invariant.
        Invariant memory inv = invariants[_invariantID];
        // Convertimos el valor uint a bytes32
        //@note implementar safeCasting de OZ para todos los casting hechos en el contrato.
        bytes32 contractValue = bytes32(uint256(uint160(_contractValue)));
        // Cobramos el fee por la llamada al invariant.
        feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Rules: 3: "==", 6: "!="
        if (inv.rule == 3) {
            // la address enviada por el contrato tiene que ser igual a la address registrada en la invarian, si no revierte la tx.
            require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 6) {
            // rule = 2
            require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
        }
    }

    ///@dev Enforce an Invariant type Bool.
    function Enforce_Invariant_Bool(uint256 _invariantID, bool _contractValue) external onlyRole(INVARIANT_ASKER) {
        // validar que la invariant esta activa
        require(isInvariantActive[_invariantID], "Invalid Invariant ID.");
        // Leemos los datos registrados en la invariant.
        Invariant memory inv = invariants[_invariantID];
        // Convertimos el valor uint a bytes32
        //@note implementar safeCasting de OZ para todos los casting hechos en el contrato.
        bytes32 contractValue = bytes32(abi.encodePacked(_contractValue));
        // Cobramos el fee por la llamada al invariant.
        feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Rules: 3: "==", 6: "!="
        if (inv.rule == 3) {
            // la address enviada por el contrato tiene que ser igual a la address registrada en la invarian, si no revierte la tx.
            require(contractValue == inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 6) {
            // rule = 2
            require(contractValue != inv.value, "Hack Reverted: Invariant Broken");
        }
    }

    ///@dev Enforce an Invariant type Bytes32.
    function Enforce_Invariant_Bytes32(uint256 _invariantID, bytes32 _contractValue)
        external
        onlyRole(INVARIANT_ASKER)
    {
        // validar que la invariant esta activa
        require(isInvariantActive[_invariantID], "Invalid Invariant ID.");
        // Leemos los datos registrados en la invariant.
        Invariant memory inv = invariants[_invariantID];
        // Cobramos el fee por la llamada al invariant.
        feeToken.safeTransferFrom(msg.sender, address(this), feeAmount);

        // Rules: 3: "==", 6: "!="
        if (inv.rule == 3) {
            // la address enviada por el contrato tiene que ser igual a la address registrada en la invarian, si no revierte la tx.
            require(_contractValue == inv.value, "Hack Reverted: Invariant Broken");
        } else if (inv.rule == 6) {
            require(_contractValue != inv.value, "Hack Reverted: Invariant Broken");
        }
    }

    ///note Function to Disable Invariants.
    ///@param _invariantID : Invariant ID to Disable.
    function Disable_Invariant(uint256 _invariantID) external onlyRole(INVARIANT_CONFIGURER) {
        // validar que la invariant este activa.
        require(isInvariantActive[_invariantID], "Invariant is already Disable.");
        // Deshabilitar la invarian en el mapping "isInvariantActive".
        isInvariantActive[_invariantID] = false;
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
    function setConfigurer(address _newConfigurer) external onlyOwner {
        // Quitamos el role a la cuenta anterior.
        _revokeRole(INVARIANT_CONFIGURER, configurer);
        // Seteamos el role a la nueva cuenta.
        _grantRole(INVARIANT_CONFIGURER, _newConfigurer);
        // Guardamos la address del nuevo configurer.
        configurer = _newConfigurer;
    }

    // Function to Change Asker Role
    function setAsker(address _newAsker) external onlyOwner {
        // Quitamos el role a la cuenta anterior.
        _revokeRole(INVARIANT_CONFIGURER, asker);
        // Seteamos el role a la nueva cuenta.
        _grantRole(INVARIANT_ASKER, _newAsker);
        // Guardamos la address del nuevo configurer.
        asker = _newAsker;
    }

    // Function to change the Feetoken
    function setFeetoken(address _newFeeToken) external onlyOwner {
        // Guardamos la address del nuevo configurer.
        feeToken = IERC20(_newFeeToken);
    }

    // Function to change the feeAmount
    function setFeeAmount(uint256 _newFeeAmount) external onlyOwner {
        // Guardamos la address del nuevo configurer.
        feeAmount = _newFeeAmount;
    }
}
