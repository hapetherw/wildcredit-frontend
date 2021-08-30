import Abi from '../abis/Controller.json'
import Addresses from './Addresses.json'
import {web3Modal} from "../web3/Wallet";
import { BigNumber } from 'bignumber.js';

export class Controller {

    constructor() {}

    static async collateralFactor(token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.controller)
        let factor = new BigNumber(await contract.methods.colFactor(token.address).call())

        return factor.dividedBy(100e18)
    }

    static async depositCap(pair, token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.controller)
        let limit = new BigNumber(await contract.methods.depositLimit(pair.address, token.address).call())

        return limit.dividedBy(10 ** token.decimals)
    }

    static async borrowCap(pair, token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.controller)
        let limit = new BigNumber(await contract.methods.borrowLimit(pair.address, token.address).call())

        return limit.dividedBy(10 ** token.decimals)
    }

}