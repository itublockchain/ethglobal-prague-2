// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IQuoterV2 {
/// @notice Returns the amount out received for a given exact input swap without executing the swap
/// @param path The path of the swap, i.e. each token pair and the pool fee
/// @param amountIn The amount of the first token to swap
/// @return amountOut The amount of the last token that would be received
/// @return sqrtPriceX96AfterList List of the sqrt price after the swap for each pool in the path
/// @return initializedTicksCrossedList List of the initialized ticks that the swap crossed for each pool in the path
/// @return gasEstimate The estimate of the gas that the swap consumes
function quoteExactInput(bytes calldata path, uint256 amountIn)
  external
  returns (
    uint256 amountOut,
    uint160[] memory sqrtPriceX96AfterList,
    uint32[] memory initializedTicksCrossedList,
    uint256 gasEstimate
  );

    struct QuoteExactInputSingleParams {
        address tokenIn;       // Giriş token'ı
        address tokenOut;      // Çıkış token'ı
        uint256 amountIn;     // Giriş miktarı
        uint24 fee;           // Pool fee (örn: 3000 = %0.3)
        uint160 sqrtPriceLimitX96;  // Slippage kontrolü için limit
    }

    function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );

    // Try to call this to verify if address is a QuoterV2
    function factory() external view returns (address);
}

contract QuoterV2 {
  IQuoterV2 public immutable _baseQuoter;
  address public immutable QUOTER_ADDRESS;
  
  // Token addresses (Hedera token IDs as Ethereum addresses)
  address public constant TOKEN_2231533 = 0x0000000000000000000000000000000002211CdD; // 0.0.2231533
  address public constant TOKEN_5365 = 0x000000000000000000000000000000000014f500;   // 0.0.5365
  
  error InvalidQuoterAddress();
  error QuoterValidationFailed();
  
  constructor(address quoterAddress) {
    if (quoterAddress == address(0)) revert InvalidQuoterAddress();
    
    // Try to validate if this is really a QuoterV2
    try IQuoterV2(quoterAddress).factory() returns (address) {
      _baseQuoter = IQuoterV2(quoterAddress);
      QUOTER_ADDRESS = quoterAddress;
    } catch {
      revert QuoterValidationFailed();
    }
  }

  /// @notice Returns the address of the quoter being used
  function getQuoterAddress() external view returns (address) {
    return QUOTER_ADDRESS;
  }

  /// @notice Validates if we can still connect to the quoter
  /// @return factoryAddress The factory address from quoter (reverts if connection fails)
  function validateQuoter() external view returns (address factoryAddress) {
    return _baseQuoter.factory();
  }

  function buildPath() public pure returns (bytes memory) {
    bytes memory token0 = hex"000000000000000000000000000000000000000000";  // zero address
    bytes memory fee = hex"000bb8";  // 30 bps = 0.3%
    bytes memory token1 = hex"00000000000000000000000000000000014f5000";    // target token

    return bytes.concat(token1, fee, token0);
  }

  function quote(uint256 amountIn) external returns (
    uint256 amountOut,
    uint160[] memory sqrtPriceX96AfterList,
    uint32[] memory initializedTicksCrossedList,
    uint256 gasEstimate
  ) {
    bytes memory path = buildPath();
    return _baseQuoter.quoteExactInput(path, amountIn);
  }

  /// @notice Example: Get quote from TOKEN_2231533 to TOKEN_5365
  function quoteSingleExample(uint256 amountIn) external returns (
    uint256 amountOut,
    uint160 sqrtPriceX96After,
    uint32 initializedTicksCrossed,
    uint256 gasEstimate
  ) {
    return quoteSingle(
      TOKEN_2231533,  // tokenIn (0.0.2231533)
      TOKEN_5365,     // tokenOut (0.0.5365)
      amountIn,
      3000           // 0.3% fee
    );
  }

  function quoteSingle(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint24 fee
  ) public returns (
    uint256 amountOut,
    uint160 sqrtPriceX96After,
    uint32 initializedTicksCrossed,
    uint256 gasEstimate
  ) {
    return _baseQuoter.quoteExactInputSingle(
      IQuoterV2.QuoteExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0  // 0 means no limit
      })
    );
  }
}