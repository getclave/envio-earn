//!!! DEPRECATED !!!

function calculateLPTokenPrice(
  reserve0: bigint,
  totalSupply: bigint,
  poolType: bigint,
  token0PrecisionMultiplier: bigint = 1n
) {
  if (totalSupply === 0n) return 0n;

  // Convert to BigInt
  reserve0 = BigInt(reserve0);
  totalSupply = BigInt(totalSupply);

  if (poolType === 1n) {
    // Classic Pool
    // Each LP token represents a proportional share of the reserves
    return (reserve0 * BigInt(1e18)) / totalSupply;
  } else if (poolType === 2n) {
    // Stable Pool
    // Adjust reserves using precision multipliers
    const adjustedReserve0 = reserve0 * token0PrecisionMultiplier;
    return (adjustedReserve0 * BigInt(1e18)) / (totalSupply * token0PrecisionMultiplier);
  }

  throw new Error("Invalid pool type");
}
