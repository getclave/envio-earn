interface Interval {
  keyToBlocknum: Map<string, number>;
  interval: number;

  shouldFetch(key: string, currentBlocknum: number): boolean;
  addNewKey(key: string): void;
}

class Interval implements Interval {
  keyToBlocknum = new Map<string, number>();
  interval: number;

  constructor(interval?: number) {
    this.interval = interval || 86400;
  }

  addNewKey(key: string) {
    this.keyToBlocknum.set(key, 0);
  }

  shouldFetch(key: string, currentBlocknum: number) {
    const blocknum = this.keyToBlocknum.get(key);
    if (!blocknum) return true;
    if (blocknum + this.interval < currentBlocknum) {
      this.keyToBlocknum.set(key, currentBlocknum);
      return true;
    }
    return false;
  }
}

const venusInterval = new Interval();
