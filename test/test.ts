import assert from "assert";
import { TestHelpers } from "generated";
import { VenusPoolAddresses } from "../src/constants/VenusPools";
import { ClaggMainAddress } from "../src/constants/ClaggAddresses";
import { AavePoolAddresses } from "../src/constants/AavePools";
import { roundTimestamp } from "../src/utils/helpers";

const { MockDb, Addresses, Venus, SyncswapFactory, SyncswapPool, ClaggMain, Aave } = TestHelpers;

process.env.NODE_ENV = "test";

// Mock the client multicall for test mode
process.env.MOCK_MULTICALL = "true";

describe("Protocol Handlers", () => {
  // Common test setup and variables
  const token0 = "0x367700c33ea7d4523403ca8ca790918ccb76dAb4";
  const token1 = "0x65006841486feb84570d909703ad646ddeaf0f5B";
  const userAddress1 = Addresses.mockAddresses[0];
  const userAddress2 = Addresses.mockAddresses[1];
  const baseTimestamp = 86400; // One day in seconds
  let mockDb: ReturnType<typeof MockDb.createMockDb>;

  // Fix syncswapPoolAddress reference
  const syncswapPoolAddress = "0x0259d9dfb638775858b1d072222237e2ce7111C0";

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  describe("Syncswap", () => {
    const poolAddress = syncswapPoolAddress;

    beforeEach(async () => {
      // Initialize Syncswap pool with non-zero values
      mockDb.entities.SyncswapPool.set({
        id: poolAddress.toLowerCase(),
        address: poolAddress,
        reserve0: 1000n,
        reserve1: 2000n,
        totalSupply: 1000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      const dailyTimestamp = Math.floor(baseTimestamp / 86400) * 86400;
      const weeklyTimestamp = Math.floor(baseTimestamp / (86400 * 7)) * (86400 * 7);
      const monthlyTimestamp = Math.floor(baseTimestamp / (86400 * 30)) * (86400 * 30);
      const fourHourTimestamp = Math.floor(baseTimestamp / (3600 * 4)) * (3600 * 4);

      // Initialize historical records with these timestamps
      mockDb.entities.HistoricalSyncswapPoolDaily.set({
        id: poolAddress.toLowerCase() + dailyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(dailyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.HistoricalSyncswapPoolWeekly.set({
        id: poolAddress.toLowerCase() + weeklyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(weeklyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.HistoricalSyncswapPoolMonthly.set({
        id: poolAddress.toLowerCase() + monthlyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(monthlyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      // Initialize historical balance records
      mockDb.entities.HistoricalSyncswapEarnBalance4Hours.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + fourHourTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(fourHourTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance1Day.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + dailyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(dailyTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance7Days.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + weeklyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(weeklyTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance1Month.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + monthlyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(monthlyTimestamp),
      });

      // Initialize sender balance
      mockDb.entities.SyncswapEarnBalance.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
      });
    });

    it("should handle user transfers and balances", async () => {
      const baseTimestamp = 86400; // One day in seconds
      const dailyTimestamp = Math.floor(baseTimestamp / 86400) * 86400;
      const weeklyTimestamp = Math.floor(baseTimestamp / (86400 * 7)) * (86400 * 7);
      const monthlyTimestamp = Math.floor(baseTimestamp / (86400 * 30)) * (86400 * 30);
      const fourHourTimestamp = Math.floor(baseTimestamp / (3600 * 4)) * (3600 * 4);

      // Initialize historical records with these timestamps
      mockDb.entities.HistoricalSyncswapPoolDaily.set({
        id: poolAddress.toLowerCase() + dailyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(dailyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.HistoricalSyncswapPoolWeekly.set({
        id: poolAddress.toLowerCase() + weeklyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(weeklyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.HistoricalSyncswapPoolMonthly.set({
        id: poolAddress.toLowerCase() + monthlyTimestamp.toString(),
        address: poolAddress.toLowerCase(),
        totalSupply: 1000n,
        timestamp: BigInt(monthlyTimestamp),
        reserve0: 1000n,
        reserve1: 2000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      // Initialize historical balance records
      mockDb.entities.HistoricalSyncswapEarnBalance4Hours.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + fourHourTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(fourHourTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance1Day.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + dailyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(dailyTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance7Days.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + weeklyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(weeklyTimestamp),
      });

      mockDb.entities.HistoricalSyncswapEarnBalance1Month.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase() + monthlyTimestamp.toString(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
        timestamp: BigInt(monthlyTimestamp),
      });

      // Initialize sender balance
      mockDb.entities.SyncswapEarnBalance.set({
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
        shareBalance: 100n,
      });

      const mockTransfer = SyncswapPool.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await SyncswapPool.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check user balances
      const senderBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(senderBalance?.shareBalance, -100n, "Sender balance should be reduced");

      const receiverBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress2.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(receiverBalance?.shareBalance, 100n, "Receiver balance should be increased");

      // Check historical records
      const historicalBalance4h =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance4Hours.get(
          userAddress1.toLowerCase() +
            poolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp).toString()
        );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      const historicalBalance1d =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance1Day.get(
          userAddress1.toLowerCase() +
            poolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400).toString()
        );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      const historicalBalance7d =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance7Days.get(
          userAddress1.toLowerCase() +
            poolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400 * 7).toString()
        );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      const historicalBalance1m =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance1Month.get(
          userAddress1.toLowerCase() +
            poolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400 * 30).toString()
        );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should handle Clagg integration", async () => {
      // Test transfer to Clagg
      const mockTransferToClagg = SyncswapPool.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1500,
          },
        },
        from: userAddress1,
        to: ClaggMainAddress,
        value: 100n,
      });

      const mockDbAfterToClagg = await SyncswapPool.Transfer.processEvent({
        event: mockTransferToClagg,
        mockDb,
      });

      const claggPoolAfterDeposit = mockDbAfterToClagg.entities.ClaggPool.get(
        poolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterDeposit?.totalSupply,
        100n,
        "Clagg pool supply should increase after deposit"
      );

      // Test transfer from Clagg
      const mockTransferFromClagg = SyncswapPool.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1600,
          },
        },
        from: ClaggMainAddress,
        to: userAddress1,
        value: 50n,
      });

      const mockDbAfterFromClagg = await SyncswapPool.Transfer.processEvent({
        event: mockTransferFromClagg,
        mockDb: mockDbAfterToClagg,
      });

      const claggPoolAfterWithdraw = mockDbAfterFromClagg.entities.ClaggPool.get(
        poolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterWithdraw?.totalSupply,
        50n,
        "Clagg pool supply should decrease after withdrawal"
      );
    });
  });

  describe("Venus", () => {
    const venusPoolAddress = VenusPoolAddresses[0];

    beforeEach(async () => {
      // Initialize Venus pool
      mockDb.entities.VenusPool.set({
        id: venusPoolAddress.toLowerCase(),
        address: venusPoolAddress,
        name: "Venus Pool",
        symbol: "vTOKEN",
        underlyingToken: token0,
        exchangeRate: 1000000n,
      });
    });

    it("should handle user balances and historical records", async () => {
      const baseTimestamp = 86400; // One day in seconds

      // Initialize sender balance before transfer
      mockDb.entities.VenusEarnBalance.set({
        id: userAddress1.toLowerCase() + venusPoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        venusPool_id: venusPoolAddress.toLowerCase(),
        shareBalance: 100n,
      });

      const mockTransfer = Venus.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await Venus.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check user balances
      const senderBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase()
      );
      assert.equal(senderBalance?.shareBalance, -100n, "Sender balance should be reduced");

      const receiverBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress2.toLowerCase() + venusPoolAddress.toLowerCase()
      );
      assert.equal(receiverBalance?.shareBalance, 100n, "Receiver balance should be increased");

      // Check historical pool records
      const dailyTimestamp = Math.floor(baseTimestamp / 86400) * 86400;
      const historicalVenusDaily = mockDbAfterTransfer.entities.HistoricalVenusPoolDaily.get(
        venusPoolAddress.toLowerCase() + dailyTimestamp.toString()
      );
      assert.equal(
        historicalVenusDaily?.exchangeRate,
        1000000n,
        "Historical daily exchange rate should be recorded"
      );

      const weeklyTimestamp = Math.floor(baseTimestamp / (86400 * 7)) * (86400 * 7);
      const historicalVenusWeekly = mockDbAfterTransfer.entities.HistoricalVenusPoolWeekly.get(
        venusPoolAddress.toLowerCase() + weeklyTimestamp.toString()
      );
      assert.equal(
        historicalVenusWeekly?.exchangeRate,
        1000000n,
        "Historical weekly exchange rate should be recorded"
      );

      const monthlyTimestamp = Math.floor(baseTimestamp / (86400 * 30)) * (86400 * 30);
      const historicalVenusMonthly = mockDbAfterTransfer.entities.HistoricalVenusPoolMonthly.get(
        venusPoolAddress.toLowerCase() + monthlyTimestamp.toString()
      );
      assert.equal(
        historicalVenusMonthly?.exchangeRate,
        1000000n,
        "Historical monthly exchange rate should be recorded"
      );

      // Check historical balance records
      const fourHourTimestamp = Math.floor(baseTimestamp / (3600 * 4)) * (3600 * 4);
      const historicalBalance4h = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance4Hours.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase() + fourHourTimestamp.toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      const historicalBalance1d = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance1Day.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase() + dailyTimestamp.toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      const historicalBalance7d = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance7Days.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase() + weeklyTimestamp.toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      const historicalBalance1m = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance1Month.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase() + monthlyTimestamp.toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should handle Clagg integration", async () => {
      // Test transfer to Clagg
      const mockTransferToClagg = Venus.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
        },
        from: userAddress1,
        to: ClaggMainAddress,
        value: 100n,
      });

      const mockDbAfterToClagg = await Venus.Transfer.processEvent({
        event: mockTransferToClagg,
        mockDb,
      });

      const claggPoolAfterDeposit = mockDbAfterToClagg.entities.ClaggPool.get(
        venusPoolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterDeposit?.totalSupply,
        100n,
        "Clagg pool supply should increase after deposit"
      );

      // Test transfer from Clagg
      const mockTransferFromClagg = Venus.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
        },
        from: ClaggMainAddress,
        to: userAddress1,
        value: 50n,
      });

      const mockDbAfterFromClagg = await Venus.Transfer.processEvent({
        event: mockTransferFromClagg,
        mockDb: mockDbAfterToClagg,
      });

      const claggPoolAfterWithdraw = mockDbAfterFromClagg.entities.ClaggPool.get(
        venusPoolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterWithdraw?.totalSupply,
        50n,
        "Clagg pool supply should decrease after withdrawal"
      );
    });
  });

  describe("Aave", () => {
    const aavePoolAddress = AavePoolAddresses[0];

    beforeEach(async () => {
      // Initialize Aave pool
      mockDb.entities.AavePool.set({
        id: aavePoolAddress.toLowerCase(),
        address: aavePoolAddress,
        name: "Aave Pool",
        symbol: "aToken",
        underlyingToken: token0,
        lastIndex: 0n,
      });
    });

    it("should handle minting and user balances", async () => {
      const mockMint = Aave.Mint.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
        },
        caller: userAddress1,
        onBehalfOf: userAddress1,
        value: 100n,
        balanceIncrease: 100n,
        index: 1000000n,
      });

      const mockDbAfterMint = await Aave.Mint.processEvent({
        event: mockMint,
        mockDb,
      });

      const pool = mockDbAfterMint.entities.AavePool.get(aavePoolAddress.toLowerCase());
      assert.equal(pool?.lastIndex, 1000000n, "Last index should be updated");

      const userBalance = mockDbAfterMint.entities.AaveEarnBalance.get(
        userAddress1.toLowerCase() + aavePoolAddress.toLowerCase()
      );
      assert.equal(userBalance?.userIndex, 1000000n, "User index should be set");
    });

    it("should handle burning", async () => {
      // First mint some tokens
      const mockMint = Aave.Mint.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
        },
        caller: userAddress1,
        onBehalfOf: userAddress1,
        value: 100n,
        balanceIncrease: 100n,
        index: 1000000n,
      });

      const mockDbAfterMint = await Aave.Mint.processEvent({
        event: mockMint,
        mockDb,
      });

      // Then burn some tokens
      const mockBurn = Aave.Burn.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
        },
        from: userAddress1,
        target: userAddress2,
        value: 50n,
        balanceIncrease: 0n,
        index: 1100000n,
      });

      const mockDbAfterBurn = await Aave.Burn.processEvent({
        event: mockBurn,
        mockDb: mockDbAfterMint,
      });

      const pool = mockDbAfterBurn.entities.AavePool.get(aavePoolAddress.toLowerCase());
      assert.equal(pool?.lastIndex, 1100000n, "Last index should be updated after burn");

      const userBalance = mockDbAfterBurn.entities.AaveEarnBalance.get(
        userAddress1.toLowerCase() + aavePoolAddress.toLowerCase()
      );
      assert.equal(userBalance?.userIndex, 1100000n, "User index should be updated after burn");
    });

    it("should handle Clagg integration", async () => {
      // Test transfer to Clagg
      const mockTransferToClagg = Aave.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
        },
        from: userAddress1,
        to: ClaggMainAddress,
        value: 100n,
      });

      const mockDbAfterToClagg = await Aave.Transfer.processEvent({
        event: mockTransferToClagg,
        mockDb,
      });

      const claggPoolAfterDeposit = mockDbAfterToClagg.entities.ClaggPool.get(
        aavePoolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterDeposit?.totalSupply,
        100n,
        "Clagg pool supply should increase after deposit"
      );

      // Test transfer from Clagg
      const mockTransferFromClagg = Aave.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
        },
        from: ClaggMainAddress,
        to: userAddress1,
        value: 50n,
      });

      const mockDbAfterFromClagg = await Aave.Transfer.processEvent({
        event: mockTransferFromClagg,
        mockDb: mockDbAfterToClagg,
      });

      const claggPoolAfterWithdraw = mockDbAfterFromClagg.entities.ClaggPool.get(
        aavePoolAddress.toLowerCase()
      );
      assert.equal(
        claggPoolAfterWithdraw?.totalSupply,
        50n,
        "Clagg pool supply should decrease after withdrawal"
      );
    });

    it("should create historical entities for Aave events", async () => {
      // Initialize user balance before transfer
      mockDb.entities.AaveEarnBalance.set({
        id: userAddress1.toLowerCase() + aavePoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        aavePool_id: aavePoolAddress.toLowerCase(),
        shareBalance: 100n,
        userIndex: 2000000n,
      });

      // Test Transfer event for historical tracking
      const mockTransfer = Aave.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await Aave.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check historical balances
      // Check 4-hour historical balance
      const historicalBalance4h = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance4Hours.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp).toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      // Check daily historical balance
      const historicalBalance1d = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance1Day.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400).toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      // Check weekly historical balance
      const historicalBalance7d = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance7Days.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 7).toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      // Check monthly historical balance
      const historicalBalance1m = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance1Month.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 30).toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should create historical entities for Clagg events", async () => {
      // Initialize user balance before deposit
      mockDb.entities.ClaggEarnBalance.set({
        id: userAddress1.toLowerCase() + syncswapPoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        claggPool_id: syncswapPoolAddress.toLowerCase(),
        shareBalance: 0n,
        totalDeposits: 0n,
        totalWithdrawals: 0n,
      });

      // Test Deposit event for historical tracking
      const mockDeposit = ClaggMain.Deposit.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        user: userAddress1,
        pool: syncswapPoolAddress,
        amount: 100n,
        shares: 100n,
      });

      const mockDbAfterDeposit = await ClaggMain.Deposit.processEvent({
        event: mockDeposit,
        mockDb,
      });

      // Check historical balances after deposit
      // Check 4-hour historical balance
      const historicalBalance4h = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance4Hours.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp).toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 before deposit"
      );

      // Check daily historical balance
      const historicalBalance1d = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance1Day.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400).toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 before deposit"
      );

      // Check weekly historical balance
      const historicalBalance7d = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance7Days.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 7).toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 before deposit"
      );

      // Check monthly historical balance
      const historicalBalance1m = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance1Month.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 30).toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 before deposit"
      );

      // Test Withdraw event
      const mockWithdraw = ClaggMain.Withdraw.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
          block: {
            timestamp: baseTimestamp + 1000,
          },
        },
        user: userAddress1,
        pool: syncswapPoolAddress,
        amount: 50n,
        shares: 50n,
      });

      const mockDbAfterWithdraw = await ClaggMain.Withdraw.processEvent({
        event: mockWithdraw,
        mockDb: mockDbAfterDeposit,
      });

      // Check historical balances after withdrawal
      const historicalBalance4hAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance4Hours.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000).toString()
        );
      assert.equal(
        historicalBalance4hAfterWithdraw?.shareBalance,
        100n,
        "Historical 4-hour balance should be 100 before withdrawal"
      );

      const historicalBalance1dAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance1Day.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400).toString()
        );
      assert.equal(
        historicalBalance1dAfterWithdraw?.shareBalance,
        100n,
        "Historical daily balance should be 100 before withdrawal"
      );

      const historicalBalance7dAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance7Days.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400 * 7).toString()
        );
      assert.equal(
        historicalBalance7dAfterWithdraw?.shareBalance,
        100n,
        "Historical weekly balance should be 100 before withdrawal"
      );

      const historicalBalance1mAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance1Month.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400 * 30).toString()
        );
      assert.equal(
        historicalBalance1mAfterWithdraw?.shareBalance,
        100n,
        "Historical monthly balance should be 100 before withdrawal"
      );
    });
  });

  describe("Clagg", () => {
    const poolAddress = "0x0259d9dfb638775858b1d072222237e2ce7111C0";

    beforeEach(async () => {
      // Initialize Clagg pool and underlying pool (Syncswap in this case)
      mockDb.entities.SyncswapPool.set({
        id: poolAddress.toLowerCase(),
        address: poolAddress,
        reserve0: 0n,
        reserve1: 0n,
        totalSupply: 0n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.ClaggPool.set({
        id: poolAddress.toLowerCase(),
        address: poolAddress,
        totalShares: 0n,
        totalSupply: 0n,
      });
    });

    it("should handle deposits and withdrawals", async () => {
      // Test deposit
      const mockDeposit = ClaggMain.Deposit.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
        },
        user: userAddress1,
        pool: poolAddress,
        amount: 100n,
        shares: 100n,
      });

      const mockDbAfterDeposit = await ClaggMain.Deposit.processEvent({
        event: mockDeposit,
        mockDb,
      });

      const poolAfterDeposit = mockDbAfterDeposit.entities.ClaggPool.get(poolAddress.toLowerCase());
      assert.equal(
        poolAfterDeposit?.totalShares,
        100n,
        "Total shares should increase after deposit"
      );

      const userBalanceAfterDeposit = mockDbAfterDeposit.entities.ClaggEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(
        userBalanceAfterDeposit?.shareBalance,
        100n,
        "User share balance should increase after deposit"
      );
      assert.equal(
        userBalanceAfterDeposit?.totalDeposits,
        100n,
        "Total deposits should be tracked"
      );

      // Test withdrawal
      const mockWithdraw = ClaggMain.Withdraw.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
        },
        user: userAddress1,
        pool: poolAddress,
        amount: 50n,
        shares: 50n,
      });

      const mockDbAfterWithdraw = await ClaggMain.Withdraw.processEvent({
        event: mockWithdraw,
        mockDb: mockDbAfterDeposit,
      });

      const poolAfterWithdraw = mockDbAfterWithdraw.entities.ClaggPool.get(
        poolAddress.toLowerCase()
      );
      assert.equal(
        poolAfterWithdraw?.totalShares,
        50n,
        "Total shares should decrease after withdrawal"
      );

      const userBalanceAfterWithdraw = mockDbAfterWithdraw.entities.ClaggEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(
        userBalanceAfterWithdraw?.shareBalance,
        50n,
        "User share balance should decrease after withdrawal"
      );
      assert.equal(
        userBalanceAfterWithdraw?.totalWithdrawals,
        50n,
        "Total withdrawals should be tracked"
      );
    });
  });

  describe("Historical Entities", () => {
    const syncswapPoolAddress = "0x0259d9dfb638775858b1d072222237e2ce7111C0";
    const venusPoolAddress = VenusPoolAddresses[0];
    const aavePoolAddress = AavePoolAddresses[0];
    const dailyTimestamp = Math.floor(baseTimestamp / 86400) * 86400;
    const weeklyTimestamp = Math.floor(baseTimestamp / (86400 * 7)) * (86400 * 7);
    const monthlyTimestamp = Math.floor(baseTimestamp / (86400 * 30)) * (86400 * 30);
    const fourHourTimestamp = Math.floor(baseTimestamp / (3600 * 4)) * (3600 * 4);

    beforeEach(async () => {
      // Initialize pools with consistent initial values
      mockDb.entities.SyncswapPool.set({
        id: syncswapPoolAddress.toLowerCase(),
        address: syncswapPoolAddress,
        reserve0: 1000n,
        reserve1: 2000n,
        totalSupply: 1000n,
        name: "Syncswap Pool",
        symbol: "SYNC-LP",
        underlyingToken: token0,
        underlyingToken2: token1,
        poolType: 1n,
        token0PrecisionMultiplier: 1n,
        token1PrecisionMultiplier: 1n,
      });

      mockDb.entities.VenusPool.set({
        id: venusPoolAddress.toLowerCase(),
        address: venusPoolAddress,
        name: "Venus Pool",
        symbol: "vTOKEN",
        underlyingToken: token0,
        exchangeRate: 1000000n,
      });

      mockDb.entities.AavePool.set({
        id: aavePoolAddress.toLowerCase(),
        address: aavePoolAddress,
        name: "Aave Pool",
        symbol: "aToken",
        underlyingToken: token0,
        lastIndex: 2000000n,
      });
    });

    it("should create historical entities for Syncswap events", async () => {
      // Initialize sender balance
      mockDb.entities.SyncswapEarnBalance.set({
        id: userAddress1.toLowerCase() + syncswapPoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: syncswapPoolAddress.toLowerCase(),
        shareBalance: 100n,
      });

      const mockTransfer = SyncswapPool.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: syncswapPoolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await SyncswapPool.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check historical balance records
      const historicalBalance4h =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance4Hours.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp).toString()
        );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      const historicalBalance1d =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance1Day.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400).toString()
        );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      const historicalBalance7d =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance7Days.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400 * 7).toString()
        );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      const historicalBalance1m =
        mockDbAfterTransfer.entities.HistoricalSyncswapEarnBalance1Month.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp, 86400 * 30).toString()
        );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should create historical entities for Venus events", async () => {
      const baseTimestamp = 86400; // One day in seconds

      // Initialize user balance before transfer
      mockDb.entities.VenusEarnBalance.set({
        id: userAddress1.toLowerCase() + venusPoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        venusPool_id: venusPoolAddress.toLowerCase(),
        shareBalance: 100n,
      });

      // Test Transfer event for historical tracking
      const mockTransfer = Venus.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await Venus.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check historical balances
      // Check 4-hour historical balance
      const historicalBalance4h = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance4Hours.get(
        userAddress1.toLowerCase() +
          venusPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp).toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      // Check daily historical balance
      const historicalBalance1d = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance1Day.get(
        userAddress1.toLowerCase() +
          venusPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400).toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      // Check weekly historical balance
      const historicalBalance7d = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance7Days.get(
        userAddress1.toLowerCase() +
          venusPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 7).toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      // Check monthly historical balance
      const historicalBalance1m = mockDbAfterTransfer.entities.HistoricalVenusEarnBalance1Month.get(
        userAddress1.toLowerCase() +
          venusPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 30).toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should create historical entities for Aave events", async () => {
      // Initialize user balance before transfer
      mockDb.entities.AaveEarnBalance.set({
        id: userAddress1.toLowerCase() + aavePoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        aavePool_id: aavePoolAddress.toLowerCase(),
        shareBalance: 100n,
        userIndex: 2000000n,
      });

      // Test Transfer event for historical tracking
      const mockTransfer = Aave.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await Aave.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check historical balances
      // Check 4-hour historical balance
      const historicalBalance4h = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance4Hours.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp).toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 after transfer"
      );

      // Check daily historical balance
      const historicalBalance1d = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance1Day.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400).toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 after transfer"
      );

      // Check weekly historical balance
      const historicalBalance7d = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance7Days.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 7).toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 after transfer"
      );

      // Check monthly historical balance
      const historicalBalance1m = mockDbAfterTransfer.entities.HistoricalAaveEarnBalance1Month.get(
        userAddress1.toLowerCase() +
          aavePoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 30).toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 after transfer"
      );
    });

    it("should create historical entities for Clagg events", async () => {
      // Initialize user balance before deposit
      mockDb.entities.ClaggEarnBalance.set({
        id: userAddress1.toLowerCase() + syncswapPoolAddress.toLowerCase(),
        userAddress: userAddress1.toLowerCase(),
        claggPool_id: syncswapPoolAddress.toLowerCase(),
        shareBalance: 0n,
        totalDeposits: 0n,
        totalWithdrawals: 0n,
      });

      // Test Deposit event for historical tracking
      const mockDeposit = ClaggMain.Deposit.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
          block: {
            timestamp: baseTimestamp,
          },
        },
        user: userAddress1,
        pool: syncswapPoolAddress,
        amount: 100n,
        shares: 100n,
      });

      const mockDbAfterDeposit = await ClaggMain.Deposit.processEvent({
        event: mockDeposit,
        mockDb,
      });

      // Check historical balances after deposit
      // Check 4-hour historical balance
      const historicalBalance4h = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance4Hours.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp).toString()
      );
      assert.equal(
        historicalBalance4h?.shareBalance,
        0n,
        "Historical 4-hour balance should be 0 before deposit"
      );

      // Check daily historical balance
      const historicalBalance1d = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance1Day.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400).toString()
      );
      assert.equal(
        historicalBalance1d?.shareBalance,
        0n,
        "Historical daily balance should be 0 before deposit"
      );

      // Check weekly historical balance
      const historicalBalance7d = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance7Days.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 7).toString()
      );
      assert.equal(
        historicalBalance7d?.shareBalance,
        0n,
        "Historical weekly balance should be 0 before deposit"
      );

      // Check monthly historical balance
      const historicalBalance1m = mockDbAfterDeposit.entities.HistoricalClaggEarnBalance1Month.get(
        userAddress1.toLowerCase() +
          syncswapPoolAddress.toLowerCase() +
          roundTimestamp(baseTimestamp, 86400 * 30).toString()
      );
      assert.equal(
        historicalBalance1m?.shareBalance,
        0n,
        "Historical monthly balance should be 0 before deposit"
      );

      // Test Withdraw event
      const mockWithdraw = ClaggMain.Withdraw.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
          block: {
            timestamp: baseTimestamp + 1000,
          },
        },
        user: userAddress1,
        pool: syncswapPoolAddress,
        amount: 50n,
        shares: 50n,
      });

      const mockDbAfterWithdraw = await ClaggMain.Withdraw.processEvent({
        event: mockWithdraw,
        mockDb: mockDbAfterDeposit,
      });

      // Check historical balances after withdrawal
      const historicalBalance4hAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance4Hours.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000).toString()
        );
      assert.equal(
        historicalBalance4hAfterWithdraw?.shareBalance,
        100n,
        "Historical 4-hour balance should be 100 before withdrawal"
      );

      const historicalBalance1dAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance1Day.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400).toString()
        );
      assert.equal(
        historicalBalance1dAfterWithdraw?.shareBalance,
        100n,
        "Historical daily balance should be 100 before withdrawal"
      );

      const historicalBalance7dAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance7Days.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400 * 7).toString()
        );
      assert.equal(
        historicalBalance7dAfterWithdraw?.shareBalance,
        100n,
        "Historical weekly balance should be 100 before withdrawal"
      );

      const historicalBalance1mAfterWithdraw =
        mockDbAfterWithdraw.entities.HistoricalClaggEarnBalance1Month.get(
          userAddress1.toLowerCase() +
            syncswapPoolAddress.toLowerCase() +
            roundTimestamp(baseTimestamp + 1000, 86400 * 30).toString()
        );
      assert.equal(
        historicalBalance1mAfterWithdraw?.shareBalance,
        100n,
        "Historical monthly balance should be 100 before withdrawal"
      );
    });
  });
});
