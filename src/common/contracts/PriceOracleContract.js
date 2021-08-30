import Addresses from "./Addresses.json"
import priceOracleAbi from '../abis/PriceOracle.json'
import {web3Modal} from "../web3/Wallet";
import BigNumber from "bignumber.js";

export class PriceOracleContract {

    constructor() {
        this.address = Addresses.priceOracle
        this.abi = priceOracleAbi
    }

    async isTokenSupported(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return await contract.methods.tokenSupported(token.address).call()
    }

    async tokenPrice(addressAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let price = await contract.methods.tokenPrice(addressAddress).call()

        return new BigNumber(price).dividedBy(10 ** 18)
    }

}