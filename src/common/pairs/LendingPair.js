import { LendingPairContract } from "../contracts/LendingPairContract";
import { LendingPairToken } from "./LendingPairToken";
import {BigNumber} from "bignumber.js";

export class LendingPair {

    constructor(pair) {
        this.contract = new LendingPairContract(pair.address)
        this.tokenA = new LendingPairToken(pair.tokenA, pair.address)
        this.tokenB = new LendingPairToken(pair.tokenB, pair.address)

        this.tokenABorrowLimit = new BigNumber(NaN)
        this.tokenBBorrowLimit = new BigNumber(NaN)

        this.usdDebt = new BigNumber(NaN)
        this.safetyRatio = new BigNumber(NaN)
        this.usdSupplied = new BigNumber(NaN)
        this.usdReserve = new BigNumber(NaN)
        this.conversionRatio = new BigNumber(NaN)
    }

    static async buildPairFromAddress(pairAddress) {
        let contract = new LendingPairContract(pairAddress)
        let tokenA = await contract.tokenA()
        let tokenB = await contract.tokenB()

        return new LendingPair({
            address: pairAddress,
            tokenA: tokenA,
            tokenB: tokenB
        })
    }

    async refresh(accountAddress, tokenList) {

        await Promise.all(
            [
                this.tokenA.refresh(accountAddress, tokenList),
                this.tokenB.refresh(accountAddress, tokenList),
                this.setSafetyRatio(accountAddress)
            ]
        )

        await Promise.all(
            [
                await this.setTokenABorrowLimit(),
                await this.setTokenBBorrowLimit(),
                await this.setConversionRatio()
            ]
        )

        this.usdSupplied = this.tokenA.usdSupplied.plus(this.tokenB.usdSupplied)
        this.usdReserve = this.tokenA.usdReserve.plus(this.tokenB.usdReserve)
        this.usdTotalSupply = this.tokenA.usdTotalSupply.plus(this.tokenB.usdTotalSupply)
        this.usdTotalDebt = this.tokenA.usdTotalDebt.plus(this.tokenB.usdTotalDebt)
        this.usdDebt = this.tokenA.usdDebt.plus(this.tokenB.usdDebt)
    }

    async setTokenABorrowLimit() {
        this.tokenABorrowLimit = await this.borrowLimit(
            this.tokenB,
            this.tokenA,
            this.tokenB.lpBalance
        )
    }

    async setTokenBBorrowLimit() {
        this.tokenBBorrowLimit = await this.borrowLimit(
            this.tokenA,
            this.tokenB,
            this.tokenA.lpBalance
        )
    }

    async borrowLimit(suppliedToken, borrowedToken, amount) {
        let effectiveAmount = amount.multipliedBy(suppliedToken.collateralFactor)
        let conversion = await this.contract.convertTokenValues(suppliedToken, borrowedToken, effectiveAmount)
        return conversion.dividedBy(1.25)
    }

    async setSafetyRatio(accountAddress) {
        this.safetyRatio = new BigNumber(await this.contract.safetyRatio(accountAddress))
    }

    async setConversionRatio() {
        let aAmount = new BigNumber(1000)
        let bAmount = await this.contract.convertTokenValues(this.tokenA, this.tokenB, aAmount)
        this.conversionRatio = aAmount.dividedBy(bAmount)
    }

    simulateSafetyRate(aAmountDelta, bAmountDelta, isDeposit) {

        let totalAccountSupplyA  = this.tokenA.supplied
        let totalAccountSupplyB  = this.tokenB.supplied
        let totalAccountBorrow  = this.tokenA.debt.plus(this.tokenB.debt.multipliedBy(this.conversionRatio))

        if (isDeposit) {

            let aReimburse = BigNumber.min(aAmountDelta, this.tokenA.debt)
            let bReimburse = BigNumber.min(bAmountDelta, this.tokenB.debt)
            let aDeposit = aAmountDelta.minus(aReimburse)
            let bDeposit = bAmountDelta.minus(bReimburse)

            totalAccountSupplyA = totalAccountSupplyA.plus(aDeposit)
            totalAccountSupplyB = totalAccountSupplyB.plus(bDeposit)

            totalAccountBorrow =
                totalAccountBorrow
                    .minus(aReimburse)
                    .minus(bReimburse.multipliedBy(this.conversionRatio))

        } else {

            let aWithdraw =  BigNumber.min(aAmountDelta, this.tokenA.supplied)
            let bWithdraw =  BigNumber.min(bAmountDelta, this.tokenB.supplied)
            let aBorrow =  aAmountDelta.minus(aWithdraw)
            let bBorrow =  bAmountDelta.minus(bWithdraw)

            totalAccountSupplyA = totalAccountSupplyA.minus(aWithdraw)
            totalAccountSupplyB = totalAccountSupplyB.minus(bWithdraw)

            totalAccountBorrow =
                totalAccountBorrow
                    .plus(aBorrow)
                    .plus(bBorrow.multipliedBy(this.conversionRatio))
        }

        if (totalAccountBorrow.isEqualTo(0)) {
            return new BigNumber(1.0)
        } else {
            return totalAccountSupplyA
                    .multipliedBy(this.tokenA.collateralFactor)
                    .plus(
                        totalAccountSupplyB
                            .multipliedBy(this.tokenB.collateralFactor)
                            .multipliedBy(this.conversionRatio)
                    )
                    .dividedBy(totalAccountBorrow);
        }
    }

}
