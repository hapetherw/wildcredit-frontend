import { web3Modal } from "../web3/Wallet";
import { Erc20Token } from "./Erc20Token";
import VaultAbi from "../abis/Vault.json";
import Addresses from "../contracts/Addresses.json";
import BigNumber from "bignumber.js";

const VAULT_TYPE = {
    ETH: 'ETH',
    ERC20: 'ERC20'
}

export class VaultContract {

    constructor(address) {
        this.address = address
        this.abi = VaultAbi

        this.underlying = null
        this.vaultType = null
    }


    get contract() {
        return new web3Modal.eth.Contract(this.abi, this.address)
    }

    async getWalletBalance(accountAddress) {
        const vaultType = await this.getVaultType()
        if (vaultType === VAULT_TYPE.ETH) {
            return new BigNumber(await web3Modal.eth.getBalance(accountAddress)).dividedBy(10 ** 18)
        } else {
            const underlying = await this.getUnderlying()
            const token = new Erc20Token(underlying)
            return await token.balanceOf(accountAddress)
        }
    }

    async balanceOf(accountAddress) {
        return new BigNumber(await this.contract.methods.balanceOf(accountAddress).call()).dividedBy(10 ** 18)
    }

    async totalSupply() {
        return new BigNumber(await this.contract.methods.totalSupply().call()).dividedBy(10 ** 18)
    }

    async deposit(amount, accountAddress) {
        const vaultType = await this.getVaultType()
        if (vaultType === VAULT_TYPE.ETH) {
            await this.contract.methods
            .depositETH(accountAddress)
            .send({ from: accountAddress, value: this.toWei(amount) })
        } else {
            const token = new Erc20Token(await this.getUnderlying())
            await token.approveIfNot(this.address, accountAddress, amount)

            await this.contract.methods
                .deposit(this.toWei(amount))
                .send({ from: accountAddress })
        }

    }

    async withdraw(amount, accountAddress) {
        const vaultType = await this.getVaultType()
        let token = new Erc20Token(await this.getUnderlying())
        await token.init()

        if (vaultType === VAULT_TYPE.ETH) {
            var balance = await token.balanceOf(Addresses.ethVault)
            if(balance.gt(amount)) {
                await this.contract.methods
                    .withdrawETH(this.toWei(amount))
                    .send({ from: accountAddress })
            } else {
                await this.contract.methods
                    .withdrawFromETH(Addresses.vaultPair, this.toWei(amount))
                    .send({ from: accountAddress })
            }
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

    async underlyingBalanceOf(address) {
        const underlying = await this.getUnderlying()
        const token = new Erc20Token(underlying)
        await token.init()

        return await token.balanceOf(address)
    }

    async getUnderlying() {
        if (!this.underlying) {
            const underlying = await this.contract.methods.underlying().call()
            this.underlying = underlying
            return underlying
        }

        return this.underlying
    }

    async getVaultType() {
        if (!this.vaultType) {
            const underlying = await this.getUnderlying()
            if (underlying.toLowerCase() === Addresses.weth.toLowerCase()) {
                this.vaultType = VAULT_TYPE.ETH
            } else {
                this.vaultType = VAULT_TYPE.ERC20
            }

            return this.vaultType
        }

        return this.vaultType
    }

    toWei(value, decimals = 18) {
        return value.multipliedBy(10 ** decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)
    }
}