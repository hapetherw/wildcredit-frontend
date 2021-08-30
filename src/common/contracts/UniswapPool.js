import {web3Modal} from "../web3/Wallet";
import Abi from '../abis/UniswapPool.json'
import {BigNumber} from "bignumber.js";

export class UniswapPool {

    constructor(address) {
        this.address = address
        this.abi = Abi
    }

    async getAmountOut(inAmount, inToken, outToken) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let amount = await contract.methods.getAmountOut(
            `${inAmount.multipliedBy(10 ** inToken.decimals).toString(10)}`,
            inToken.address,
            outToken.address
        ).call()

        return new BigNumber(amount).dividedBy(10 ** outToken.decimals)
    }

}