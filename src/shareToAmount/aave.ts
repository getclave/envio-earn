export async function shareToAmountAave(shares: bigint, currentIndex: bigint, userIndex: bigint) {
  const userIndexNormalized = userIndex == 0n ? currentIndex : userIndex;
  return (shares * currentIndex) / userIndexNormalized;
}
