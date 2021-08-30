import {web3Modal} from "../web3/Wallet";
import MasterPoolAbi from "../abis/MasterPool.json";
import Addresses from '../contracts/Addresses.json'
import {Erc20Token} from "./Erc20Token";
import { BigNumber } from 'bignumber.js';

export class FarmingPoolContract {

    constructor() {
        this.abi = MasterPoolAbi
        this.address = Addresses.masterPool
    }

    async claim(pid, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        await contract.methods.deposit(`${pid}`, "0")
            .send({ from: accountAddress })
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

    async pendingRewards(pid, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.pendingRewards(`${pid}`, accountAddress).call()).dividedBy(1e18)
    }

    async poolStakedAmount(lpToken, decimals) {
        let tokenContract = new Erc20Token(lpToken, "", decimals)
        return await tokenContract.balanceOf(this.address)
    }

    async poolWildAnnual(token) {
        let rate = await this.poolRate(token)
        return rate.multipliedBy(3600 * 24 * 365)
    }

    async poolRate(token) {
        let pid = await this.getTokenPoolId(token)

        if (isNaN(pid)) {
            return new BigNumber(NaN)
        }

        let totalRate = new BigNumber(await this.totalRate())
        let poolPoints = new BigNumber(await this.getTokenPoolPoints(pid))
        let totalPoints = new BigNumber(await this.totalPoints())

        return totalRate.multipliedBy(poolPoints).dividedBy(totalPoints)
    }

    async getTokenPoolId(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let pool = await contract.methods.pidByToken(token).call()
        return pool.added ? pool.pid : NaN
    }

    async getTokenPoolPoints(pid) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let pools = await contract.methods.pools(pid).call()

        return new BigNumber(pools.points)
    }

    async totalPoints() {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.totalPoints().call())
    }

    async totalRate() {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let rate = new BigNumber(await contract.methods.totalRewardPerBlock().call())

        return rate.dividedBy(10 ** 18).dividedBy(13.13)
    }

    async stake(pid, token, amount, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let tokenContract = new Erc20Token(token.tokenLpAddress, "", 18)

        await tokenContract.approveIfNot(this.address, accountAddress, amount)

        let stakeAmount = amount.multipliedBy(10 ** token.decimals).toString(10)

        await contract.methods
            .deposit(`${pid}`, `${stakeAmount}`)
            .send({ from: accountAddress })
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

    async unStake(pid, token, amount, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        await contract.methods
            .withdraw(pid, `${amount.multipliedBy(10 ** token.decimals).toString(10)}`)
            .send({ from: accountAddress })
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

    async userInfo(pid, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return await contract.methods.userInfo(pid, accountAddress).call()
    }
}