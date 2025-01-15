import assert from "assert";
import { TestHelpers, AccountIdleBalance, Account, VenusPool } from "generated";
import { zeroAddress } from "viem";
import { VenusPoolAddresses } from "../src/constants/VenusPools";
const { MockDb, ERC20, Addresses } = TestHelpers;

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

  it("Venus Total Supply Change", async () => {
    userAddress2 = zeroAddress;

    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 3n,
      mockEventData: {
        srcAddress: "0x697a70779c1a03BA2bd28b7627a902bff831b616",
      },
    });

    const mockVenusPoolEntity: VenusPool = {
      id: mockTransfer.srcAddress.toLowerCase(),
      totalSupply: 100n,
      totalCash: 100n,
      totalBorrows: 0n,
      totalReserves: 0n,
      address: mockTransfer.srcAddress.toLowerCase(),
      badDebt: 0n,
      name: "Venus",
      protocol: "Venus",
      symbol: "VENUS",
      underlyingToken_id: "0x0000000000000000000000B4s00000000Ac000001",
    };

    const mockDb = mockDbEmpty.entities.VenusPool.set(mockVenusPoolEntity);

    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    const venusPool = mockDbAfterTransfer.entities.VenusPool.get(
      mockTransfer.srcAddress.toLowerCase()
    );
    assert.equal(venusPool?.totalSupply, 97n, "Total supply should be 97");

    const reverseMockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress2,
      to: userAddress1,
      value: 3n,
      mockEventData: {
        srcAddress: mockTransfer.srcAddress,
      },
    });

    const mockDbAfterReverseTransfer = await ERC20.Transfer.processEvent({
      event: reverseMockTransfer,
      mockDb: mockDbAfterTransfer,
    });

    assert.equal(
      mockDbAfterReverseTransfer.entities.VenusPool.get(mockTransfer.srcAddress.toLowerCase())
        ?.totalSupply,
      100n,
      "Total supply should be 100 again"
    );
  });

  it("Venus Total Cash Change", async () => {
    userAddress2 = VenusPoolAddresses[0];

    const mockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      value: 3n,
      mockEventData: {
        srcAddress: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4",
      },
    });

    const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    const venusPool = mockDbAfterTransfer.entities.VenusPool.get(userAddress2.toLowerCase());
    assert.equal(venusPool?.totalCash, 3n, "Total cash should be 3");

    const accountIdleBalance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
      userAddress1.toLowerCase() + mockTransfer.srcAddress.toLowerCase()
    );
    assert.equal(accountIdleBalance?.balance, -3n, "Account earn balance should be -3");

    const reverseMockTransfer = ERC20.Transfer.createMockEvent({
      from: userAddress2,
      to: userAddress1,
      value: 3n,
      mockEventData: {
        srcAddress: mockTransfer.srcAddress,
      },
    });

    const mockDbAfterReverseTransfer = await ERC20.Transfer.processEvent({
      event: reverseMockTransfer,
      mockDb: mockDbAfterTransfer,
    });

    const venusPool2 = mockDbAfterReverseTransfer.entities.VenusPool.get(
      userAddress2.toLowerCase()
    );
    assert.equal(venusPool2?.totalCash, 0n, "Total cash should be 0");

    const accountIdleBalance2 = mockDbAfterReverseTransfer.entities.AccountIdleBalance.get(
      userAddress1.toLowerCase() + mockTransfer.srcAddress.toLowerCase()
    );

    assert.equal(accountIdleBalance2?.balance, 0n, "Account earn balance should be 0");
  });
});
