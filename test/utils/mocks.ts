import { vi } from "vitest";

export const mockContext = () => ({
  AccountEarnBalance: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
  },
  VenusPool: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
  },
  SyncswapPool: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
  },
  PoolRegistry: {
    set: vi.fn(),
  },
  Token: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
  },
  Account: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
  },
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
});

export const mockEvent = () => ({
  params: {
    from: "",
    to: "",
    value: 0n,
  },
  srcAddress: "",
  block: {
    timestamp: Date.now(),
  },
});

export const mockLoaderReturn = () => ({
  claveAddresses: new Set<string>(),
  senderBalance: undefined,
  receiverBalance: undefined,
  senderAccount: undefined,
  receiverAccount: undefined,
});
