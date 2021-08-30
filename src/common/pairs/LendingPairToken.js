import {
    uniswapEthPrice,
    uniswapUsdPrice, uniswapWildEthPrice, uniswapUsdcEthPrice
} from "../helpers/UniswapTokenPrice";
import { Erc20Token } from "../contracts/Erc20Token";
import { LendingPairContract } from "../contracts/LendingPairContract";
import { FarmingPoolContract } from "../contracts/FarmingPoolContract";
import { BigNumber } from "bignumber.js";
import { PriceOracleContract } from "../contracts/PriceOracleContract";
import { Controller } from "../contracts/Controller";
import { RewardDistributionContract } from "../contracts/RewardDistributionContract";

export class LendingPairToken extends Erc20Token {

    constructor(token, lendingPairAddress) {

        super(token.address, token.symbol, token.decimals)

        this.pair = new LendingPairContract(lendingPairAddress)
        this.farm = new FarmingPoolContract()
        this.priceOracle = new PriceOracleContract()

        this.reserve = new BigNumber(NaN)
        this.supplyRate = new BigNumber(NaN)
        this.borrowRate = new BigNumber(NaN)
        this.tokenLpAddress = undefined
        this.lpTotalSupply = new BigNumber(NaN)
        this.utilization = new BigNumber(NaN)
        this.lpBalance = new BigNumber(NaN)
        this.tokenStakingPoolId = NaN
        this.supplied = new BigNumber(NaN)
        this.baseSupplied = new BigNumber(NaN)
        this.debt = new BigNumber(NaN)
        this.priceInEth = new BigNumber(NaN)
        this.totalStake = new BigNumber(NaN)
        this.poolWildAnnual = new BigNumber(NaN)
        this.supplyApr = new BigNumber(NaN)
        this.borrowApr = new BigNumber(NaN)
        this.claimAmount = new BigNumber(NaN)
        this.userInfo = undefined
        this.usdOraclePrice = new BigNumber(NaN)

        this.usdSupplied = new BigNumber(NaN)
        this.usdReserve = new BigNumber(NaN)
        this.usdTotalSupply = new BigNumber(NaN)
        this.usdDebt = new BigNumber(NaN)
        this.collateralFactor = new BigNumber(NaN)
        this.totalDebt = new BigNumber(NaN)
        this.supplyBlockReward = new BigNumber(NaN)
        this.borrowBlockReward = new BigNumber(NaN)
        this.pendingTotalReward = new BigNumber(NaN)

        this.depositCapLimit = new BigNumber(NaN)
        this.borrrowCapLimit = new BigNumber(NaN)
    }

    async refresh(accountAddress, tokenList) {

        let usdPrice = await this.priceOracle.tokenPrice(this.address)
        let wildEthPrice = await uniswapWildEthPrice()

        await Promise.all(
            [
                tokenList.addTokenIfNotAvailable(this.address, accountAddress),
                this.setDepositCapLimit(),
                this.setBorrowCapLimit(),
                this.setEthUsdPrice(),
                this.setUsdOraclePrice(),
                this.setReserve(usdPrice),
                this.setTotalSupply(usdPrice),
                this.setBorrowRate(),
                this.setSupplyRate(),
                this.setSupplied(accountAddress, usdPrice),
                this.setDebt(accountAddress, usdPrice),
                this.setTokenLpAddress(accountAddress),
                this.setPriceInEth(),
                this.setCollateralFactor(),
                this.setTotalDebt(usdPrice),
                this.setBorrowBlockReward(),
                this.setSupplyBlockReward(),
                this.setPendingTotalReward(accountAddress)
            ]
        )

        this.supplyApr = await this.calculateApr(
            wildEthPrice, this.lpTotalSupply / 10 ** this.decimals * 1e18, this.supplyBlockReward
        )

        this.borrowApr = await this.calculateApr(
            wildEthPrice, this.totalDebt / 10 ** this.decimals * 1e18, this.borrowBlockReward
        )

        this.utilization = Math.round((await this.totalDebt / await this.lpTotalSupply * 100))
    }

    async setUsdOraclePrice() {
        this.usdOraclePrice = await this.priceOracle.tokenPrice(this.address)
    }

    async setEthUsdPrice() {
        this.ethUSDPrice = await uniswapUsdcEthPrice()
    }

    async setReserve(usdPrice) {
        this.reserve = await this.pair.reserve(this)
        this.usdReserve = usdPrice.multipliedBy(this.reserve)
    }

    async setTotalSupply(usdPrice) {
        let totalSupply = await this.pair.totalSupply(this)
        this.usdTotalSupply = usdPrice.multipliedBy(totalSupply)
    }

    async setSupplyRate() {
        this.supplyRate = await this.pair.supplyRate(this)
    }

    async setBorrowRate() {
        this.borrowRate = await this.pair.borrowRate(this)
    }

    async setSupplied(accountAddress, usdPrice) {
        let base = await this.pair.supplied(accountAddress, this)
        let interest = await this.pair.pendingSupplyInterest(this, accountAddress)

        this.supplied = base.plus(interest)
        this.baseSupplied = base
        this.usdSupplied = usdPrice.multipliedBy(this.supplied)
    }

    async setDebt(accountAddress, usdPrice) {
        let base = await this.pair.debt(accountAddress, this)
        let interest = await this.pair.pendingBorrowInterest(this, accountAddress)

        this.debt = base.plus(interest)
        this.usdDebt = usdPrice.multipliedBy(this.debt)
    }

    async setTokenLpAddress(accountAddress) {
        this.tokenLpAddress = await this.pair.lpTokenAddress(this)

        await Promise.all(
            [
                this.setStakingPoolId(this.tokenLpAddress, accountAddress),
                this.setTotalStake(this.tokenLpAddress),
                this.setPoolWildAnnual(this.tokenLpAddress),
                this.setLpTokenSupply(this.tokenLpAddress, accountAddress),
            ]
        )
    }

    async setLpTokenSupply(address, accountAddress) {
        let lpToken = new Erc20Token(address)
        await lpToken.init()

        this.lpTotalSupply = await lpToken.supply()
        this.lpBalance = await lpToken.balanceOf(accountAddress)
    }

    async setPriceInEth() {
        this.priceInEth = await uniswapEthPrice(this.address)
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

    async setCollateralFactor() {
        this.collateralFactor = await Controller.collateralFactor(this)
    }

    async setSupplyBlockReward() {
        this.supplyBlockReward = await RewardDistributionContract.supplyBlockReward(this.pair, this)
    }

    async setBorrowBlockReward() {
        this.borrowBlockReward = await RewardDistributionContract.borrowBlockReward(this.pair, this)
    }

    async setPendingTotalReward(accountAddress) {
        this.pendingTotalReward = await RewardDistributionContract.pendingTokenReward(
            accountAddress,
            this.pair,
            this
        )
    }

    async setTotalDebt(usdPrice) {
        let totalDebt = await this.pair.totalDebt(this)
        this.totalDebt = totalDebt
        this.usdTotalDebt = usdPrice.multipliedBy(totalDebt)
    }

    calculateApr(wildEthPrice, tokenAmount, rewardBlockRate) {

        let rewardUSD      = wildEthPrice.multipliedBy(rewardBlockRate / 13.2 * 3600 * 24 * 365).dividedBy(this.ethUSDPrice)
        let tokenAmountUSD = this.usdOraclePrice.multipliedBy(tokenAmount)

        if (tokenAmountUSD.isLessThan(1) && rewardUSD.isGreaterThan(0)) {
            return new BigNumber(999)
        }

        let apr = rewardUSD.multipliedBy(100).dividedBy(tokenAmountUSD)

        return apr.isLessThan(0) || !apr.isFinite() ? new BigNumber(0) : apr
    }

    async setDepositCapLimit() {
        this.depositCapLimit = await Controller.depositCap(this.pair, this)
    }

    async setBorrowCapLimit() {
        this.borrowCapLimit = await Controller.borrowCap(this.pair, this)
    }

}