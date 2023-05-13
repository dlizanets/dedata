const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const blockSchema = mongoose.Schema(
	{
		chainId: { type: String, required: true },
		address: { type: String, required: true },
        blockNumber: { type: Number, required: true },		
	},
	{
		timestamps: true,
	}
);

// add plugin that converts mongoose to json
blockSchema.plugin(toJSON);

const LastBlock = mongoose.model("LastBlock", blockSchema);

module.exports = { LastBlock, blockSchema };
