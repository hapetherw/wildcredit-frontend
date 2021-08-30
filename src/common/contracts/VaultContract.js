import { web3Modal } from "../web3/Wallet";
import VaultAbi from "../abis/Vault.json";
import Addresses from "../contracts/Addresses.json";
import BigNumber from "bignumber.js";

export class VaultContract {

    constructor(address, token) {
        this.address = address
        this.abi = VaultAbi
        this.token = token
    }

    get contract() {
        return new web3Modal.eth.Contract(this.abi, this.address)
    }

    async balanceOf(accountAddress) {
        return new BigNumber(await this.contract.methods.balanceOf(accountAddress).call()).dividedBy(10 ** this.token.decimals)
    }

    async totalSupply() {
        const totalSupply = await this.contract.methods.totalSupply().call()
        return new BigNumber(totalSupply).dividedBy(10 ** this.token.decimals)
    }
 
    async deposit(amount, accountAddress) {
        if (this.token.address.toLowerCase() === Addresses.weth.toLowerCase()) {
            await this.contract.methods
                .depositETH(accountAddress)
                .send({ from: accountAddress, value: this.toWei(amount) })
        } else {
            await token.approveIfNot(this.address, accountAddress, amount)
        
            await this.contract.methods
                .deposit(this.toWei(amount))
                .send({ from: accountAddress })
        }
    }

    async withdraw(amount, accountAddress) {
        if (this.token.address.toLowerCase() === Addresses.weth.toLowerCase()) {
            await this.contract.methods
                .withdrawETH(this.toWei(amount))
                .send({ from: accountAddress })
        } else {
            await this.contract.methods
                .withdraw(this.toWei(amount))
                .send({ from: accountAddress })
        }
    }

    async claim(accountAddress) {
        await this.contract.methods
            .claim(accountAddress)
            .send({ from: accountAddress })
    }

    async pendingAccountReward(accountAddress) {
        return new BigNumber(await this.contract.methods.pendingAccountReward(accountAddress).call()).dividedBy(10 ** 18)
    }

    async rewardRate() {
        const rewardRate = await this.contract.methods.rewardRate().call()
        return new BigNumber(rewardRate).dividedBy(10 ** 18)
    }

    toWei(value, decimals = 18) {
        return value.multipliedBy(10 ** decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)
    }
}