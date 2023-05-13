const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const walletsSchema = mongoose.Schema(
  {
    address: { type: String, index: true, required: true },
    
    checkedAt: { type: Date, index: true, default: null },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
walletsSchema.plugin(toJSON);

const Wallets = mongoose.model('Wallets', walletsSchema);

module.exports = { Wallets, walletsSchema };
