## ZamnaSec Protocol

**Itzamna** or **Zamna** is the Mayan god of the creation, and is considered the protector of science and culture, which is why we chose to call the protocol ZamnaSec.

**ZamnaSec** is an on-chain firewall that enables users and protocols to create and deploy invariant rules protecting their smart contracts and automatically reverting hacks on blockchain protocols or Smart contract wallets, it uses invariant rules and blockchain atomicity to prevent hacks on other protocols on the blockchain.

To implement the _ZamnaSec firewall_, the users/protocols have to implement the `IzamnaInvariantsEnforcer` interface in their contracts. Using this interface, the protocol's contract should call the correct `Enforce_Invariant_*` functions, sending the Invariant ID and the value to validate, so the rules defined in the zamnaSec platform can be enforced.

Right now, the protocol can only be used in new deployments or in protocols that have upgradeable smart contracts through an upgrade that calls these invariant rules.

Example of use:

After the Protocol with or without security experts identifies their invariant rules, they can create a foundry script that can do the following tasks in one transaction:

1.  Deploy the invariant contracts for the protocol.
2.  Deploy the contracts of their protocol.
3.  Configure its invariant rules by calling the invariants enforcer contract (IzamnaInvariantEnforcer interface).
4.  After the script finishes, all his Smart Contracts are protected from deployment.

#

## Deployment Addresses

Contracts deployed to Mantle tesnet:

**ZamnaUSD:** 0x1Cbb54E74dc1Ad1dE064DFe0Dd7a3160f00c1c11 (Pay fees on testing)

**Fees Vault:** 0x731ff72Ca6D46214177Ed95A068320467A2A9c42 (save testing fees)

**Zamna Factory:** 0x002c970f848662d3dd14711301839e2637daa383

**Zamna Invariant Enforcer:** (Deployed by user on the Dapp)

**Vault_ProtocolX:** (only for testing). 0xC142a813B5f20a1031449E8bb0A776EFeE722F8A

#

## Testing

**To test locally:**

1. First Deploy the ZamnaUSD and the FeeVault contracts.
2. Then deploy the ZamnaFactory contract and update the address of the contract in the Dashboard/page.tsx code.
3. Whitelist your address in the zamnaFactory contract to be an allowed deployer (Function: allowInvariantsDeployer).
4. Get some ZamnaUSD tokens and sent them to the contract that will be the asker of the invariant rules.
5. Run the Dapp locally and connect to it.
6. Deploy an invariant contract using the Dapp.
7. Create some invariants for the asker contract.
8. Now you can create a test o run a test from the mantle explorer that tries to break the invariant.

**To test the protocol follow the next steps:**

1. First send me a DM to whitelist your address in the Zamna Factory contract so you can Deploy an Invariant contract.
2. Get tokens from the ZamnaUSD test tokens (DM me so I can send you tokens).
3. Sent the test tokens to the asker contract for which you're creating the invariants. This tokens are needed to pay the fees the protocol charge for every invariant call.
4. Run the Dapp and connect to it with your whitelisted wallet.
5. Deploy an invariant contract using the Dapp.
6. Create some invariants for the asker contract in the Dapp.
7. Now you can create a test o run a test from the mantle explorer that tries to break the invariant.

#

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```
