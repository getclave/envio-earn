  @genType
module ClaggMain = {
  module AdapterAdded = Types.MakeRegister(Types.ClaggMain.AdapterAdded)
  module Deposit = Types.MakeRegister(Types.ClaggMain.Deposit)
  module Withdraw = Types.MakeRegister(Types.ClaggMain.Withdraw)
}

  @genType
module ERC20 = {
  module Transfer = Types.MakeRegister(Types.ERC20.Transfer)
}

  @genType
module SyncswapMaster = {
  module RegisterPool = Types.MakeRegister(Types.SyncswapMaster.RegisterPool)
}

