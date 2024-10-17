const { ErgoBoxes, UnsignedTransaction } = require("ergo-lib-wasm-nodejs");
const {ErgoAddress} = require("@fleet-sdk/core");

function mapTx(unsignedTx, address, path) {
	const wasmTx = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
	const wasmInputs = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
	const wasmDataInputs = ErgoBoxes.from_boxes_json(unsignedTx.dataInputs);

	return {
		inputs: mapLedgerInputs(wasmTx, wasmInputs, [address], path),
		dataInputs: mapLedgerDataInputs(wasmDataInputs),
		outputs: mapLedgerOutputs(wasmTx),
		distinctTokenIds: wasmTx.distinct_token_ids(),
      changeMap: {
         address: address,
         path: path,
      }
	};
}

function mapLedgerInputs(tx, inputs, addresses, signPath) {
	const mappedInputs = [];
	for (let i = 0; i < tx.inputs().len(); i++) {
		const input = tx.inputs().get(i);
		const box = getBoxById(inputs, input.box_id().to_str());
		if (!box)
			throw Error(
				`Input ${input.box_id().to_str()} not found in unspent boxes.`,
			);

		const ergoTree = box.ergo_tree().to_base16_bytes().toString();
		const path =
			addresses.find(
				(a) => a.script === ErgoAddress.fromErgoTree(ergoTree).encode(),
			) ?? addresses[0];
		if (!path)
			throw Error(`Unable to find a sign path for ${input.box_id().to_str()}.`);

		mappedInputs.push({
			txId: box.tx_id().to_str(),
			index: box.index(),
			value: box.value().as_i64().to_str(),
			ergoTree: box.ergo_tree().sigma_serialize_bytes(),
			creationHeight: box.creation_height(),
			tokens: mapTokens(box.tokens()),
			additionalRegisters: box.serialized_additional_registers(),
			extension: input.extension().sigma_serialize_bytes(),
			signPath,
		});
	}

	return mappedInputs;
}

function mapLedgerDataInputs(dataInputs) {
	const boxIds = [];
	for (let i = 0; i < dataInputs.len(); i++) {
		boxIds.push(dataInputs.get(i).box_id().to_str());
	}

	return boxIds;
}

function mapLedgerOutputs(tx) {
	const outputs = [];
	for (let i = 0; i < tx.output_candidates().len(); i++) {
		const output = tx.output_candidates().get(i);
		outputs.push({
			value: output.value().as_i64().to_str(),
			ergoTree: output.ergo_tree().sigma_serialize_bytes(),
			creationHeight: output.creation_height(),
			tokens: mapTokens(output.tokens()),
			registers: output.serialized_additional_registers(),
		});
	}

	return outputs;
}

function getBoxById(wasmBoxes, boxId) {
	for (let i = 0; i < wasmBoxes.len(); i++) {
		if (wasmBoxes.get(i).box_id().to_str() === boxId) return wasmBoxes.get(i);
	}
}

function mapTokens(wasmTokens) {
	const tokens = [];
	for (let i = 0; i < wasmTokens.len(); i++) {
		tokens.push({
			id: wasmTokens.get(i).id().to_str(),
			amount: wasmTokens.get(i).amount().as_i64().to_str(),
		});
	}

	return tokens;
}

module.exports = { mapTx };