import { web3Modal }  from '../web3/Wallet.js'
import LendingPoolAbi from "../abis/LendingPool.json";
import { BigNumber } from 'bignumber.js';
import {Erc20Token} from "./Erc20Token";

export class LendingPairContract {

    constructor(address) {
        this.abi = LendingPoolAbi
        this.address = address
    }

    async tokenA() {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let address = await contract.methods.tokenA().call()

        return await this.initToken(address)
    }

    async tokenB() {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let address = await contract.methods.tokenB().call()

        return await this.initToken(address)
    }

    async initToken(address) {
        let token = new Erc20Token(address)
        await token.init()

        return token
    }

    async reserve(token) {
        return await token.balanceOf(this.address)
    }

    async totalSupply(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let lpTokenAddress = await contract.methods.lpToken(token.address).call()
        let lpTokenContract = new Erc20Token(lpTokenAddress, undefined, token.decimals)

        return await lpTokenContract.supply()
    }

    async supplyRate(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.supplyRatePerBlock(token.address).call())
            .dividedBy(13.2)
            .multipliedBy(3600)
            .multipliedBy(24)
            .multipliedBy(365)
            .dividedBy(1e18)
    }

    async borrowRate(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.borrowRatePerBlock(token.address).call())
            .dividedBy(13.2)
            .multipliedBy(3600)
            .multipliedBy(24)
            .multipliedBy(365)
            .dividedBy(1e18)
    }

    async supplied(accountAddress, token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let lpTokenAddress = await contract.methods.lpToken(token.address).call()
        let lpTokenContract = new Erc20Token(lpTokenAddress, undefined, token.decimals)

        return await lpTokenContract.balanceOf(accountAddress)
    }

    async lpTokenAddress(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return await contract.methods.lpToken(token.address).call()
    }

    async debt(accountAddress, token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.debtOf(token.address, accountAddress).call()).dividedBy(10 ** token.decimals)
    }

    async safetyRatio(address) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        return new BigNumber(await contract.methods.accountHealth(address).call()).dividedBy(1e18)
    }

    async deposit(accountAddress, token, amount) {

        await token.approveIfNot(this.address, accountAddress, amount)

        let convertedAToken = Erc20Token.getConvertedToken(token, amount)

        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        if (token.symbol === "ETH") {
            await contract.methods
                .depositRepayETH(accountAddress)
                .send({
                    from: accountAddress,
                    value: convertedAToken.value.toString(10)
                })
                .on('confirmation', function(confirmationNumber, receipt){
                    // TODO
                })
                .on('error', function(error, receipt) {
                    // TODO
                });
        } else {
            await contract.methods
                .depositRepay(
                    accountAddress,
                    convertedAToken.address,
                    convertedAToken.amount.toString(10)
                )
                .send({
                    from: accountAddress
                })
                .on('confirmation', function(confirmationNumber, receipt){
                    // TODO
                })
                .on('error', function(error, receipt) {
                    // TODO
                });
        }


    }

    async withdraw(accountAddress, token, amount) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        if (token.symbol === "ETH") {
            await contract.methods
                .withdrawBorrowETH(`${amount.multipliedBy(10**token.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)}`)
                .send({from: accountAddress})
                .on('confirmation', function(confirmationNumber, receipt){
                    // TODO
                })
                .on('error', function(error, receipt) {
                    // TODO
                });
        } else {
            await contract.methods
                .withdrawBorrow(token.address, `${amount.multipliedBy(10**token.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)}`)
                .send({from: accountAddress})
                .on('confirmation', function(confirmationNumber, receipt){
                    // TODO
                })
                .on('error', function(error, receipt) {
                    // TODO
                });
        }
    }

    async convertTokenValues(from, to, amount) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let outAmount =
            await contract.methods
                .convertTokenValues(
                    from.address,
                    to.address,
                    amount.multipliedBy(10 ** from.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)
                ).call()


        return new BigNumber(outAmount).dividedBy(10 ** to.decimals)
    }

    async pendingSupplyInterest(token, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let outAmount =
            await contract.methods
                .pendingSupplyInterest(
                    token.address,
                    accountAddress
                ).call()

        return new BigNumber(outAmount).dividedBy(10 ** token.decimals)
    }

    async pendingBorrowInterest(token, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let outAmount =
            await contract.methods
                .pendingBorrowInterest(
                    token.address,
                    accountAddress
                ).call()

        return new BigNumber(outAmount).dividedBy(10 ** token.decimals)
    }

    async accrueAccount(accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        await contract.methods
            .accrueAccount(accountAddress)
            .send({from: accountAddress})
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

    async totalDebt(token) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let debt =
            await contract.methods
                .totalDebt(
                    token.address
                ).call()

        return new BigNumber(debt).dividedBy(10 ** token.decimals)
    }

}
