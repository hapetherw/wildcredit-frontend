import Abi from '../abis/rewardDistribution.json'
import Addresses from './Addresses.json'
import {web3Modal} from "../web3/Wallet";
import BigNumber from "bignumber.js";

export class RewardDistributionContract {

    constructor() {}

    static async supplyBlockReward(pair, token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.rewardDistribution)

        let reward =  await contract.methods.supplyBlockReward(pair.address, token.address).call()

        return new BigNumber(reward).dividedBy(1e18)
    }

    static async borrowBlockReward(pair, token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.rewardDistribution)

        let reward =  await contract.methods.borrowBlockReward(pair.address, token.address).call()

        return new BigNumber(reward).dividedBy(1e18)
    }

    static async pendingTokenReward(accountAddress, pair, token) {
        let contract = new web3Modal.eth.Contract(Abi, Addresses.rewardDistribution)

        let reward =  await contract.methods.pendingTokenReward(accountAddress, pair.address, token.address).call()

        return new BigNumber(reward).dividedBy(1e18)
    }

}