
type hyperSyncConfig = {endpointUrl: string}
type hyperFuelConfig = {endpointUrl: string}

@genType.opaque
type rpcConfig = {
  syncConfig: Config.syncConfig,
}

@genType
type syncSource = HyperSync(hyperSyncConfig) | HyperFuel(hyperFuelConfig) | Rpc(rpcConfig)

@genType.opaque
type aliasAbi = Ethers.abi

type eventName = string

type contract = {
  name: string,
  abi: aliasAbi,
  addresses: array<string>,
  events: array<eventName>,
}

type configYaml = {
  syncSource,
  startBlock: int,
  confirmedBlockThreshold: int,
  contracts: dict<contract>,
}

let publicConfig = ChainMap.fromArrayUnsafe([
  {
    let contracts = Js.Dict.fromArray([
      (
        "ERC20",
        {
          name: "ERC20",
          abi: Types.ERC20.abi,
          addresses: [
          ],
          events: [
            Types.ERC20.Transfer.name,
          ],
        }
      ),
      (
        "SyncswapMaster",
        {
          name: "SyncswapMaster",
          abi: Types.SyncswapMaster.abi,
          addresses: [
            "0xbB05918E9B4bA9Fe2c8384d223f0844867909Ffb",
          ],
          events: [
            Types.SyncswapMaster.RegisterPool.name,
          ],
        }
      ),
      (
        "ClaggMain",
        {
          name: "ClaggMain",
          abi: Types.ClaggMain.abi,
          addresses: [
            "0x7f73934F333a25B456Dc9B8b62A19f211c991f1c",
          ],
          events: [
            Types.ClaggMain.AdapterAdded.name,
            Types.ClaggMain.Deposit.name,
            Types.ClaggMain.Withdraw.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=324)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: 
          HyperSync({endpointUrl: "https://324.hypersync.xyz"})
,
        startBlock: 9767,
        contracts
      }
    )
  },
])

@genType
let getGeneratedByChainId: int => configYaml = chainId => {
  let chain = ChainMap.Chain.makeUnsafe(~chainId)
  if !(publicConfig->ChainMap.has(chain)) {
    Js.Exn.raiseError(
      "No chain with id " ++ chain->ChainMap.Chain.toString ++ " found in config.yaml",
    )
  }
  publicConfig->ChainMap.get(chain)
}
