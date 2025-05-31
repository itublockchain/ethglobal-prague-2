// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Swapper.sol";


contract Vault is Ownable, ReentrancyGuard, Swapper {
    IERC20 public immutable usdcToken; // USDC token
    IERC20 public immutable whbarToken; // WHBAR token
    address public immutable instantWithdraw;

    mapping(address => uint256) public balances;

    uint256 public lastDrip;
    uint256 public constant DRIP_INTERVAL = 7 days;
    uint256 public constant DRIP_PERCENT = 5;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed routerAddress, uint256 amount);
    event Drip(uint256 amount, uint256 timestamp);

    constructor(address _instantWithdraw) Ownable(msg.sender) {
        require(_instantWithdraw != address(0), "Invalid instantWithdraw address");
        usdcToken = IERC20(USDC_ADDRESS);
        whbarToken = IERC20(WHBAR_ADDRESS);
        instantWithdraw = _instantWithdraw;
        lastDrip = block.timestamp;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function checkApproval(address _addr) external view returns (bool) {
        return IERC20(_addr).allowance(msg.sender, address(this)) > 0;
    }

    function withdraw(uint256 amount) external nonReentrant {
        //require(msg.sender == address(router), "Only router can withdraw");
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdraw(msg.sender, amount);
    }

    function dripToInstantWithdraw() external nonReentrant {
        require(block.timestamp >= lastDrip + DRIP_INTERVAL, "Drip too soon");

        uint256 vaultBalance = usdcToken.balanceOf(address(this));
        uint256 dripAmount = (vaultBalance * DRIP_PERCENT) / 100;

        lastDrip = block.timestamp;
        require(usdcToken.transfer(instantWithdraw, dripAmount), "Drip transfer failed");
        emit Drip(dripAmount, block.timestamp);
    }

    function getVaultBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
