import { BigNumber } from 'bignumber.js';
import Erc20Abi from '../abis/Erc20.json'
import { web3Modal } from "../web3/Wallet";
import Addresses from "./Addresses.json";

export class Erc20Token {

    constructor(address, symbol = undefined, decimals = NaN) {
        this.address = address
        this.symbol = symbol
        this.decimals = decimals
    }

    displaySymbol() {
        if (this.symbol === "WETH") {
            return "ETH"
        }
        return this.symbol
    }

    async init() {
        let contract = new web3Modal.eth.Contract(Erc20Abi, this.address)

        if (this.address == '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2') {
            this.symbol = 'MKR'
        } else {
            this.symbol = await contract.methods.symbol().call()
        }
        this.decimals = await contract.methods.decimals().call()
    }

    static convertToETHIfNeeded(token) {
        if (token.symbol !== "WETH") {
            return new Erc20Token(token.address, token.symbol, token.decimals)
        } else {
            return new Erc20Token(Addresses.eth.toLowerCase(), "ETH", 18)
        }
    }

    static getConvertedToken(token, amount) {
        if (token.symbol !== "ETH") {
            return {
                address: token.address,
                symbol: token.symbol,
                decimals: token.decimals,
                amount: amount.multipliedBy(10 ** token.decimals).integerValue(BigNumber.ROUND_DOWN),
                value: new BigNumber(0)
            }
        } else {
            return {
                address: Addresses.weth.toLowerCase(),
                symbol: "WETH",
                decimals: token.decimals,
                amount: new BigNumber(0),
                value: amount.multipliedBy(10 ** token.decimals).integerValue(BigNumber.ROUND_DOWN)
            }
        }
    }

    async supply() {
        let contract = new web3Modal.eth.Contract(Erc20Abi, this.address)
        return new BigNumber(await contract.methods.totalSupply().call()).dividedBy(10**this.decimals)
    }

    async approveIfNot(spenderAddress, ownerAddress, amount) {
        if (this.symbol !== "ETH" && amount.isGreaterThan(0)) {
            let isAllowed =
                await this.allowed(
                    ownerAddress,
                    spenderAddress,
                    `${amount.multipliedBy(10**this.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)}`
                )
            if(!isAllowed) {
                await this.approve(spenderAddress, ownerAddress)
            }
        }
    }

    async approve(spenderAddress, ownerAddress) {
        let contract = new web3Modal.eth.Contract(Erc20Abi, this.address)
        await contract.methods.approve(spenderAddress, "10000000000000000000000000000").send({ from:  ownerAddress})
    }

    async allowed(ownerAddress, spenderAddress, amount) {
        let contract = new web3Modal.eth.Contract(Erc20Abi, this.address)
        let allowance = await contract.methods.allowance(ownerAddress, spenderAddress).call()

        return parseInt(allowance) >= parseInt(amount)
    }

    async balanceOf(address) {
        if (this.address === Addresses.eth.toLowerCase()) {
            return new BigNumber(await web3Modal.eth.getBalance()).dividedBy(10 ** this.decimals)
        } else {
            let contract = new web3Modal.eth.Contract(Erc20Abi, this.address)
            return new BigNumber(await contract.methods.balanceOf(address).call()).dividedBy(10**this.decimals)
        }
    }

}
