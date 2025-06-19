// SPDX-License-Identifier: BUSL-1.1
// ZamnaSec Protocol v0.2.0

pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ZamnaInvariantsEnforcer} from "./ZamnaInvariantsEnforcer.sol";

/// @title The ZamnaSec Protocol Factory.
/// @author Mike Bello - SC Security Researcher/Auditor - SC Developer.
/// @notice This contract is used to deploy the invariants enforcer contracts created for users of the ZamnaSec Protocol.
contract ZamnaFactory is Ownable {
    //@note Dar la oportunidad al user de que elija en que token quiere pagar los fees de una canasta de tokens
    // previamente seleccionada starknet, USDC,USDT, Xoc, MxnB, Eth, etc.
    //ZamnaInvariantsEnforcer public invariantsContract;
    IERC20 public feeToken;
    uint256 public feeAmount; // 0.05 usd
    address public feeVault; // address of the vault tha save the fees.
    // Addresses of invariant contracts active.
    mapping(address invariantContract => bool activo) public isInvariantContractActive;
    // Addresses that can deploy an invariant contract.
    mapping(address InvariantsDeployer => bool isAllowed) public isAllowedDeployer;
    // Address that can change configuration of an invariant contract (deployer of the invariant contract)
    mapping(address InvariantContract => mapping(address deployer => bool isAllowed)) public isAllowedAdminConfigurer;
    // Invariants contracts a User has Deployed
    mapping(address deployer => address[] invariantContracts) public contractsDeployedByUser;
    // Number of contracts a user has deployed.
    mapping(address deployer => uint32 numContracts) public numContractsDeployedByUser;

    event InvariantsContractDeployed(address invariantContract, address deployer);
    event Invariants_Deployer_Allowed(address newDeployer, bool isAllowed);
    event Admin_Configurer_Allowed(address indexed invariantContract, address newAdminConfigurer, bool isAllowed);

    constructor(address _feeToken, uint256 _feeAmount, address _feeVault) Ownable(msg.sender) {
        feeToken = IERC20(_feeToken);
        feeAmount = _feeAmount;
        feeVault = _feeVault;
    }

    modifier onlyAllowedDeployer() {
        if (!isAllowedDeployer[msg.sender]) revert("Not Allowed Deployer");
        _;
    }

    modifier onlyAllowedAdminConfigurer(address _invariantContract) {
        if (!isAllowedAdminConfigurer[_invariantContract][msg.sender]) revert("Not Allowed Admin configurer");
        _;
    }

    /// Function to deploy an Invariants Contract.
    /// @param _configurer - Address of the wallet of ZamnaSec Platform, also the owner of this contract.
    function deployInvariantsContract(address _configurer)
        external
        onlyAllowedDeployer
        returns (address _invariantContract)
    {
        // Creamos el contrato
        ZamnaInvariantsEnforcer invariantsContract =
            new ZamnaInvariantsEnforcer(_configurer, feeVault, address(feeToken), feeAmount);
        _invariantContract = address(invariantsContract);
        // Registramos el contrato
        isInvariantContractActive[_invariantContract] = true;
        // Permitimos al deployer para cambiar los address de configurer y asker.
        isAllowedAdminConfigurer[_invariantContract][msg.sender] = true;
        // Register the contract and the user that deployed.
        contractsDeployedByUser[msg.sender].push(_invariantContract);
        // Increment the count of contracts deployed by user.
        numContractsDeployedByUser[msg.sender]++;
        // emitimos el evento.
        emit InvariantsContractDeployed(_invariantContract, msg.sender);
    }

    // Inherit transferOwnership to transfer Ownership of the contract

    // Function to allow the Deployer of the Invariant Contract to change the Configurer Address.
    function Change_Configurer_Role(address _newConfigurer, address _invariantContract)
        external
        onlyAllowedAdminConfigurer(_invariantContract)
    {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        ZamnaInvariantsEnforcer invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setConfigurer(_newConfigurer);
        // The event is emitted by the zamna enforcer contract.
    }

    // Function to allow/deny addresses to be a deployer of Invariant Contracts.This address can also set a new configurer address.
    // Esto se puede cambiar en el futuro para permitir que cualquiera pueda deployar sus invariants contracts en el protocolo.
    function allowInvariantsDeployer(address _deployer, bool _isAllowed) external onlyOwner {
        isAllowedDeployer[_deployer] = _isAllowed;
        emit Invariants_Deployer_Allowed(_deployer, _isAllowed);
    }

    // function to allow/deny an Admin configurer for an invariant contract.
    // to eliminate or change the allowed configurer/deployer if necessary.
    function allowAdminConfigurer(address _invariantContract, address _configurer, bool _isAllowed)
        external
        onlyOwner
    {
        isAllowedAdminConfigurer[_invariantContract][_configurer] = _isAllowed;
        emit Admin_Configurer_Allowed(_invariantContract, _configurer, _isAllowed);
    }

    // Function to set the Fee token in a Invariant Contract
    function setFeeToken(address _newFeeToken, address _invariantContract) external onlyOwner {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        ZamnaInvariantsEnforcer invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setFeetoken(_newFeeToken);
        // The event is emitted by the zamna enforcer contract.
    }

    // Function to set the new Fee Amount in a Invariant Contract
    function setFeeAmount(uint256 _newAmount, address _invariantContract) external onlyOwner {
        if (!isInvariantContractActive[_invariantContract]) revert("Invalid Invariant Contract");

        ZamnaInvariantsEnforcer invariantsContract = ZamnaInvariantsEnforcer(_invariantContract);
        invariantsContract.setFeeAmount(_newAmount);
        // The event is emitted by the zamna enforcer contract.
    }
}
