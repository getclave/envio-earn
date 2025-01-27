import assert from "assert";
import { TestHelpers, AccountIdleBalance } from "generated";
import { zeroAddress } from "viem";
import { VenusPoolAddresses } from "../src/constants/VenusPools";
import { ClaggMainAddress } from "../src/constants/ClaggAddresses";
import { AavePoolAddresses } from "../src/constants/AavePools";
const { MockDb, ERC20, Addresses, Venus, SyncswapFactory, SyncswapPool, ClaggMain, Aave } =
  TestHelpers;

process.env.NODE_ENV = "test";

describe("ERC20Handler", () => {
  //Instantiate a mock DB
  const mockDbEmpty = MockDb.createMockDb();
  const tokenId = "0x0000000000000000000000B4s00000000Ac000001";
  //Get mock addresses from helpers
  let userAddress1 = Addresses.mockAddresses[0];
  let userAddress2 = Addresses.mockAddresses[1];

  //Make a mock entity to set the initial state of the mock db
  const mockAccountIdleBalanceEntity: AccountIdleBalance = {
    id: userAddress1.toLowerCase() + tokenId.toLowerCase(),
    balance: 5n,
    address: userAddress1.toLowerCase(),
    token: tokenId.toLowerCase(),
  };

  const mockDb = mockDbEmpty.entities.AccountIdleBalance.set(mockAccountIdleBalanceEntity);

  //Set an initial state for the user
  //Note: set and delete functions do not mutate the mockDb, they return a new
  //mockDb with with modified state
  it("Plain transfers between two users", async () => {
    //Create a mock Transfer event from userAddress1 to userAddress2
    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 3n,
      mockEventData: {
        srcAddress: tokenId,
      },
    });

    //Process the mockEvent
    //Note: processEvent functions do not mutate the mockDb, they return a new
    //mockDb with with modified state
    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    //Get the balance of userAddress1 after the transfer
    const account1Balance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
      userAddress1.toLowerCase() + mockTransfer.srcAddress.toLowerCase()
    )?.balance;

    //Assert the expected balance
    assert.equal(
      2n,
      account1Balance,
      "Should have subtracted transfer amount 3 from userAddress1 balance 5"
    );

    //Get the balance of userAddress2 after the transfer
    const account2Balance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
      userAddress2.toLowerCase() + mockTransfer.srcAddress.toLowerCase()
    )?.balance;

    //Assert the expected balance
    assert.equal(
      3n,
      account2Balance,
      "Should have added transfer amount 3 to userAddress2 balance 0"
    );

    const account1 = mockDbAfterTransfer.entities.Account.get(userAddress1.toLowerCase())?.address;
    assert.equal(account1, userAddress1.toLowerCase(), "Account 1 should exist");

    const account2 = mockDbAfterTransfer.entities.Account.get(userAddress2.toLowerCase())?.address;
    assert.equal(account2, userAddress2.toLowerCase(), "Account 2 should exist");
  });

  it("Plain transfer to itself", async () => {
    userAddress2 = Addresses.mockAddresses[0];

    //Create a mock Transfer event from userAddress1 to userAddress2
    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 3n,
      mockEventData: {
        srcAddress: tokenId,
      },
    });

    //Process the mockEvent
    //Note: processEvent functions do not mutate the mockDb, they return a new
    //mockDb with with modified state
    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    //Get the balance of userAddress1 after the transfer
    const account1Balance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
      userAddress1.toLowerCase() + mockTransfer.srcAddress.toLowerCase()
    )?.balance;

    //Assert the expected balance
    assert.equal(5n, account1Balance, "Balance should remain unchanged");
  });

  it("Venus minting new tokens", async () => {
    const mockDb = MockDb.createMockDb();
    const mockMint = ERC20.Transfer.createMockEvent({
      from: zeroAddress,
      to: userAddress1,
      value: 3n,
      mockEventData: {
        srcAddress: VenusPoolAddresses[0],
      },
    });

    const mockDbAfterMint = await ERC20.Transfer.processEvent({
      event: mockMint,
      mockDb,
    });

    const pool = mockDbAfterMint.entities.VenusPool.get(VenusPoolAddresses[0]);
    assert.notEqual(pool?.exchangeRate, 0n, "Exchange rate should be set");

    const account1Balance = mockDbAfterMint.entities.VenusEarnBalance.get(
      userAddress1.toLowerCase() + VenusPoolAddresses[0].toLowerCase()
    );
    assert.equal(account1Balance?.shareBalance, 3n, "Account earn balance should be set");
  });

  it("Venus should fetch exchange rate in interval", async () => {
    const mockDb = MockDb.createMockDb();
    const mockTx = Venus.AccrueInterest.createMockEvent({
      mockEventData: {
        srcAddress: VenusPoolAddresses[0],
        block: {
          number: 1000,
        },
      },
    });

    const mockDbAfterTx = await Venus.AccrueInterest.processEvent({
      event: mockTx,
      mockDb,
    });

    const pool = mockDbAfterTx.entities.VenusPool.get(VenusPoolAddresses[0]);
    assert.notEqual(pool?.exchangeRate, 0n, "Exchange rate should be set");

    const mockTx2 = Venus.AccrueInterest.createMockEvent({
      mockEventData: {
        srcAddress: VenusPoolAddresses[0],
        block: {
          number: 1001,
        },
      },
    });

    const mockDbAfterTx2 = await Venus.AccrueInterest.processEvent({
      event: mockTx2,
      mockDb: mockDbAfterTx,
    });

    const pool2 = mockDbAfterTx2.entities.VenusPool.get(VenusPoolAddresses[0]);
    assert.equal(pool2?.exchangeRate, pool?.exchangeRate, "Exchange rate should remain unchanged");
  });

  it("Syncswap should create new pool and handle user balances", async () => {
    process.env.TEST_MODE = "syncswap";
    const mockDb = MockDb.createMockDb();
    const token0 = "0x367700c33ea7d4523403ca8ca790918ccb76dAb4";
    const token1 = "0x65006841486feb84570d909703ad646ddeaf0f5B";
    const poolAdd = "0x0259d9dfb638775858b1d072222237e2ce7111C0";

    const mockPool = SyncswapFactory.PoolCreated.createMockEvent({
      mockEventData: {
        srcAddress: "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb",
      },
      pool: poolAdd,
      token0,
      token1,
    });

    const mockDbAfterPool = await SyncswapFactory.PoolCreated.processEvent({
      event: mockPool,
      mockDb,
    });

    const pool = mockDbAfterPool.entities.SyncswapPool.get(poolAdd.toLowerCase());
    assert.equal(pool?.id, poolAdd.toLowerCase(), "Pool should be created");
    assert.equal(pool?.underlyingToken, token0.toLowerCase(), "Token 0 should be set");
    assert.equal(pool?.underlyingToken2, token1.toLowerCase(), "Token 1 should be set");

    const mockTx = SyncswapPool.Mint.createMockEvent({
      mockEventData: {
        srcAddress: poolAdd,
      },
      liquidity: 100n,
    });

    const mockSyncTx = SyncswapPool.Sync.createMockEvent({
      mockEventData: {
        srcAddress: poolAdd,
      },
      reserve0: 100n,
      reserve1: 100n,
    });

    const mockDbAfterTx = await SyncswapPool.Mint.processEvent({
      event: mockTx,
      mockDb: mockDbAfterPool,
    });

    const mockDbAfterSync = await SyncswapPool.Sync.processEvent({
      event: mockSyncTx,
      mockDb: mockDbAfterTx,
    });

    const pool2 = mockDbAfterSync.entities.SyncswapPool.get(poolAdd.toLowerCase());
    assert.equal(
      pool2?.totalSupply,
      100n + (pool?.totalSupply ?? 0n),
      "Total supply should be set"
    );

    assert.equal(pool2?.reserve0, 100n, "Reserve 0 should be set");
    assert.equal(pool2?.reserve1, 100n, "Reserve 1 should be set");

    const mockBurn = SyncswapPool.Burn.createMockEvent({
      mockEventData: {
        srcAddress: poolAdd,
      },
      liquidity: 100n,
    });

    const mockDbAfterBurn = await SyncswapPool.Burn.processEvent({
      event: mockBurn,
      mockDb: mockDbAfterSync,
    });

    const pool3 = mockDbAfterBurn.entities.SyncswapPool.get(poolAdd.toLowerCase());
    assert.equal(pool3?.totalSupply, pool?.totalSupply, "Total supply should be set");
    const userAddress1 = Addresses.mockAddresses[0];
    const userAddress2 = Addresses.mockAddresses[1];
    const transferTx = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 100n,
      mockEventData: {
        srcAddress: poolAdd,
      },
    });

    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: transferTx,
      mockDb: mockDbAfterBurn,
    });

    const accountBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
      userAddress2.toLowerCase() + poolAdd.toLowerCase()
    );
    assert.equal(accountBalance?.shareBalance, 100n, "Share balance should be set");
    const accountBalance2 = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
      userAddress1.toLowerCase() + poolAdd.toLowerCase()
    );
    assert.equal(accountBalance2?.shareBalance, -100n, "Share balance should be set");
    process.env.TEST_MODE = "default";
  });

  it("Clagg should handle minting and burning correctly", async () => {
    const mockDb = MockDb.createMockDb();
    const userAddress = Addresses.mockAddresses[0];
    const claggPoolAddress = ClaggMainAddress;
    const venusPoolAddress = VenusPoolAddresses[0];
    const token0 = "0x367700c33ea7d4523403ca8ca790918ccb76dAb4";
    const token1 = "0x65006841486feb84570d909703ad646ddeaf0f5B";
    const poolAdd = "0x14A7a4bea54983796086eaea935564c5f33179c5";

    const mockPool = SyncswapFactory.PoolCreated.createMockEvent({
      mockEventData: {
        srcAddress: "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb",
      },
      pool: poolAdd,
      token0,
      token1,
    });

    const mockDbAfterPool = await SyncswapFactory.PoolCreated.processEvent({
      event: mockPool,
      mockDb,
    });

    // Test minting Clagg shares
    const mockMint = ClaggMain.Deposit.createMockEvent({
      user: userAddress,
      pool: poolAdd,
      amount: 130n,
      shares: 100n,
      mockEventData: {
        srcAddress: ClaggMainAddress,
      },
    });

    const mockDbAfterMint = await ClaggMain.Deposit.processEvent({
      event: mockMint,
      mockDb: mockDbAfterPool,
    });

    // Verify Clagg pool state after mint
    const pool = mockDbAfterMint.entities.ClaggPool.get(poolAdd.toLowerCase());
    assert.equal(pool?.totalShares, 100n, "Total shares should be updated after mint");

    // Verify user balance
    const userBalance = mockDbAfterMint.entities.ClaggEarnBalance.get(
      userAddress.toLowerCase() + poolAdd.toLowerCase()
    );

    assert.equal(
      userBalance?.shareBalance,
      100n,
      "User share balance should be updated after mint"
    );

    // Test burning Clagg shares
    const mockBurn = ClaggMain.Withdraw.createMockEvent({
      user: userAddress,
      pool: poolAdd,
      amount: 40n,
      shares: 50n,
      mockEventData: {
        srcAddress: ClaggMainAddress,
      },
    });

    const mockDbAfterBurn = await ClaggMain.Withdraw.processEvent({
      event: mockBurn,
      mockDb: mockDbAfterMint,
    });

    // Verify Clagg pool state after burn
    const poolAfterBurn = mockDbAfterBurn.entities.ClaggPool.get(poolAdd.toLowerCase());
    assert.equal(poolAfterBurn?.totalShares, 50n, "Total shares should be reduced after burn");

    // Verify user balance after burn
    const userBalanceAfterBurn = mockDbAfterBurn.entities.ClaggEarnBalance.get(
      userAddress.toLowerCase() + poolAdd.toLowerCase()
    );
    assert.equal(
      userBalanceAfterBurn?.shareBalance,
      50n,
      "User share balance should be reduced after burn"
    );

    // Test integration with Venus pool
    const mockVenusTransfer = ERC20.Transfer.createMockEvent({
      from: zeroAddress,
      to: claggPoolAddress,
      value: 200n,
      mockEventData: {
        srcAddress: venusPoolAddress,
      },
    });

    const mockDbAfterVenus = await ERC20.Transfer.processEvent({
      event: mockVenusTransfer,
      mockDb: mockDbAfterBurn,
    });

    const claggPool = mockDbAfterVenus.entities.ClaggPool.get(venusPoolAddress.toLowerCase());
    assert.equal(claggPool?.totalSupply, 200n, "Total supply should be updated after mint");
  });

  it("Aave minting new tokens", async () => {
    const mockMint = Aave.Mint.createMockEvent({
      caller: userAddress1,
      onBehalfOf: userAddress1,
      value: 100n,
      balanceIncrease: 100n,
      index: 1000000n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterMint = await Aave.Mint.processEvent({
      event: mockMint,
      mockDb,
    });

    // Verify pool state
    const pool = mockDbAfterMint.entities.AavePool.get(AavePoolAddresses[0].toLowerCase());
    assert.equal(pool?.lastIndex, 1000000n, "Last index should be updated");

    // Verify user balance
    const userBalance = mockDbAfterMint.entities.AaveEarnBalance.get(
      userAddress1.toLowerCase() + AavePoolAddresses[0].toLowerCase()
    );

    assert.equal(userBalance?.userIndex, 1000000n, "User index should be set");
  });

  it("Aave burning tokens", async () => {
    // First mint some tokens
    const mockMint = Aave.Mint.createMockEvent({
      caller: userAddress1,
      onBehalfOf: userAddress1,
      value: 100n,
      balanceIncrease: 100n,
      index: 1000000n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterMint = await Aave.Mint.processEvent({
      event: mockMint,
      mockDb,
    });

    // Then burn some tokens
    const mockBurn = Aave.Burn.createMockEvent({
      from: userAddress1,
      target: userAddress2,
      value: 50n,
      balanceIncrease: 0n,
      index: 1100000n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterBurn = await Aave.Burn.processEvent({
      event: mockBurn,
      mockDb: mockDbAfterMint,
    });

    // Verify pool state
    const pool = mockDbAfterBurn.entities.AavePool.get(AavePoolAddresses[0].toLowerCase());
    assert.equal(pool?.lastIndex, 1100000n, "Last index should be updated after burn");

    // Verify user balance
    const userBalance = mockDbAfterBurn.entities.AaveEarnBalance.get(
      userAddress1.toLowerCase() + AavePoolAddresses[0].toLowerCase()
    );
    assert.equal(userBalance?.userIndex, 1100000n, "User index should be updated after burn");
  });

  it("Aave transfer between users", async () => {
    const userAddress2 = Addresses.mockAddresses[1];
    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 30n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    // Verify sender balance
    const senderBalance = mockDbAfterTransfer.entities.AaveEarnBalance.get(
      userAddress1.toLowerCase() + AavePoolAddresses[0].toLowerCase()
    );

    assert.equal(senderBalance?.shareBalance, -30n, "Sender balance should be reduced");

    // Verify receiver balance
    const receiverBalance = mockDbAfterTransfer.entities.AaveEarnBalance.get(
      userAddress2.toLowerCase() + AavePoolAddresses[0].toLowerCase()
    );
    assert.equal(receiverBalance?.shareBalance, 30n, "Receiver balance should be increased");
  });

  it("Aave transfer to/from Clagg", async () => {
    // Test transfer to Clagg
    const mockTransferToClagg = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: ClaggMainAddress,
      value: 50n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterToClagg = await ERC20.Transfer.processEvent({
      event: mockTransferToClagg,
      mockDb,
    });

    const claggPoolAfterDeposit = mockDbAfterToClagg.entities.ClaggPool.get(
      AavePoolAddresses[0].toLowerCase()
    );
    assert.equal(
      claggPoolAfterDeposit?.totalSupply,
      50n,
      "Clagg pool total supply should increase after deposit"
    );

    // Test transfer from Clagg
    const mockTransferFromClagg = ERC20.Transfer.createMockEvent({
      from: ClaggMainAddress,
      to: userAddress1,
      value: 20n,
      mockEventData: {
        srcAddress: AavePoolAddresses[0],
      },
    });

    const mockDbAfterFromClagg = await ERC20.Transfer.processEvent({
      event: mockTransferFromClagg,
      mockDb: mockDbAfterToClagg,
    });

    const claggPoolAfterWithdraw = mockDbAfterFromClagg.entities.ClaggPool.get(
      AavePoolAddresses[0].toLowerCase()
    );
    assert.equal(
      claggPoolAfterWithdraw?.totalSupply,
      30n,
      "Clagg pool total supply should decrease after withdrawal"
    );
  });
});
