// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ZamnaInvariantsEnforcer} from "./ZamnaInvariantsEnforcer.sol";

// Dar la oportunidad al user de que elija en que token quiere pagar los fees de una canasta de tokens
// previamente seleccionada starknet, USDC,USDT, Xoc, MxnB, Eth, etc.
contract ZamnaFactory is Ownable {
    ZamnaInvariantsEnforcer public invariantsContract;
    IERC20 public feeToken;
    uint256 public feeAmount;
    // Addresses of invariant contracts active.
    mapping(address invariantContract => bool activo) public isInvariantContractActive;
    // Addresses that can deploy an invariant contract.
    mapping(address InvariantsDeployer => bool isAllowed) public isAllowedDeployer;
    // Address that can change configuration of an invariant contract (deployer of the invariant contract)
    mapping(address InvariantContract => mapping(address deployer => bool isAllowed)) public isAllowedAdminConfigurer;

    event InvariantsContractDeployed(address invariantContract);

    constructor(address _feeToken, uint256 _feeAmount) Ownable(msg.sender) {
        feeToken = IERC20(_feeToken);
        feeAmount = _feeAmount;
    }

    modifier onlyAllowedDeployer() {
        if (!isAllowedDeployer[msg.sender]) revert("Not Allowed Deployer");
        _;
    }

    modifier onlyAllowedAdminConfiguer(address _invariantContract) {
        if (!isAllowedAdminConfigurer[_invariantContract][msg.sender]) revert("Not Allowed Admin configurer");
        _;
    }

    /// Function to deploy an Invariants Contract.
    /// @param _configurer - Address of the wallet of ZamnaSec Platform, also the owner of this contract.
    /// @param _asker - Address of the contract of the protocol, who is gonna ask to validate the invariants.
    function deployInvariantsContract(address _configurer, address _asker)
        external
        onlyAllowedDeployer
        returns (address _invariantContract)
    {
        // Creamos el contrato
        invariantsContract = new ZamnaInvariantsEnforcer(_configurer, _asker, address(feeToken), feeAmount);
        _invariantContract = address(invariantsContract);
        // Registramos el contrato
        isInvariantContractActive[_invariantContract] = true;
        // Permitimos al deployer para cambiar los address de configurer y asker.
        isAllowedAdminConfigurer[_invariantContract][msg.sender] = true;
        // emitimos el evento.
        emit InvariantsContractDeployed(_invariantContract);
    }

    // Inherit transferOwnership to transfer Ownership of the contract

    // Function to allow the Deployer of the Invariant Contract to change the Configurer Address.
    function Change_Configurer_Role(address _newConfigurer, address _invariantContract)
        external
        onlyAllowedAdminConfiguer(_invariantContract)
    {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setConfigurer(_newConfigurer);
    }

    // Function to allow the Deployer of the Invariant Contract to change the Asker Address.
    function Change_Asker_Role(address _newAsker, address _invariantContract)
        external
        onlyAllowedAdminConfiguer(_invariantContract)
    {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setAsker(_newAsker);
    }

    // Function to allow/deny addresses to be a deployer of Invariant Contracts.
    // this address can also set a new configurer or asker addresses.
    function allowInvariantsDeployer(address _deployer, bool _isAllowed) external onlyOwner {
        isAllowedDeployer[_deployer] = _isAllowed;
    }

    // function to allow/deny an Admin configurer for an invariant contract.
    // to eliminate or change the allowed configurer/deployer if necessary.
    function allowAdminConfigurer(address _invariantContract, address _configurer, bool _isAllowed)
        external
        onlyOwner
    {
        isAllowedAdminConfigurer[_invariantContract][_configurer] = _isAllowed;
    }

    // Function to set the Fee token in a Invariant Contract
    function setFeeToken(address _newFeeToken, address _invariantContract) external onlyOwner {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setFeetoken(_newFeeToken);
    }

    // Function to set the new Fee Amount in a Invariant Contract
    function setFeeAmount(uint256 _newAmount, address _invariantContract) external onlyOwner {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setFeeAmount(_newAmount);
    }
}
