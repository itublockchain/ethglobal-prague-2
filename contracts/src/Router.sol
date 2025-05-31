// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IVault {
    function withdraw(address user, uint256 amount) external;
}

contract Router is Ownable {
    IERC20 public immutable token;         // USDC
    IVault public vault;

    event UsedFunds(address indexed user, uint256 amount, string purpose);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");

        token = IERC20(_token);
    }

    function setVault(address _vaultAddress) external onlyOwner {
        require(address(vault) == address(0), "Vault already set");
        require(_vaultAddress != address(0), "Invalid vault address");
        vault = IVault(_vaultAddress);
    }

    /// @notice Uses funds on behalf of user from the Vault
    /// @param user The user whose funds are being used
    /// @param amount The amount to withdraw and use
    /// @param purpose Description or tag for the usage (e.g. "long trade on ETH")
    function useFunds(address user, uint256 amount, string calldata purpose) external onlyOwner {
        require(address(vault) != address(0), "Router: Vault not set");
        require(amount > 0, "Amount must be > 0");

        // Pull funds from vault
        vault.withdraw(user, amount);

        // Router now holds `amount` of USDC
        // Here you'd implement logic to forward or swap those funds

        emit UsedFunds(user, amount, purpose);
    }

    /// @notice Emergency drain in case funds are stuck
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    /// @notice View current token balance in router
    function getRouterBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
