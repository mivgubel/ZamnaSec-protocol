// SPDX-License-Identifier: BUSL-1.1
// ZamnaSec Protocol v0.2.0

/// @title The ZamnaSec Invariants Enforcer Interface.
/// @author Mike Bello - SC Security Researcher/Auditor - SC Developer.
/// @notice This interface has to be implemented in the user protocol contracts, all invariants are configured, updated
/// enable/disable from the frontend app.
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// El user tiene que implementar esta interfaz con la address del contrato de invariants que deployo desde el front.
// poner el asker en la invariant y llamar al invariant contract usando esta interfaz y la address desde las funciones de su contrato.
interface IZamnaInvariantsEnforcer {
    // functions
    function configurer() external returns (address);
    function feeToken() external returns (IERC20);
    function feeAmount() external returns (uint256);
    function countInvariantID() external returns (uint256);
    function isInvariantActive(uint256 InvariantID) external returns (bool);
    function Create_Invariant(string calldata _name, address _asker, uint8 _type, uint8 _rule, bytes32 _InvariantValue)
        external;
    function Update_Invariant(
        uint256 _invariantID,
        string calldata _name,
        address _asker,
        uint8 _type,
        uint8 _rule,
        bytes32 _InvariantValue
    ) external;
    function Enforce_Invariant_Uint(uint256 _invariantID, uint256 _contractValue) external;
    function Enforce_Invariant_Int(uint256 _invariantID, int256 _contractValue) external;
    function Enforce_Invariant_Address(uint256 _invariantID, address _contractValue) external;
    function Enforce_Invariant_Bytes32(uint256 _invariantID, bytes32 _contractValue) external;
    function Enforce_Invariant_Bool(uint256 _invariantID, bool _contractValue) external;
    function Disable_Invariant(uint256 _invariantID) external;
    function getInvariant(uint256 _invariantID)
        external
        view
        returns (string memory _name, address _asker, uint8 _invariantType, uint8 _rule, bytes32 _value);
    function setConfigurer(address _newConfigurer) external;
    function setFeetoken(address _newFeeToken) external;
    function setFeeAmount(uint256 _newFeeAmount) external;
}
