import { LendingPair } from "./LendingPair";
import Addresses from '../contracts/Addresses.json'
import { PoolFactory } from "../contracts/PoolFactory";

export class LendingPairs {

    constructor() {
        this.pairs = []
        this.poolFactory = new PoolFactory()
    }

    find(address) {
        return this.pairs.find(p => p.contract.address === address)
    }

    async refresh(accountAddress, tokenList) {

        let pairs = await this.poolFactory.createdPairs()
        this.pairs =
            pairs.map(p => new LendingPair(p, Addresses.pairFactory))

        await Promise.all(
            this.pairs.map(pair => pair.refresh(accountAddress, tokenList))
        )

    }

}
