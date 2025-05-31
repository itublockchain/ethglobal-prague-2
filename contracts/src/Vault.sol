// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Vault is Ownable, ReentrancyGuard {
    IERC20 public immutable token; // USDC token
    address public immutable router;
    address public immutable instantWithdraw;

    mapping(address => uint256) public balances;

    uint256 public lastDrip;
    uint256 public constant DRIP_INTERVAL = 7 days;
    uint256 public constant DRIP_PERCENT = 5;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Drip(uint256 amount, uint256 timestamp);

    constructor(address _token, address _router, address _instantWithdraw) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        require(_router != address(0), "Invalid router address");
        require(_instantWithdraw != address(0), "Invalid instantWithdraw address");

        token = IERC20(_token);
        router = _router;
        instantWithdraw = _instantWithdraw;
        lastDrip = block.timestamp;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(address user, uint256 amount) external nonReentrant {
        require(msg.sender == router, "Only router can withdraw");
        require(balances[user] >= amount, "Insufficient balance");

        balances[user] -= amount;
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit Withdraw(user, amount);
    }

    function dripToInstantWithdraw() external nonReentrant {
        require(block.timestamp >= lastDrip + DRIP_INTERVAL, "Drip too soon");

        uint256 vaultBalance = token.balanceOf(address(this));
        uint256 dripAmount = (vaultBalance * DRIP_PERCENT) / 100;

        lastDrip = block.timestamp;
        require(token.transfer(instantWithdraw, dripAmount), "Drip transfer failed");
        emit Drip(dripAmount, block.timestamp);
    }

    function getVaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
