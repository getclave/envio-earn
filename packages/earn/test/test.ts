import { expect } from "chai";
import { TestHelpers } from "../generated";
const { MockDb, Venus, Aave, SyncswapPool, Addresses } = TestHelpers;

describe("Earn Handlers", () => {
  describe("Venus", () => {
    it("should handle Transfer events correctly", async () => {
      const mockDbEmpty = MockDb.createMockDb();
      const userAddress1 = Addresses.mockAddresses[0];
      const userAddress2 = Addresses.mockAddresses[1];
      const poolAddress = "0x84064c058f2efea4ab648bb6bd7e40f83ffde39a";

      // Initialize sender's balance
      const mockVenusEarnBalanceEntity = {
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase(),
        shareBalance: 5n,
        userAddress: userAddress1.toLowerCase(),
        venusPool_id: poolAddress.toLowerCase(),
      };

      const mockDb = mockDbEmpty.entities.VenusEarnBalance.set(mockVenusEarnBalanceEntity);

      // Create mock Transfer event
      const mockTransfer = Venus.Transfer.createMockEvent({
        from: userAddress1,
        to: userAddress2,
        value: 3n,
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1000,
          },
        },
      });

      process.env.NODE_ENV = "test";

      // Process the event
      const mockDbAfterTransfer = await Venus.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check balances
      const senderBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      const receiverBalance = mockDbAfterTransfer.entities.VenusEarnBalance.get(
        userAddress2.toLowerCase() + poolAddress.toLowerCase()
      );

      expect(senderBalance?.shareBalance).to.equal(2n);
      expect(receiverBalance?.shareBalance).to.equal(3n);
    });
  });

  describe("Aave", () => {
    it("should handle Transfer events correctly", async () => {
      const mockDbEmpty = MockDb.createMockDb();
      const userAddress1 = Addresses.mockAddresses[0];
      const userAddress2 = Addresses.mockAddresses[1];
      const poolAddress = "0xE977F9B2a5ccf0457870a67231F23BE4DaecfbDb";

      // Initialize sender's balance
      const mockAaveEarnBalanceEntity = {
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase(),
        shareBalance: 5n,
        userAddress: userAddress1.toLowerCase(),
        aavePool_id: poolAddress.toLowerCase(),
        userIndex: 0n,
      };

      const mockDb = mockDbEmpty.entities.AaveEarnBalance.set(mockAaveEarnBalanceEntity);

      // Create mock Transfer event
      const mockTransfer = Aave.Transfer.createMockEvent({
        from: userAddress1,
        to: userAddress2,
        value: 3n,
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1000,
          },
        },
      });

      process.env.NODE_ENV = "test";

      // Process the event
      const mockDbAfterTransfer = await Aave.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check balances
      const senderBalance = mockDbAfterTransfer.entities.AaveEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      const receiverBalance = mockDbAfterTransfer.entities.AaveEarnBalance.get(
        userAddress2.toLowerCase() + poolAddress.toLowerCase()
      );

      expect(senderBalance?.shareBalance).to.equal(2n);
      expect(receiverBalance?.shareBalance).to.equal(3n);
    });
  });

  describe("Syncswap", () => {
    it("should handle Transfer events correctly", async () => {
      const mockDbEmpty = MockDb.createMockDb();
      const userAddress1 = Addresses.mockAddresses[0];
      const userAddress2 = Addresses.mockAddresses[1];
      const poolAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb";

      // Initialize sender's balance
      const mockSyncswapEarnBalanceEntity = {
        id: userAddress1.toLowerCase() + poolAddress.toLowerCase(),
        shareBalance: 5n,
        userAddress: userAddress1.toLowerCase(),
        syncswapPool_id: poolAddress.toLowerCase(),
      };

      const mockDb = mockDbEmpty.entities.SyncswapEarnBalance.set(mockSyncswapEarnBalanceEntity);

      // Create mock Transfer event
      const mockTransfer = SyncswapPool.Transfer.createMockEvent({
        from: userAddress1,
        to: userAddress2,
        value: 3n,
        mockEventData: {
          srcAddress: poolAddress,
          block: {
            timestamp: 1000,
          },
        },
      });

      process.env.NODE_ENV = "test";

      // Process the event
      const mockDbAfterTransfer = await SyncswapPool.Transfer.processEvent({
        event: mockTransfer,
        mockDb,
      });

      // Check balances
      const senderBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress1.toLowerCase() + poolAddress.toLowerCase()
      );
      const receiverBalance = mockDbAfterTransfer.entities.SyncswapEarnBalance.get(
        userAddress2.toLowerCase() + poolAddress.toLowerCase()
      );

      expect(senderBalance?.shareBalance).to.equal(2n);
      expect(receiverBalance?.shareBalance).to.equal(3n);
    });
  });
});
