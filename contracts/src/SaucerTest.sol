// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int64);
}

interface ISaucerRouterV2 {
    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint256 deadline;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    /// @notice Swaps as little as possible of token A for an exact amount of token B
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn);
    
    /// @notice Refunds any leftover HBAR
    function refundETH() external payable;
    
    /// @notice Call multiple functions in a single transaction
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);

    function WHBAR() external pure returns (address);

    /// @notice Swaps exact HBAR for tokens
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

/// @title HbarToTokenSwapper
/// @notice A contract to swap HBAR for tokens using SaucerSwap V2 on Hedera
contract HbarToTokenSwapper {
    // SaucerSwap V2 Router (0.0.1414040)
    address public constant ROUTER = 0x0000000000000000000000000000000000159398;
    // Target Token (0.0.5365)
    address public constant TOKEN = 0x00000000000000000000000000000000000014F5;
    // Pool fee 0.3%
    uint24 public constant POOL_FEE = 3000;
    // Hedera Token Service Precompile
    address constant PRECOMPILE_ADDRESS = address(0x0000000000000000000000000000000000000167);
    
    // Constants for HBAR conversion
    uint256 public constant TINYBAR_TO_WEI = 10_000_000_000;  // 1 tinybar = 10^10 wei
    uint256 public constant HBAR_TO_TINYBAR = 100_000_000;    // 1 HBAR = 10^8 tinybar

    event SwapExecuted(
        address indexed user,
        uint256 hbarAmount,
        uint256 tokenReceived
    );

    event TokenAssociated(
        address indexed user,
        address indexed token
    );

    error SwapFailed();
    error DeadlinePassed();
    error ExcessiveInputAmount();
    error InsufficientValue();
    error TokenNotAssociated();
    error AssociationFailed();

    /// @notice Associates the target token with the caller's account
    function associateToken() external {
        int64 responseCode = IHederaTokenService(PRECOMPILE_ADDRESS)
            .associateToken(msg.sender, TOKEN);
            
        if (responseCode != 22) { // SUCCESS response code
            revert AssociationFailed();
        }

        emit TokenAssociated(msg.sender, TOKEN);
    }

    /// @notice Swaps HBAR for exact amount of tokens using V1 style path
    /// @param amountOut Exact amount of token to receive
    function swapExactHbarForTokens(uint256 amountOut) external payable {
        require(msg.value >= TINYBAR_TO_WEI, "Min 1 tinybar required");
        
        // Check if recipient has token balance/allowance (proxy for association)
        if (IERC20(TOKEN).balanceOf(msg.sender) == 0 && 
            IERC20(TOKEN).allowance(msg.sender, ROUTER) == 0) {
            revert TokenNotAssociated();
        }

        // Create simple path for V1 style swap
        address[] memory path = new address[](2);
        path[0] = ISaucerRouterV2(ROUTER).WHBAR();
        path[1] = TOKEN;

        // Execute swap with 20 minute deadline
        uint256 deadline = block.timestamp + 20 minutes;

        try ISaucerRouterV2(ROUTER).swapExactETHForTokens{value: msg.value}(
            amountOut,  // Minimum amount to receive
            path,
            msg.sender,
            deadline
        ) returns (uint[] memory amounts) {
            emit SwapExecuted(msg.sender, amounts[0], amounts[1]);
        } catch {
            revert SwapFailed();
        }
    }

    /// @notice Check if an address has the token associated
    /// @param account Address to check
    /// @return bool True if token is associated
    function isTokenAssociated(address account) external view returns (bool) {
        return IERC20(TOKEN).balanceOf(account) > 0 || 
               IERC20(TOKEN).allowance(account, ROUTER) > 0;
    }

    /// @notice Check token balance of an address
    /// @param account Address to check
    /// @return Token balance
    function getTokenBalance(address account) external view returns (uint256) {
        return IERC20(TOKEN).balanceOf(account);
    }

    /// @notice Allows the contract to receive HBAR
    receive() external payable {}
}

contract WhbarToTokenSwap {
    address public constant WHBAR_ADDRESS = 0x0000000000000000000000000000000000003AD2;
    address public constant OUTPUT_TOKEN_ADDRESS = 0x00000000000000000000000000000000000014F5;
    address public constant ROUTER_ADDRESS = 0x0000000000000000000000000000000000159398;
    uint24 public constant POOL_FEE = 3000; // 0.3%

    event SwapExecuted(
        address indexed user,
        uint256 amountInWhbar,
        uint256 amountOutToken
    );

    error SwapFailed();

    function swapWhbarForToken(
        uint256 _amountInWhbar,
        uint256 _amountOutMinOutputToken
    ) external payable { 

        bytes memory path = abi.encodePacked(
            WHBAR_ADDRESS,
            POOL_FEE,
            OUTPUT_TOKEN_ADDRESS
        );

        uint256 deadline = block.timestamp + 15 minutes;
        ISaucerRouterV2.ExactInputParams memory exactInputParams = ISaucerRouterV2.ExactInputParams({
            path: path,
            recipient: msg.sender, 
            deadline: deadline,
            amountIn: _amountInWhbar,
            amountOutMinimum: _amountOutMinOutputToken
        });

        bytes memory exactInputEncoded = abi.encodeWithSelector(
            ISaucerRouterV2.exactInput.selector,
            exactInputParams
        );

        bytes memory refundEthEncoded = abi.encodeWithSelector(
            ISaucerRouterV2.refundETH.selector
        );

        bytes[] memory multicallData = new bytes[](2);
        multicallData[0] = exactInputEncoded;
        multicallData[1] = refundEthEncoded;

        (bool success, bytes memory resultsData) = ROUTER_ADDRESS.call{value: msg.value}(
            abi.encodeWithSelector(ISaucerRouterV2.multicall.selector, multicallData)
        );

        if (!success) {
            revert SwapFailed();
        }

        bytes[] memory results = abi.decode(resultsData, (bytes[]));
        uint256 amountOutReceived = abi.decode(results[0], (uint256));

        emit SwapExecuted(msg.sender, _amountInWhbar, amountOutReceived);
    }

    receive() external payable {}
}
