@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require("root/" ++ handlerPathRelativeToRoot)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

%%private(
  let makeGeneratedConfig = () => {
    let chains = [
      {
        let contracts = [
          {
            Config.name: "ERC20",
            abi: Types.ERC20.abi,
            addresses: [
            ],
            events: [
              module(Types.ERC20.Transfer),
            ],
            sighashes: [
              Types.ERC20.Transfer.sighash,
            ],
          },
          {
            Config.name: "SyncswapMaster",
            abi: Types.SyncswapMaster.abi,
            addresses: [
              "0xbB05918E9B4bA9Fe2c8384d223f0844867909Ffb"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              module(Types.SyncswapMaster.RegisterPool),
            ],
            sighashes: [
              Types.SyncswapMaster.RegisterPool.sighash,
            ],
          },
          {
            Config.name: "ClaggMain",
            abi: Types.ClaggMain.abi,
            addresses: [
              "0x7f73934F333a25B456Dc9B8b62A19f211c991f1c"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              module(Types.ClaggMain.AdapterAdded),
              module(Types.ClaggMain.Deposit),
              module(Types.ClaggMain.Withdraw),
            ],
            sighashes: [
              Types.ClaggMain.AdapterAdded.sighash,
              Types.ClaggMain.Deposit.sighash,
              Types.ClaggMain.Withdraw.sighash,
            ],
          },
        ]
        let chain = ChainMap.Chain.makeUnsafe(~chainId=324)
        {
          Config.confirmedBlockThreshold: 200,
          syncSource: 
            HyperSync
,
          startBlock: 9767,
          endBlock:  None ,
          chain,
          contracts,
          chainWorker:
            module(HyperSyncWorker.Make({
              let chain = chain
              let contracts = contracts
              let endpointUrl = "https://324.hypersync.xyz"
              let allEventSignatures = [
                Types.ERC20.eventSignatures,
                Types.SyncswapMaster.eventSignatures,
                Types.ClaggMain.eventSignatures,
              ]->Belt.Array.concatMany
              let eventRouter =
                contracts
                ->Belt.Array.flatMap(contract => contract.events)
                ->EventRouter.fromEvmEventModsOrThrow(~chain)
              /*
                Determines whether to use HypersyncClient Decoder or Viem for parsing events
                Default is hypersync client decoder, configurable in config with:
                ```yaml
                event_decoder: "viem" || "hypersync-client"
                ```
              */
              let shouldUseHypersyncClientDecoder = Env.Configurable.shouldUseHypersyncClientDecoder->Belt.Option.getWithDefault(
                true,
              )
              let blockSchema = Types.AggregatedBlock.schema
              let transactionSchema = Types.AggregatedTransaction.schema
            }))
        }
      },
    ]

    Config.make(
      ~shouldRollbackOnReorg=false,
      ~shouldSaveFullHistory=false,
      ~isUnorderedMultichainMode=false,
      ~chains,
      ~enableRawEvents=false,
      ~entities=[
        module(Entities.AccountClaggPosition),
        module(Entities.AccountIdleBalance),
        module(Entities.AccountSyncswapPosition),
        module(Entities.AccountVenusPosition),
        module(Entities.ClaggAdapter),
        module(Entities.ClaggPool),
        module(Entities.HistoricalAccountIdleBalance),
        module(Entities.SyncswapPool),
        module(Entities.Token),
        module(Entities.VenusPool),
      ],
    )
  }

  let config: ref<option<Config.t>> = ref(None)
)

let registerAllHandlers = () => {
  registerContractHandlers(
    ~contractName="ClaggMain",
    ~handlerPathRelativeToRoot="src/ClaggHandler.ts",
    ~handlerPathRelativeToConfig="src/ClaggHandler.ts",
  )
  registerContractHandlers(
    ~contractName="ERC20",
    ~handlerPathRelativeToRoot="src/ERC20Handler.ts",
    ~handlerPathRelativeToConfig="src/ERC20Handler.ts",
  )
  registerContractHandlers(
    ~contractName="SyncswapMaster",
    ~handlerPathRelativeToRoot="src/SyncswapHandler.ts",
    ~handlerPathRelativeToConfig="src/SyncswapHandler.ts",
  )

  let generatedConfig = makeGeneratedConfig()
  config := Some(generatedConfig)
  generatedConfig
}

let getConfig = () => {
  switch config.contents {
  | Some(config) => config
  | None => registerAllHandlers()
  }
}
