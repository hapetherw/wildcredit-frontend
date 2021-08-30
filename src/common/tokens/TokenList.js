import { BigNumber } from 'bignumber.js';
import Erc20Abi from '../abis/Erc20.json'
import { web3Modal } from "../web3/Wallet";
import Addresses from '../contracts/Addresses.json'
import EthIcon from './eth.png';

export class TokenList {

    constructor() {
        this.url = 'https://tokens.coingecko.com/uniswap/all.json'

        this.tokens = [
            {
                address: Addresses.eth.toLowerCase(),
                decimals: 18,
                symbol: 'ETH',
                logoURI: EthIcon,
                balance: new BigNumber(NaN)
            },
            {
                address: Addresses.dai.toLowerCase(),
                decimals: 18,
                symbol: "DAI",
                logoURI: "https://assets.coingecko.com/coins/images/9956/thumb/dai-multi-collateral-mcd.png",
                balance: new BigNumber(NaN)
            }
        ]
        this.tokenUpdatesRegister = []
    }

    registerForTokenUpdates(obj) {
        this.tokenUpdatesRegister.push(obj)
    }

    async updateTokenList() {
        let networkID = await web3Modal.eth.net.getId();
        if (networkID === 1) {
            try {
                await fetch(this.url, { method: 'GET' })
                    .then(r => r.json())
                    .then(json => {
                        if (json.tokens !== undefined) {
                            return Array.from(json.tokens)
                        } else {
                            return []
                        }
                    })
                    .then(at => {
                        at.forEach(t => {
                            this.addToken({
                                balance: new BigNumber(0),
                                address: t.address.toLowerCase(),
                                symbol: t.symbol,
                                decimals: t.decimals,
                                logoURI: t.logoURI
                            })
                        })
                    })
            } catch (e) {
                console.error(`Token list fetch failed, search by address can still be used ${e}`)
            }
        }
    }

    async addTokenIfNotAvailable(address, accountAddress) {
        if (!this.findTokenWithAddress(address)) {
            await this.addTokenWithAddress(address, accountAddress)
        }
    }

    findTokenWithAddress(address) {
        return this.tokens.find(t => t.address === address)
    }

    async addTokenWithAddress(address, accountAddress) {
        try {
            let token = { address: address }
            await this.refreshTokenInfo(token, accountAddress)
            this.addToken(token)

            this.tokenUpdatesRegister.forEach(obj => obj.onTokenUpdates(token))

        } catch (e) {
            console.info(`Invalid token address: ${address} ${e}`)
        }
    }

    addToken(token) {
        if (this.tokens.find(t => t.address === token.address) === undefined) {
            this.tokens.push(token)
        }
    }

    async refreshTokenInfo(token, accountAddress) {
        if (token.address === Addresses.eth.toLowerCase()) {
            token.symbol = "ETH"
            token.decimals = 18
            token.balance = new BigNumber(await web3Modal.eth.getBalance(accountAddress)).dividedBy(10**token.decimals)
        } else {
            let contract = new web3Modal.eth.Contract(Erc20Abi, token.address);
            token.symbol = await contract.methods.symbol().call().then(s => s.toUpperCase())
            token.decimals = await contract.methods.decimals().call().then(s => parseInt(s))
            token.balance = new BigNumber(await contract.methods.balanceOf(accountAddress).call()).dividedBy(10**token.decimals)
        }
    }

}