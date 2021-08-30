import { Erc20Token } from "../contracts/Erc20Token";
import { FarmingPoolContract } from "../contracts/FarmingPoolContract";
import { BigNumber } from "bignumber.js";
import { uniswapEthPrice, uniswapWildEthPrice } from "../helpers/UniswapTokenPrice";
import Addresses from '../contracts/Addresses.json'

export class FarmingToken extends Erc20Token {

    constructor(token, url) {
        super(token.address, token.symbol, token.decimals)
        this.farm = new FarmingPoolContract()
        this.url = url

        this.tokenLpAddress = token.address
        this.tokenStakingPoolId = NaN
        this.baseSupplied = new BigNumber(NaN)
        this.priceInEth = new BigNumber(NaN)
        this.totalStake = new BigNumber(NaN)
        this.poolWildAnnual = new BigNumber(NaN)
        this.apr = new BigNumber(NaN)
        this.claimAmount = new BigNumber(NaN)
        this.userInfo = undefined
    }

    async refresh(accountAddress) {

        let wildEthPrice = await uniswapWildEthPrice()

        await Promise.all(
            [
                this.setSupplied(accountAddress),
                this.setStakingPoolId(this.address, accountAddress),
                this.setTotalStake(this.address),
                this.setPoolWildAnnual(this.address),
                this.setPriceInEth()
            ]
        )

        this.apr = this.calculateApr(wildEthPrice)
    }

    async setSupplied(accountAddress) {
        this.baseSupplied = await this.balanceOf(accountAddress)
    }

    async setPriceInEth() {
        let weth = new Erc20Token(Addresses.weth, "WETH", 18)

        let pairReserve = (await weth.balanceOf(this.address)).multipliedBy(2)
        let pairTotalSupply = await this.supply()

        this.priceInEth = pairReserve.dividedBy(pairTotalSupply)
    }

    async setStakingPoolId(lpAddress, accountAddress) {
        if (this.farm.address !== "0x0000000000000000000000000000000000000000") {
            this.tokenStakingPoolId = await this.farm.getTokenPoolId(lpAddress)
            if (!isNaN(this.tokenStakingPoolId)) {
                await Promise.all([
                    this.setClaimAmount(this.tokenStakingPoolId, accountAddress),
                    this.setUserInfo(this.tokenStakingPoolId, accountAddress),
                ])
            }
        }
    }

    async setTotalStake(lpAddress) {
        if (this.farm.address !== "0x0000000000000000000000000000000000000000") {
            this.totalStake = await this.farm.poolStakedAmount(lpAddress, this.decimals)
        }
    }

    async setPoolWildAnnual(lpAddress) {
        if (this.farm.address !== "0x0000000000000000000000000000000000000000") {
            this.poolWildAnnual = await this.farm.poolWildAnnual(lpAddress)
        }
    }

    async setClaimAmount(poolId, accountAddress) {
        if (this.farm.address !== "0x0000000000000000000000000000000000000000") {
            this.claimAmount = await this.farm.pendingRewards(this.tokenStakingPoolId, accountAddress)
        }
    }

    async setUserInfo(poolId, accountAddress) {
        if (this.farm.address !== "0x0000000000000000000000000000000000000000") {
            this.userInfo = await this.farm.userInfo(this.tokenStakingPoolId, accountAddress)
        }
    }

    calculateApr(wildEthPrice) {
        let ethReward = wildEthPrice.multipliedBy(this.poolWildAnnual)
        let tokenEthSuppliedValue = this.priceInEth.multipliedBy(this.totalStake)

        return ethReward.multipliedBy(100).dividedBy(tokenEthSuppliedValue)
    }

}