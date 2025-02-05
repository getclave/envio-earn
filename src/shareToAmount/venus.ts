export async function shareToAmountVenus(shares: bigint, exchangeRate: bigint) {
  return (shares * exchangeRate) / BigInt(10 ** 18);
}
