const {
	default: SpeculosHttpTransport,
} = require("@ledgerhq/hw-transport-node-speculos-http");
const { ErgoLedgerApp } = require("ledger-ergo-js");
const {
	ErgoAddress,
	TransactionBuilder,
	OutputBuilder,
	SAFE_MIN_BOX_VALUE,
} = require("@fleet-sdk/core");
const { base58, hex } = require("@fleet-sdk/crypto");
const { mockUTxO } = require("@fleet-sdk/mock-chain");
const { mapTx } = require("./tx-mapper");

const KEY_PATH = "44'/429'/0'/0/0";

(async () => {
	const transport = await SpeculosHttpTransport.open({
		baseURL: "http://127.0.0.1:5000",
	});
	const app = new ErgoLedgerApp(transport).useAuthToken(false);

	// key derivation
	const address = await run("deriveAddress", async () => {
		const { addressHex } = await app.deriveAddress(KEY_PATH);
		return base58.encode(hex.decode(addressHex));
	});

	// sign
	const unsignedTx = buildTransaction(address);
	await run("signTx", () => app.signTx(mapTx(unsignedTx, address, KEY_PATH)));
})().then(() => process.exit(0));

async function run(name, fn) {
	console.group(name);
	const r = await fn();
	console.log(r);
	console.groupEnd(name);

	return r;
}

function buildTransaction(address) {
	return new TransactionBuilder(100)
		.from(
			// mocks a UTXO with 10 ERG protected by the given address
			mockUTxO({
				value: 10_000000000n,
				ergoTree: ErgoAddress.decode(address).ergoTree,
			}),
		)
		.to([
			new OutputBuilder(
				SAFE_MIN_BOX_VALUE,
				"9hq9HfNKnK1GYHo8fobgDanuMMDnawB9BPw5tWTga3H91tpnTga",
			),
			new OutputBuilder(
				SAFE_MIN_BOX_VALUE * 2n,
				"9gtRJdRnXUSaEDsQjxnPCnb57qhbBKtjjH1uiZDErkQ8zg9iAHw",
			),
		])
		.payMinFee()
		.sendChangeTo(address)
		.build()
		.toEIP12Object();
}
