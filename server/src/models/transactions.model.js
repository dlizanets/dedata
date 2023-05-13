const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const transactionsSchema = mongoose.Schema(
  {
    chainId: { type: String, index: true, required: true },    
    transactionHash: { type: String, index: true, required: true },
    from: { type: String, index: true }, 
    to: { type: String, index: true }, 
    checked: { type: Boolean, index: true, default: true }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
transactionsSchema.plugin(toJSON);

const Transactions = mongoose.model('Transactions', transactionsSchema);

module.exports = { Transactions, transactionsSchema };
