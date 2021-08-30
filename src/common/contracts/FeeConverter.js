import FeeConverterAbi from "../abis/FeeConverter.json";
import Addresses from '../contracts/Addresses.json'
import {web3Modal} from "../web3/Wallet";
import { BigNumber } from 'bignumber.js';

export class FeeConverter {

    constructor() {
        this.abi = FeeConverterAbi
        this.address = Addresses.feeRecipient

        this.annualWildRewards = new BigNumber(NaN)
    }

    async refresh() {
        if (this.address !== "0x0000000000000000000000000000000000000000") {
            let contract = new web3Modal.eth.Contract(this.abi, this.address)
            let currentBlock = await web3Modal.eth.getBlockNumber()
            let fromBlock = currentBlock - Math.ceil(24 * 3600 / 13.2 * 2)
            let events = await contract.getPastEvents('FeeDistribution', {
                fromBlock: fromBlock,
                toBlock: currentBlock
            })

            // Temporarily hardcoded based on the last day distributions
            // https://etherscan.io/tx/0x2e6f4dc11119eb5e498b91684c60bdf8135811c947d2f396c5005e55418fd1af
            // Plan to fix this before July 29 UTC after the new converter is deployed
            // this.annualWildRewards = new BigNumber(4200 / 2 * 365)

            this.annualWildRewards =
                events
                    .map(e => new BigNumber(e.returnValues.amount))
                    .concat([new BigNumber(0)])
                    .reduce((a, b) => a.plus(b))
                    .dividedBy(2)
                    .multipliedBy(365)
                    .dividedBy(1e18)
        }
    }

}