const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const historySchema = mongoose.Schema(
  {
    from: { type: String, index: true, required: true },
    to: { type: String, index: true, required: true },
    chainId: { type: String, index: true, required: true },
    txHash: { type: String, index: true, required: true },
    blockNumber: { type: String, index: true, required: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
historySchema.plugin(toJSON);

const History = mongoose.model('History', historySchema);

module.exports = { History, historySchema };
