import BigNumber from "bignumber.js"
import Addresses from "../contracts/Addresses.json";
import { LendingPairContract } from "../contracts/LendingPairContract";
import { PriceOracleContract } from "../contracts/PriceOracleContract"
import { Erc20Token } from "../contracts/Erc20Token";
import { VaultContract } from "../contracts/Vault"
import { web3Modal } from "../web3/Wallet"

export class Vault {

    constructor(address, token) {
        this.address = address
        this.contract = new VaultContract(address)
        this.priceOracle = new PriceOracleContract()
        this.token = token

        this.apr = new BigNumber(NaN)
        this.walletBalance = new BigNumber(NaN)
        this.vaultBalance = new BigNumber(NaN)
        this.claimableBalance = new BigNumber(NaN)
        this.totalSupply = new BigNumber(NaN)
        this.reserves = new BigNumber(NaN)
    }

    async refresh(accountAddress) {

        const usdPrice = await this.priceOracle.tokenPrice(this.token.address)

        await Promise.all(
            [
                this.setWalletBalance(accountAddress),
                this.setVaultBalance(accountAddress),
                this.setClaimableBalance(accountAddress),
                this.setReserves(usdPrice),
                this.setApr()
            ]
        )
    }

    async setWalletBalance(accountAddress) {
        if (this.token.address.toLowerCase() === Addresses.weth.toLowerCase()) {
            this.walletBalance = new BigNumber(await web3Modal.eth.getBalance(accountAddress)).dividedBy(10 ** 18)
        } else {
            this.walletBalance = await this.token.balanceOf(accountAddress)
        }
    }

    async setVaultBalance(accountAddress) {
        this.vaultBalance = await this.contract.balanceOf(accountAddress)
    }

    async setClaimableBalance(accountAddress) {
        this.claimableBalance = await this.contract.pendingAccountReward(accountAddress)
    }

    async setTotalSupply() {
        this.totalSupply = await this.contract.totalSupply()
    }

    async setReserves(usdPrice) {
        const totalSupply = await this.contract.totalSupply()
        this.reserves = new BigNumber(usdPrice).multipliedBy(totalSupply)
    }

    async setApr() {
        const rewardRate = await this.contract.rewardRate()
        const annualReward = new BigNumber(rewardRate).dividedBy(13.2).multipliedBy(3600).multipliedBy(24).multipliedBy(365)
        this.totalSupply = await this.contract.totalSupply()
        this.apr = new BigNumber(annualReward).dividedBy(this.totalSupply).multipliedBy(100)

        let pair = new LendingPairContract(Addresses.vaultPair)
        let token = new Erc20Token(Addresses.weth)
        this.projectedApr = await pair.supplyRate(token)
    }
}
