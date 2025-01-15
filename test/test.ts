import assert from "assert";
import { TestHelpers, AccountIdleBalance, Account } from "generated";
const { MockDb, ERC20, Addresses } = TestHelpers;

process.env.NODE_ENV = "test";

describe("Transfers", () => {
  it("Transfer subtracts the from account balance and adds to the to account balance", async () => {
    //Instantiate a mock DB
    const mockDbEmpty = MockDb.createMockDb();
    const tokenId = "0x0000000000000000000000000000000000000001";
    //Get mock addresses from helpers
    const userAddress1 = Addresses.mockAddresses[0];
    const userAddress2 = Addresses.mockAddresses[1];

    //Make a mock entity to set the initial state of the mock db
    const mockAccountIdleBalanceEntity: AccountIdleBalance = {
      id: userAddress1.toLowerCase() + tokenId.toLowerCase(),
      balance: 5n,
      address: userAddress1.toLowerCase(),
      token_id: tokenId.toLowerCase(),
    };

    const mockAccountEntity: Account = {
      id: userAddress1.toLowerCase(),
      address: userAddress1.toLowerCase(),
    };

    //Set an initial state for the user
    //Note: set and delete functions do not mutate the mockDb, they return a new
    //mockDb with with modified state
    const mockDb = mockDbEmpty.entities.AccountIdleBalance.set(
      mockAccountIdleBalanceEntity
    ).entities.Account.set(mockAccountEntity);

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
});
