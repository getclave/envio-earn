"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generated_1 = require("generated");
generated_1.ERC20.Transfer.handler(async ({ event, context }) => {
    let senderAccount = await context.Account.get(event.params.from.toString());
    if (senderAccount === undefined) {
        // create the account
        // This is likely only ever going to be the zero address in the case of the first mint
        let accountObject = {
            id: event.params.from.toString(),
            balance: 0n - event.params.value,
        };
        context.Account.set(accountObject);
    }
    else {
        // subtract the balance from the existing users balance
        let accountObject = {
            id: senderAccount.id,
            balance: senderAccount.balance - event.params.value,
        };
        context.Account.set(accountObject);
    }
    let receiverAccount = await context.Account.get(event.params.to.toString());
    if (receiverAccount === undefined) {
        // create new account
        let accountObject = {
            id: event.params.to.toString(),
            balance: event.params.value,
        };
        context.Account.set(accountObject);
    }
    else {
        // update existing account
        let accountObject = {
            id: receiverAccount.id,
            balance: receiverAccount.balance + event.params.value,
        };
        context.Account.set(accountObject);
    }
});
