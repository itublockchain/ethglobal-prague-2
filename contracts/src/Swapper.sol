// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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


contract Swapper {
        address public constant WHBAR_ADDRESS = 0x0000000000000000000000000000000000003aD2;
    address public constant USDC_ADDRESS = 0x0000000000000000000000000000000000120f46;
    address public constant ROUTER_ADDRESS = 0x0000000000000000000000000000000000159398;
    ISaucerRouterV2 router = ISaucerRouterV2(ROUTER_ADDRESS);
    uint24 public constant POOL_FEE = 3000; // 0.3%
    event SwapExecuted(
        address indexed user,
        uint256 amountInWhbar,
        uint256 amountOutToken
    );

    error SwapFailed();


    function swapUsdcForWhbar(
    uint256 _amountInUsdc,
    uint256 _amountOutMinWhbar
) external {
    // Transfer USDC from user to this contract
    IERC20 usdc = IERC20(USDC_ADDRESS);
    usdc.approve(ROUTER_ADDRESS, 100000000000);
    require(usdc.transferFrom(msg.sender, address(this), _amountInUsdc), "Transfer failed");

    // Approve router to spend USDC
    require(usdc.approve(ROUTER_ADDRESS, _amountInUsdc), "Approval failed");

    // Encode the path: USDC → WHBAR
    bytes memory path = abi.encodePacked(
        USDC_ADDRESS,
        POOL_FEE,
        WHBAR_ADDRESS
    );

    uint256 deadline = block.timestamp + 15 minutes;

    ISaucerRouterV2.ExactInputParams memory exactInputParams = ISaucerRouterV2.ExactInputParams({
        path: path,
        recipient: msg.sender, // or address(this) if handling wrapping/unwrapping
        deadline: deadline,
        amountIn: _amountInUsdc,
        amountOutMinimum: _amountOutMinWhbar
    });

    // Encode the router call
    bytes memory exactInputEncoded = abi.encodeWithSelector(
        ISaucerRouterV2.exactInput.selector,
        exactInputParams
    );

    bytes[] memory multicallData = new bytes[](1); // Array of size 1 for a single exactInput call
        multicallData[0] = exactInputEncoded;

        // Perform the multicall
        // We are not sending value with this specific .call to multicall because the swap input is USDC, not HBAR.
        (bool success, bytes memory resultsData) = ROUTER_ADDRESS.call(
            abi.encodeWithSelector(router.multicall.selector, multicallData)
        );

        if (!success) {
            revert SwapFailed();
        }

        // resultsData will contain an array of bytes results. We expect one result for exactInput.
        bytes[] memory results = abi.decode(resultsData, (bytes[]));
        uint256 amountOutReceived = abi.decode(results[0], (uint256));

    emit SwapExecuted(msg.sender, _amountInUsdc, amountOutReceived);
}
    function giveAproveToContracts() public {
        IERC20 usdc = IERC20(USDC_ADDRESS);
        usdc.approve(address(router), 1000000000);
        usdc.approve(address(this), 1000000000);
    }

    receive() external payable {}
}
