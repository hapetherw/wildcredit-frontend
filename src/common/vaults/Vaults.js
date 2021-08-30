import { Vault } from "./Vault"
import { VaultFactory } from "../contracts/VaultFactoryContract"

export class Vaults {
    constructor() {
        this.vaults = []
        this.vaultFactory = new VaultFactory()
    }

    find(address) {
        return this.vaults.find(vault => vault.contract.address === address)
    }

    async refresh(accountAddress) {
        const vaults = await this.vaultFactory.createdVaults()
        this.vaults = vaults.map(vault => new Vault(vault.vaultAddress, vault.token))

        await Promise.all(this.vaults.map(
            vault => vault.refresh(accountAddress)
        ))
    }
}
