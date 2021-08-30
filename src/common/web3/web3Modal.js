import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export let web3ModalProvider = undefined

export async function connectToWallet() {
    web3ModalProvider = await web3Modal.connect();
    return new Web3(web3ModalProvider);
}

export function clearWalletProvider() {
    web3Modal.clearCachedProvider();
}

const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            infuraId: "2aa88b78ae9449b293517159c0d93cfe",
        }
    }
};

const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions
});
