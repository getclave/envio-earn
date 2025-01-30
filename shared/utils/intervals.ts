interface Interval {
  keyToBlocknum: Map<string, number>;
  interval: number;

  shouldFetch(key: string, currentBlocknum: number): boolean;
}

class Interval implements Interval {
  keyToBlocknum = new Map<string, number>();
  interval: number;

  constructor(interval?: number) {
    this.interval = interval || 86400;
  }

  shouldFetch(key: string, currentBlocknum: number) {
    const blocknum = this.keyToBlocknum.get(key);
    if (!blocknum) {
      this.keyToBlocknum.set(key, currentBlocknum);
      return true;
    }
    if (blocknum + this.interval < currentBlocknum) {
      this.keyToBlocknum.set(key, currentBlocknum);
      return true;
    }
    return false;
  }
}

export const venusExchangeRateInterval = new Interval(21600);
