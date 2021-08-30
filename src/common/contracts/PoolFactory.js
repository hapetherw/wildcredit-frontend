import FactoryAbi from '../abis/Factory.json'
import Addresses from '../contracts/Addresses.json'
import { web3Modal } from "../web3/Wallet";
import { Erc20Token } from "./Erc20Token";
import { BigNumber } from 'bignumber.js';
import { LendingPair } from "../pairs/LendingPair";

export class PoolFactory {

    constructor() {
        this.abi = FactoryAbi
        this.address = Addresses.pairFactory
    }

    async createPair(tokenA, tokenB, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)

        let convertedAToken = Erc20Token.getConvertedToken(tokenA, new BigNumber(0))
        let convertedBToken = Erc20Token.getConvertedToken(tokenB, new BigNumber(0))

        await this.createPairErc20(convertedAToken, convertedBToken, accountAddress)

        let newPairAddress = await contract.methods.pairByTokens(convertedAToken.address, convertedBToken.address).call()

        return   {
            address: newPairAddress,
            tokenA: convertedAToken,
            tokenB: convertedBToken
        }
    }

    async createPairErc20(tokenA, tokenB, accountAddress) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        await contract.methods
            .createPair(
                tokenA.address,
                tokenB.address
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

    async createdPairs() {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        let events = await contract.getPastEvents('PairCreated', {
            fromBlock: 0,
            toBlock: 'latest'
        })

        let pairs = events.map(e => {
            return {
                address: e.returnValues.pair,
                tokenA: {
                    address: e.returnValues.tokenA.toLowerCase()
                },
                tokenB: {
                    address: e.returnValues.tokenB.toLowerCase()
                },
            }
        })

        await Promise.all(
            pairs.map(p => this.fillPairTokenMetadata(p))
        )

        return pairs
    }

    async fillPairTokenMetadata(pair) {
        let tokenA = new Erc20Token(pair.tokenA.address)
        let tokenB = new Erc20Token(pair.tokenB.address)

        await Promise.all([
            tokenA.init(),
            tokenB.init()
        ])

        pair.tokenA.symbol = tokenA.symbol
        pair.tokenB.symbol = tokenB.symbol

        pair.tokenA.decimals = tokenA.decimals
        pair.tokenB.decimals = tokenB.decimals
    }

    async pairByTokens(tokenA, tokenB) {
        let contract = new web3Modal.eth.Contract(this.abi, this.address)
        tokenA = Erc20Token.getConvertedToken(tokenA, new BigNumber(0)).address
        tokenB = Erc20Token.getConvertedToken(tokenB, new BigNumber(0)).address
        let pairAddress = await contract.methods.pairByTokens(tokenA, tokenB).call()

        return new LendingPair({
            address: pairAddress,
            tokenA: tokenA,
            tokenB: tokenB
        })
    }
}
