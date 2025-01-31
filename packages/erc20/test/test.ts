import { expect } from "chai";
import { TestHelpers } from "generated";
const { MockDb, ERC20, Addresses } = TestHelpers;

describe("ERC20 Handler", () => {
  describe("Transfer", () => {
    it("should handle Transfer events correctly", async () => {
      const mockDbEmpty = MockDb.createMockDb();
      const userAddress1 = Addresses.mockAddresses[0];
      const userAddress2 = Addresses.mockAddresses[1];
      const tokenAddress = "0x84064c058f2efea4ab648bb6bd7e40f83ffde39a";

      // Initialize sender's balance
      const mockAccountIdleBalanceEntity = {
        id: userAddress1.toLowerCase() + tokenAddress.toLowerCase(),
        balance: 5n,
        address: userAddress1.toLowerCase(),
        token: tokenAddress.toLowerCase(),
      };

      const mockDb = mockDbEmpty.entities.AccountIdleBalance.set(mockAccountIdleBalanceEntity);

      // Create mock Transfer event
      const mockTransfer = ERC20.Transfer.createMockEvent({
        from: userAddress1,
        to: userAddress2,
        value: 3n,
        mockEventData: {
          srcAddress: tokenAddress,
          block: {
            timestamp: 1000,
          },
        },
      });

      process.env.NODE_ENV = "test";

      // Process the event
      const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check balances
      const senderBalance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
        userAddress1.toLowerCase() + tokenAddress.toLowerCase()
      );
      const receiverBalance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
        userAddress2.toLowerCase() + tokenAddress.toLowerCase()
      );

      expect(senderBalance?.balance).to.equal(2n);
      expect(receiverBalance?.balance).to.equal(3n);
    });

    it("should handle new accounts correctly", async () => {
      const mockDbEmpty = MockDb.createMockDb();
      const userAddress1 = Addresses.mockAddresses[0];
      const userAddress2 = Addresses.mockAddresses[1];
      const tokenAddress = "0x84064c058f2efea4ab648bb6bd7e40f83ffde39a";

      // Create mock Transfer event for new accounts
      const mockTransfer = ERC20.Transfer.createMockEvent({
        from: userAddress1,
        to: userAddress2,
        value: 3n,
        mockEventData: {
          srcAddress: tokenAddress,
          block: {
            timestamp: 1000,
          },
        },
      });

      process.env.NODE_ENV = "test";

      // Process the event
      const mockDbAfterTransfer = await ERC20.Transfer.processEvent({
        event: mockTransfer,
        mockDb: mockDbEmpty,
      });

      // Check account creation
      const senderAccount = mockDbAfterTransfer.entities.Account.get(userAddress1.toLowerCase());
      const receiverAccount = mockDbAfterTransfer.entities.Account.get(userAddress2.toLowerCase());

      expect(senderAccount?.address).to.equal(userAddress1.toLowerCase());
      expect(receiverAccount?.address).to.equal(userAddress2.toLowerCase());

      // Check balances
      const senderBalance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
        userAddress1.toLowerCase() + tokenAddress.toLowerCase()
      );
      const receiverBalance = mockDbAfterTransfer.entities.AccountIdleBalance.get(
        userAddress2.toLowerCase() + tokenAddress.toLowerCase()
      );

      expect(senderBalance?.balance).to.equal(-3n);
      expect(receiverBalance?.balance).to.equal(3n);
    });
  });
});
