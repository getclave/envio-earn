import assert from "assert";
import { TestHelpers, AccountIdleBalance } from "generated";
import { zeroAddress } from "viem";
import { VenusPoolAddresses } from "../src/constants/VenusPools";
const { MockDb, ERC20, Addresses, Venus, SyncswapFactory, SyncswapPool } = TestHelpers;

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
    token_id: tokenId.toLowerCase(),
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

    const account1Balance = mockDbAfterMint.entities.AccountEarnBalance.get(
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
    const mockDb = MockDb.createMockDb();
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

    const pool = mockDbAfterPool.entities.SyncswapPool.get(poolAdd.toLowerCase());
    assert.equal(pool?.id, poolAdd.toLowerCase(), "Pool should be created");
    assert.equal(pool?.underlyingToken_id, token0.toLowerCase(), "Token 0 should be set");
    assert.equal(pool?.underlyingToken2_id, token1.toLowerCase(), "Token 1 should be set");

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

    const accountBalance = mockDbAfterTransfer.entities.AccountEarnBalance.get(
      userAddress2.toLowerCase() + poolAdd.toLowerCase()
    );
    assert.equal(accountBalance?.shareBalance, 100n, "Share balance should be set");
    const accountBalance2 = mockDbAfterTransfer.entities.AccountEarnBalance.get(
      userAddress1.toLowerCase() + poolAdd.toLowerCase()
    );
    assert.equal(accountBalance2?.shareBalance, -100n, "Share balance should be set");
  });
});
