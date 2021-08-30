import {web3Modal} from "../web3/Wallet";
import {Erc20Token} from "./Erc20Token";
import XwildAbi from '../abis/Xwild.json'
import Addresses from "../contracts/Addresses.json";
import {BigNumber} from "bignumber.js";

export class StakingContract {

    constructor() {
        this.wildToken = new Erc20Token(Addresses.wild, "WILD", 18)
        this.xWildToken = new Erc20Token(Addresses.xWild, "XWILD", 18)

        this.xWildUserBalance = new BigNumber(NaN)
        this.wildUserBalance = new BigNumber(NaN)

        this.abi = XwildAbi

        this.stakedWildBalance = new BigNumber(NaN)
        this.xWildContactWildBalance = new BigNumber(NaN)
    }

    async refresh(accountAddress) {
        if (this.xWildToken.address !== "0x0000000000000000000000000000000000000000" &&
            this.wildToken.address !== "0x0000000000000000000000000000000000000000"
        )
        {
            this.xWildUserBalance = await this.xWildToken.balanceOf(accountAddress)
            this.wildUserBalance = await this.wildToken.balanceOf(accountAddress)
            this.xWildContactWildBalance = await this.wildToken.balanceOf(this.xWildToken.address)

            this.stakedWildBalance =
                this.xWildUserBalance
                    .multipliedBy(this.xWildContactWildBalance)
                    .dividedBy(await this.xWildToken.supply())
        }
    }

    async deposit(amount, accountAddress) {

        await this.wildToken.approveIfNot(this.xWildToken.address, accountAddress, amount)

        let contract = new web3Modal.eth.Contract(this.abi, this.xWildToken.address)
        await contract.methods
            .deposit(`${amount.multipliedBy(10**this.wildToken.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)}`)
            .send({from: accountAddress})
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

    async withdraw(share, accountAddress) {

        await this.xWildToken.approveIfNot(this.xWildToken.address, accountAddress, share)

        let contract = new web3Modal.eth.Contract(this.abi, this.xWildToken.address)
        await contract.methods
            .withdraw(`${share.multipliedBy(10**this.xWildToken.decimals).integerValue(BigNumber.ROUND_DOWN).toString(10)}`)
            .send({from: accountAddress})
            .on('confirmation', function(confirmationNumber, receipt){
                // TODO
            })
            .on('error', function(error, receipt) {
                // TODO
            });
    }

}