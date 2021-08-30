import gql from 'graphql-tag'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import {BigNumber} from "bignumber.js";
import Addresses from '../contracts/Addresses.json'
import {Erc20Token} from "../contracts/Erc20Token";
import {web3Modal} from "../web3/Wallet";

export async function uniswapUsdPrice(address) {
    let tokenPriceInEth = new BigNumber(await uniswapEthPrice(address))
    let usdcPriceInEth = new BigNumber(await uniswapUsdcEthPrice())

    return tokenPriceInEth.dividedBy(usdcPriceInEth)
}

export async function uniswapUsdcEthPrice() {
    return await uniswapEthPrice("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
}

export async function uniswapEthPrice(address) {
    let headers = new Headers();
    headers.set("Content-Type", "application/json")

    let price = new BigNumber(NaN)

    let query = gql(`query { token(id: "${address}") { derivedETH } }`);

    try {
        let result = await uniswapClient.query({
            query: query,
            fetchPolicy: 'cache-first'
        })

        price = new BigNumber(result?.data?.token?.derivedETH)
    } catch (e) {
        console.warn("Failed to get token ETH price")
    }

    let network = await web3Modal.eth.getChainId()
    return network !== 1 ? new BigNumber(1) : price
}

export async function uniswapWildEthPrice() {
    let uniPair = "0xc36068bf159414beb497f8ece08763868149b2fe"
    let wild = new Erc20Token(Addresses.wild, "WILD", 18)
    let weth = new Erc20Token(Addresses.weth, "WETH", 18)

    let wethBalance = await weth.balanceOf(uniPair)
    let wildBalance = await wild.balanceOf(uniPair)

    let price = BigNumber(wethBalance).dividedBy(new BigNumber(wildBalance))

    let network = await web3Modal.eth.getChainId()
    return network !== 1 ? new BigNumber(1) : price
}

const uniswapClient = new ApolloClient({
    link: new HttpLink({
        uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
    }),
    cache: new InMemoryCache()
})