// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IZamnaInvariantsEnforcer} from "../IZamnaInvariantsEnforcer.sol";

//@ agregar la implementacion de la interfaz zamnasec y el paso de tokens bitso (OK)

contract Vault_ProtocolX {
    // Crear funciones para hacer pruebas.
    IZamnaInvariantsEnforcer public zamnaEnforcer;
    IERC20 public token; // astar token
    IERC20 public feeToken; // MXN bitso token

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    uint256 public feeAmount;

    constructor(address _token, address _zamnaEnforcer, address _feeToken) {
        zamnaEnforcer = IZamnaInvariantsEnforcer(_zamnaEnforcer);
        token = IERC20(_token);
        feeToken = IERC20(_feeToken);
        // MxnB maneja 6 decimales.
        feeAmount = 1e6; // 1 MxnB

        feeToken.approve(_zamnaEnforcer, 10e6);
    }
    // Users deposit tokens and they get shares in the vault for it.

    function deposit(uint256 _amount) external {
        uint256 invariantID = 6;
        // si la address del primer depositor del vault != del deployer address, revierte la tx.
        // Rule: if address(x) diferente de address(y) revierte. Invariant Comparation: "=="
        //uint8 rule = 1;

        /*
        a = amount (tokens deposited: Astar token)
        B = balance of token before deposit (astar token)
        T = total supply (shares)
        s = shares to mint

        (T + s) / T = (a + B) / B 

        s = aT / B
        */
        uint256 shares;
        if (totalSupply == 0) {
            shares = _amount;
        } else {
            shares = (_amount * totalSupply) / token.balanceOf(address(this));
        }

        _mint(msg.sender, shares);
        // El protocolo debe tener el token con el que pagara a ZamnaSec.
        // token.transferFrom(msg.sender, address(this), _amount);

        feeToken.approve(address(zamnaEnforcer), feeAmount);

        // llamar a la function de Zamna que valida la invarian correspondiente.
        zamnaEnforcer.Enforce_Invariant_Address(invariantID, msg.sender);
    }

    // User can withdraw tokens in exchange for their shares.
    function withdraw(uint256 _shares) external {
        /*
        a = amount
        B = balance of token before withdraw
        T = total supply
        s = shares to burn

        (T - s) / T = (B - a) / B 

        a = sB / T
        */
        uint256 amount = (_shares * token.balanceOf(address(this))) / totalSupply;
        _burn(msg.sender, _shares);
        token.transfer(msg.sender, amount);
    }

    function _mint(address _to, uint256 _shares) private {
        totalSupply += _shares;
        balanceOf[_to] += _shares;
    }

    function _burn(address _from, uint256 _shares) private {
        totalSupply -= _shares;
        balanceOf[_from] -= _shares;
    }

    ///@dev function to simulate and attack
    ///@param _amount: amount to simulate manipulation.
    function mock_attack(address _attacker, uint256 _amount) external {
        balanceOf[_attacker] = _amount;
    }
}
