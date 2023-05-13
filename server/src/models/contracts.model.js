const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const contractsSchema = mongoose.Schema(
  {
    address: { type: String, index: true, required: true },
    chainId: { type: String, index: true, required: true },
    lastBlockNumber: { type: Number, required: true }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
contractsSchema.plugin(toJSON);

const Contracts = mongoose.model('Contracts', contractsSchema);

module.exports = { Contracts, contractsSchema };
