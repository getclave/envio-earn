import assert from "assert";
import { TestHelpers } from "generated";
import { VenusPoolAddresses } from "../src/constants/VenusPools";
import { ClaggMainAddress } from "../src/constants/ClaggAddresses";
import { AavePoolAddresses } from "../src/constants/AavePools";

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
  let mockDb: ReturnType<typeof MockDb.createMockDb>;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  describe("Syncswap", () => {
    const poolAddress = "0x0259d9dfb638775858b1d072222237e2ce7111C0";

    beforeEach(async () => {
      // Initialize Syncswap pool
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
    });

    it("should create new pool and handle pool events", async () => {
      // Create pool
      const mockPool = SyncswapFactory.PoolCreated.createMockEvent({
        mockEventData: {
          srcAddress: "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb",
          block: {
            timestamp: 1000,
          },
        },
        pool: poolAddress,
        token0,
        token1,
      });

      const mockDbAfterPool = await SyncswapFactory.PoolCreated.processEvent({
        event: mockPool,
        mockDb,
      });

      const pool = mockDbAfterPool.entities.SyncswapPool.get(poolAddress.toLowerCase());
      assert.equal(pool?.id, poolAddress.toLowerCase(), "Pool should be created");
      assert.equal(pool?.underlyingToken, token0.toLowerCase(), "Token 0 should be set");
      assert.equal(pool?.underlyingToken2, token1.toLowerCase(), "Token 1 should be set");
      assert.equal(pool?.totalSupply, 0n, "Initial total supply should be 0");

      // Test Mint event
      const mockMint = SyncswapPool.Mint.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1100,
          },
        },
        liquidity: 100n,
      });

      const mockDbAfterMint = await SyncswapPool.Mint.processEvent({
        event: mockMint,
        mockDb: mockDbAfterPool,
      });

      const poolAfterMint = mockDbAfterMint.entities.SyncswapPool.get(poolAddress.toLowerCase());
      assert.equal(poolAfterMint?.totalSupply, 100n, "Total supply should be updated after mint");

      // Test Sync event
      const mockSync = SyncswapPool.Sync.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1200,
          },
        },
        reserve0: 100n,
        reserve1: 100n,
      });

      const mockDbAfterSync = await SyncswapPool.Sync.processEvent({
        event: mockSync,
        mockDb: mockDbAfterMint,
      });

      const poolAfterSync = mockDbAfterSync.entities.SyncswapPool.get(poolAddress.toLowerCase());
      assert.equal(poolAfterSync?.reserve0, 100n, "Reserve0 should be updated");
      assert.equal(poolAfterSync?.reserve1, 100n, "Reserve1 should be updated");

      // Test Burn event
      const mockBurn = SyncswapPool.Burn.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1300,
          },
        },
        liquidity: 50n,
      });

      const mockDbAfterBurn = await SyncswapPool.Burn.processEvent({
        event: mockBurn,
        mockDb: mockDbAfterSync,
      });

      const poolAfterBurn = mockDbAfterBurn.entities.SyncswapPool.get(poolAddress.toLowerCase());
      assert.equal(poolAfterBurn?.totalSupply, 50n, "Total supply should be reduced after burn");
    });

    it("should handle user transfers and balances", async () => {
      const mockTransfer = SyncswapPool.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1400,
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

      const senderBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(senderBalance?.shareBalance, -100n, "Sender balance should be reduced");

      const receiverBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress2.toLowerCase() + poolAddress.toLowerCase()
      );
      assert.equal(receiverBalance?.shareBalance, 100n, "Receiver balance should be increased");
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
        exchangeRate: 0n,
      });
    });

    it("should handle minting and user balances", async () => {
      const mockMint = Venus.AccrueInterest.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
          block: {
            number: 1000,
          },
        },
      });

      const mockDbAfterMint = await Venus.AccrueInterest.processEvent({
        event: mockMint,
        mockDb,
      });

      const pool = mockDbAfterMint.entities.VenusPool.get(venusPoolAddress);
      assert.notEqual(pool?.exchangeRate, 0n, "Exchange rate should be set");

      // Test user transfer
      const mockTransfer = Venus.Transfer.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
        },
        from: userAddress1,
        to: userAddress2,
        value: 100n,
      });

      const mockDbAfterTransfer = await Venus.Transfer.processEvent({
        event: mockTransfer,
        mockDb: mockDbAfterMint,
      });

      const senderBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress1.toLowerCase() + venusPoolAddress.toLowerCase()
      );
      assert.equal(senderBalance?.shareBalance, -100n, "Sender balance should be reduced");

      const receiverBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress2.toLowerCase() + venusPoolAddress.toLowerCase()
      );
      assert.equal(receiverBalance?.shareBalance, 100n, "Receiver balance should be increased");
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
    const timestamp = 86400; // Use a timestamp that's already rounded to a day

    beforeEach(async () => {
      // Initialize Syncswap pool
      mockDb.entities.SyncswapPool.set({
        id: syncswapPoolAddress.toLowerCase(),
        address: syncswapPoolAddress,
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

      // Initialize Venus pool
      mockDb.entities.VenusPool.set({
        id: venusPoolAddress.toLowerCase(),
        address: venusPoolAddress,
        name: "Venus Pool",
        symbol: "vTOKEN",
        underlyingToken: token0,
        exchangeRate: 1000000n,
      });

      // Initialize Aave pool
      mockDb.entities.AavePool.set({
        id: aavePoolAddress.toLowerCase(),
        address: aavePoolAddress,
        name: "Aave Pool",
        symbol: "aToken",
        underlyingToken: token0,
        lastIndex: 2000000n,
      });

      // Initialize Clagg pool
      mockDb.entities.ClaggPool.set({
        id: syncswapPoolAddress.toLowerCase(),
        address: syncswapPoolAddress,
        totalShares: 0n,
        totalSupply: 0n,
      });
    });

    it("should create historical entities for Syncswap events", async () => {
      // First create the pool
      const mockPool = SyncswapFactory.PoolCreated.createMockEvent({
        mockEventData: {
          srcAddress: "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb",
          block: {
            timestamp,
          },
        },
        pool: syncswapPoolAddress,
        token0,
        token1,
      });

      const mockDbAfterPool = await SyncswapFactory.PoolCreated.processEvent({
        event: mockPool,
        mockDb,
      });

      // Then test Sync historical entity
      const mockSync = SyncswapPool.Sync.createMockEvent({
        mockEventData: {
          srcAddress: syncswapPoolAddress,
          block: {
            timestamp,
          },
        },
        reserve0: 1000n,
        reserve1: 2000n,
      });

      const mockDbAfterSync = await SyncswapPool.Sync.processEvent({
        event: mockSync,
        mockDb: mockDbAfterPool,
      });

      const historicalSync = mockDbAfterSync.entities.HistoricalSyncswapPool.get(
        syncswapPoolAddress.toLowerCase() + timestamp.toString()
      );
      assert.equal(historicalSync?.reserve0, 1000n, "Historical reserve0 should be recorded");
      assert.equal(historicalSync?.reserve1, 2000n, "Historical reserve1 should be recorded");
      assert.equal(
        historicalSync?.timestamp,
        BigInt(timestamp),
        "Historical timestamp should be recorded"
      );
    });

    it("should create historical entities for Venus events", async () => {
      // Test AccrueInterest historical entity
      const mockAccrue = Venus.AccrueInterest.createMockEvent({
        mockEventData: {
          srcAddress: venusPoolAddress,
          block: {
            number: 1000,
            timestamp,
          },
        },
      });

      const mockDbAfterAccrue = await Venus.AccrueInterest.processEvent({
        event: mockAccrue,
        mockDb,
      });

      const historicalVenus = mockDbAfterAccrue.entities.HistoricalVenusPool.get(
        venusPoolAddress.toLowerCase() + timestamp.toString()
      );
      assert.notEqual(
        historicalVenus?.exchangeRate,
        0n,
        "Historical exchange rate should be recorded"
      );
      assert.equal(
        historicalVenus?.timestamp,
        BigInt(timestamp),
        "Historical timestamp should be recorded"
      );
    });

    it("should create historical entities for Aave events", async () => {
      // Test Mint historical entity with initial index
      const mockMint = Aave.Mint.createMockEvent({
        mockEventData: {
          srcAddress: aavePoolAddress,
          block: {
            timestamp,
          },
        },
        caller: userAddress1,
        onBehalfOf: userAddress1,
        value: 100n,
        balanceIncrease: 100n,
        index: 2000000n,
      });

      const mockDbAfterMint = await Aave.Mint.processEvent({
        event: mockMint,
        mockDb,
      });

      const historicalAave = mockDbAfterMint.entities.HistoricalAavePool.get(
        aavePoolAddress.toLowerCase() + timestamp.toString()
      );
      assert.equal(historicalAave?.lastIndex, 2000000n, "Historical index should be recorded");
      assert.equal(
        historicalAave?.timestamp,
        BigInt(timestamp),
        "Historical timestamp should be recorded"
      );
    });

    it("should create historical entities for Clagg events", async () => {
      // Initialize with zero shares
      mockDb.entities.ClaggPool.set({
        id: syncswapPoolAddress.toLowerCase(),
        address: syncswapPoolAddress,
        totalShares: 0n,
        totalSupply: 0n,
      });

      // Test Deposit historical entity
      const mockDeposit = ClaggMain.Deposit.createMockEvent({
        mockEventData: {
          srcAddress: ClaggMainAddress,
          block: {
            timestamp,
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

      const historicalClagg = mockDbAfterDeposit.entities.HistoricalClaggPool.get(
        syncswapPoolAddress.toLowerCase() + timestamp.toString()
      );
      assert.equal(
        historicalClagg?.totalShares,
        100n,
        "Historical total shares should be recorded"
      );
      assert.equal(
        historicalClagg?.timestamp,
        BigInt(timestamp),
        "Historical timestamp should be recorded"
      );
    });
  });
});
