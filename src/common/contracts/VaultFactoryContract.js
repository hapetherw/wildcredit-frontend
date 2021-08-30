import VaultFactoryAbi from '../abis/VaultFactory.json'
import Addresses from './Addresses.json'
import { web3Modal } from '../web3/Wallet'
import { Erc20Token } from './Erc20Token'

export class VaultFactory {
    constructor() {
        this.abi = VaultFactoryAbi
        this.address = Addresses.vaultFactory
    }

    get contract() {
        return new web3Modal.eth.Contract(this.abi, this.address)
    }

    async createdVaults() {
        const events = await this.contract.getPastEvents('VaultCreated', {
            fromBlock: 0,
            toBlock: 'latest'
        })

        const vaultEvents = events.map(e => ({
            vaultAddress: e.returnValues.vault,
            tokenAddress: e.returnValues.token
        }))

        const vaults = await Promise.all(vaultEvents.map(async ({ vaultAddress, tokenAddress }) => {
            const token = new Erc20Token(tokenAddress)
            await token.init()
            
            return {
                vaultAddress,
                token
            }
        }))

        return vaults
    }
}
