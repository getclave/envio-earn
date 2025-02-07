export const ClaggAdapterABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rewardAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "incentiveAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "liquidityAdded",
        type: "uint256",
      },
    ],
    name: "Compound",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "duration",
        type: "uint256",
      },
    ],
    name: "IncentiveSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint48",
        name: "performanceFee",
        type: "uint48",
      },
      {
        indexed: false,
        internalType: "uint48",
        name: "nonClaveFee",
        type: "uint48",
      },
    ],
    name: "PoolConfigSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "reward",
            type: "address",
          },
          {
            internalType: "address",
            name: "intermediateToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool1",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool2",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "minAmountOut",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct RewardConfig[]",
        name: "rewardConfigs",
        type: "tuple[]",
      },
    ],
    name: "RewardConfigsSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "claveRegistry",
    outputs: [
      {
        internalType: "contract IClaveRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "compound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minLiquidity",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolConfig",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint48",
            name: "performanceFee",
            type: "uint48",
          },
          {
            internalType: "uint48",
            name: "nonClaveFee",
            type: "uint48",
          },
        ],
        internalType: "struct PoolConfig",
        name: "poolConfig",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolIncentive",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "remaining",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastUpdatedAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiry",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "swapPool",
            type: "address",
          },
        ],
        internalType: "struct Incentive",
        name: "poolIncentive",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolInfo",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "totalLiquidity",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalSupply",
            type: "uint256",
          },
        ],
        internalType: "struct PoolInfo",
        name: "poolInfo",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolRewardConfigs",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "reward",
            type: "address",
          },
          {
            internalType: "address",
            name: "intermediateToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool1",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool2",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "minAmountOut",
            type: "uint256",
          },
        ],
        internalType: "struct RewardConfig[]",
        name: "rewardConfigs",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolTvl",
    outputs: [
      {
        internalType: "uint256[]",
        name: "tvl",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getStakeLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "stakeLimit",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getUserInfo",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "balanceOf",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "deposited",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "withdrawn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gained",
            type: "uint256",
          },
        ],
        internalType: "struct UserInfo",
        name: "userInfo",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "getWithdrawableAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "getWithdrawableAmountUser",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "duration",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "swapPool",
        type: "address",
      },
    ],
    name: "setIncentive",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint48",
        name: "performanceFee",
        type: "uint48",
      },
      {
        internalType: "uint48",
        name: "nonClaveFee",
        type: "uint48",
      },
    ],
    name: "setPoolConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "reward",
            type: "address",
          },
          {
            internalType: "address",
            name: "intermediateToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool1",
            type: "address",
          },
          {
            internalType: "address",
            name: "swapPool2",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "minAmountOut",
            type: "uint256",
          },
        ],
        internalType: "struct RewardConfig[]",
        name: "_rewardConfigs",
        type: "tuple[]",
      },
    ],
    name: "setRewardConfigs",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minReceived",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
