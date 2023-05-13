const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const interactionsSchema = mongoose.Schema(
  {
    chainId: { type: String, index: true, required: true },    
    address: { type: String, index: true, required: true },
    wallet: { type: String, index: true, required: true },
    transfersChecked: { type: Boolean, index: true, default: true },
    erc20Checked: { type: Boolean, index: true, default: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
interactionsSchema.plugin(toJSON);

const Interactions = mongoose.model('Interactions', interactionsSchema);

module.exports = { Interactions, interactionsSchema };
