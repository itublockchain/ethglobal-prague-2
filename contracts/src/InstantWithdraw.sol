// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract InstantWithdraw is Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable token;
    
    uint256 public constant DAILY_MAX_WITHDRAWAL = 10_000 * 1e6; // 10,000 USDC (assuming 6 decimals)
    uint256 public constant WITHDRAWAL_COOLDOWN = 1 hours;
    
    uint256 public dailyWithdrawnTotal;
    uint256 public dailyResetTimestamp;
    mapping(address => uint256) public lastWithdrawalTime;
    
    event InstantWithdrawal(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event DailyLimitReset(uint256 timestamp);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
        dailyResetTimestamp = block.timestamp;
    }

    /// @notice Allows any user to withdraw from the InstantWithdraw pool
    /// @param amount Amount of tokens to withdraw
    function withdraw(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        
        // Reset daily limit if 24 hours have passed
        if (block.timestamp >= dailyResetTimestamp + 24 hours) {
            dailyWithdrawnTotal = 0;
            dailyResetTimestamp = block.timestamp;
            emit DailyLimitReset(block.timestamp);
        }
        
        require(
            dailyWithdrawnTotal + amount <= DAILY_MAX_WITHDRAWAL,
            "Contract daily withdrawal limit exceeded"
        );
        
        require(
            block.timestamp >= lastWithdrawalTime[msg.sender] + WITHDRAWAL_COOLDOWN,
            "Withdrawal too soon"
        );

        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient instant liquidity");

        lastWithdrawalTime[msg.sender] = block.timestamp;
        dailyWithdrawnTotal += amount;
        
        token.safeTransfer(msg.sender, amount);
        emit InstantWithdrawal(msg.sender, amount);
    }

    /// @notice View current liquidity available for instant withdrawals
    function getAvailableLiquidity() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    /// @notice Get remaining daily withdrawal limit for the contract
    function getRemainingDailyLimit() external view returns (uint256) {
        if (block.timestamp >= dailyResetTimestamp + 24 hours) {
            return DAILY_MAX_WITHDRAWAL;
        }
        return DAILY_MAX_WITHDRAWAL - dailyWithdrawnTotal;
    }
    
    /// @notice Emergency function to pause withdrawals
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause withdrawals
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency function to recover stuck tokens
    /// @param _token Address of token to recover
    /// @param amount Amount to recover
    function emergencyWithdraw(address _token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        IERC20 tokenToRecover = IERC20(_token);
        tokenToRecover.safeTransfer(owner(), amount);
        emit EmergencyWithdraw(_token, amount);
    }
}
