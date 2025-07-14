## ZamnaSec Protocol

**Itzamna** or **Zamna** is the Mayan god of the creation, and is considered the protector of science and culture, which is why we chose to call the protocol ZamnaSec.

**ZamnaSec** is an on-chain firewall that enables users and protocols to create and deploy invariant rules protecting their smart contracts and automatically reverting hacks on blockchain protocols or Smart contract wallets, it uses invariant rules and blockchain atomicity to prevent hacks on other protocols on the blockchain.

To implement the _ZamnaSec firewall_, the users/protocols have to implement the `IzamnaInvariantsEnforcer` interface in their contracts. Using this interface, the protocol's contract should call the correct `Enforce_Invariant_*` functions, sending the Invariant ID and the value to validate, so the rules defined in the zamnaSec platform can be enforced.

Example of use:

After the Protocol with or without security experts identifies their invariant rules, they can create a foundry script that can do the following tasks in one transaction:

1.  Deploy the invariant contracts for the protocol.
2.  Create the invariant rules.
3.  Deploy the protocol's contracts with the call to the IzamnaInvariantEnforcer Interface.
4.  After the script finishes, all his Smart Contracts are protected from deployment.

#

## Deployment Addresses

Contracts deployed to Arbitrum Sepolia:

**MxnB:** 0x82B9e52b26A2954E113F94Ff26647754d5a4247D - Bitso Pesos for Paying fees.

**Fees Vault:** 0xD413911aEd4917224FA4Dd007d4Fe3d51FfF372e - Save Fees.

**Zamna Factory:** 0x87c477d181Ab3133810dfca3B5D0c99bE7d2D64C - Factory Contract.

**Zamna Invariant Enforcer:** 0x12B2F88f9F9830566dcbDe528a121c9830927A5E - Invariants Contract Deployed by User.

**Vault_ProtocolX:** 0xA679D4A6559f08f17F26A5517FB688b6dB534F63 - Vault only for testing.

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

##### arbitrum-sepolia

✅ [Success] Hash: 0xcdff3e86f405462fbf26eb4a461cec16663f829eaaebfc256079c4b3282a9d70
Contract Address: 0xD413911aEd4917224FA4Dd007d4Fe3d51FfF372e
Block: 172969453
Paid: 0.0000398441 ETH (398441 gas \* 0.1 gwei)

##### arbitrum-sepolia

✅ [Success] Hash: 0xb99e597bc775af53ac940a3e23eef3afc1811040f887c3ff6cf5d10007e82575
Contract Address: 0x87c477d181Ab3133810dfca3B5D0c99bE7d2D64C
Block: 172969458
Paid: 0.000497378 ETH (4973780 gas \* 0.1 gwei)

##### arbitrum-sepolia

✅ [Success] Hash: 0x7a1d821aa74fe0e7a7156963145216b618933b3e2717d2214c718c9f64685b4b
Block: 172969464
Paid: 0.000004836 ETH (48360 gas \* 0.1 gwei)

##### arbitrum-sepolia

✅ [Success] Hash: 0x78b79ad8d36771111bb1b8f8601cc042029e2e830c67d6ba76d1f025e08c916d
Block: 172969469
Paid: 0.000347067 ETH (3470670 gas \* 0.1 gwei)

##### arbitrum-sepolia

✅ [Success] Hash: 0xacc373a0bcf0a5667e3a419b6a20171700682a0c69cef7913815fa419a261161
Contract Address: 0xA679D4A6559f08f17F26A5517FB688b6dB534F63
Block: 172969474
Paid: 0.0000820857 ETH (820857 gas \* 0.1 gwei)

##### arbitrum-sepolia

✅ [Success] Hash: 0x663265801f4c658c95bfafb7753310eb7c75365337f9bc5fd526969f3c2a2956
Block: 172969479
Paid: 0.0000062429 ETH (62429 gas \* 0.1 gwei)

✅ Sequence #1 on arbitrum-sepolia | Total Paid: 0.0009774537 ETH (9774537 gas \* avg 0.1 gwei)
