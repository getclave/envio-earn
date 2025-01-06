import { getRedisInstance } from "./Redis";

class WalletCache {
  private readonly CACHE_KEY = "clave:wallets";
  private redisCommand: Awaited<ReturnType<typeof getRedisInstance>> | undefined;
  private redisSub: Awaited<ReturnType<typeof getRedisInstance>> | undefined;
  private inMemoryCache: Set<string> = new Set();

  constructor() {
    this.initialize();
  }

  async initialize() {
    // Create two connections - one for subscribing and one for getting data
    const [commandClient, subClient] = await Promise.all([
      getRedisInstance({
        host: process.env.REDIS_HOST || "redis-12945.c300.eu-central-1-1.ec2.redns.redis-cloud.com",
        port: parseInt(process.env.REDIS_PORT || "12945"),
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD || "YPbmBSP7lBumkk4oL6djJH4tfowkpDNo",
      }),
      getRedisInstance({
        host: process.env.REDIS_HOST || "redis-12945.c300.eu-central-1-1.ec2.redns.redis-cloud.com",
        port: parseInt(process.env.REDIS_PORT || "12945"),
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD || "YPbmBSP7lBumkk4oL6djJH4tfowkpDNo",
        isSubscriptionClient: true,
      }),
    ]);

    this.redisCommand = commandClient;
    this.redisSub = subClient;

    await this.updateInMemoryCache();
    await this.subscribeToSetOperations();
  }

  private async updateInMemoryCache() {
    const members = await this.redisCommand!.sMembers(this.CACHE_KEY);
    this.inMemoryCache = new Set(members);
  }

  private async subscribeToSetOperations() {
    const keyspaceChannel = `__keyspace@0__:${this.CACHE_KEY}`;

    await this.redisSub!.subscribe(keyspaceChannel, () => {
      this.updateInMemoryCache();
    });
  }

  async bulkCheckClaveWallets(addresses: Array<string>): Promise<Set<string>> {
    if (!this.redisCommand) {
      await this.initialize();
    }

    try {
      const claveAddresses = new Set<string>();
      const lowercaseAddresses = addresses.map((addr) => addr.toLowerCase());

      lowercaseAddresses.forEach((address) => {
        const isMember = this.inMemoryCache.has(address);
        if (isMember) {
          claveAddresses.add(address);
        }
      });

      return claveAddresses;
    } catch (error) {
      console.error("Failed to bulk check wallets", error);
      return new Set<string>();
    }
  }
}

export const walletCache = new WalletCache();
