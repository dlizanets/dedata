const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const eventsSchema = mongoose.Schema(
  {
    chainId: { type: String, index: true, required: true },    
    address: { type: String, index: true, required: true },
    blockNumber: { type: Number, index: true, required: true }, 
    logIndex: { type: Number, index: true, required: true },
    transactionHash: { type: String, index: true, required: true },
    //from: { type: String, index: true, required: true },
    raw: {},
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
eventsSchema.plugin(toJSON);

const Events = mongoose.model('Events', eventsSchema);

module.exports = { Events, eventsSchema };
