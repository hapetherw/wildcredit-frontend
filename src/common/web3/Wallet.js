import { clearWalletProvider, connectToWallet, web3ModalProvider } from "./web3Modal";

export let accountAddress = undefined
export let web3Modal = undefined

export async function initWallet() {
    while(web3Modal === undefined) {
        console.log("connecting wallet")
        try {
            web3Modal = await connectToWallet()
        } catch (e) {
            console.log("wallet connect error, reconnecting")
        }
    }
    await updateAccount()
}

async function updateAccount() {
    const accounts = await web3Modal.eth.getAccounts()
    updateAccountAddress(accounts)

    if (web3ModalProvider !== undefined && web3ModalProvider !== null) {
        web3ModalProvider.on("accountsChanged", (accounts) => {
            updateAccountAddress(accounts);
        });
        web3ModalProvider.on("networkChanged", (id) => {
            window.location.reload();
        });
    }
}

export function updateAccountAddress(accounts) {
    if (accounts !== undefined && accounts.length > 0) {
        accountAddress = accounts[0]
    } else if (accountAddress !== undefined){
        clearWalletProvider()
        accountAddress = undefined
    }
}
