const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { Contracts, LastBlock, Events, Transactions, Interactions , Wallets, History } = require('../models');
const bc = require('../config/bc')
const pick = require("../utils/pick");
const dayjs = require("dayjs");
const { utils, ethers } = require('ethers');

const getTraffic = catchAsync(async (req, res) => {
	const id = req.query.id; 

	const contract = await Contracts.findById(id)
	const chainId = contract.chainId

	const interractions = await Interactions.find({ chainId, address: contract.address })
	const totalUsers = await Interactions.countDocuments({ chainId, address: contract.address })

	const transactions = await Transactions.find({ 
		chainId, 
		from: { $in: interractions.map(i => i.wallet)},
		to: contract.address
	})
	
	res.send({ interractions, transactions, totalUsers });
});

const formatResult = async function (promotions) {
	const items = [];

	console.log('formatResult', promotions.length)

	for (let index = 0; index < promotions.length; index++) {
		const promotion = promotions[index].toJSON();
		
		const filter = {
			profileIdPointed: promotion.profileId,
			pubIdPointed: promotion.pubId,
			dataLayerIdPointed: promotion.dataLayerId
		}
		const select = [
			'rewardTireIdx', 			
			
			'profileId', 
			'pubId', 
			'dataLayerId',
			'publicationId', 
			
			'profileIdPointed', 
			'pubIdPointed', 
			'dataLayerIdPointed', 	
			'publicationIdPointed', 
			
			'rewardNum', 
			'serviceFeeNum', 
			'mirroredAt', 
			'status', 
			'rewardTireIdx'
		] 
		const mirrors = await Mirror.find(filter).select(select); 
		//console.log(mirrors)
				
		const profileWallet = (await Profile.findOne({ profileId: promotion.profileId })).toJSON();
		items.push({
			promotion,
			mirrors,
			profileWallet,	
		});
	}

	return items;
};

const getContracts = catchAsync(async (req, res) => {		
	const contracts = await Contracts.find({ })
	res.send({ contracts });
});

const addContract = catchAsync(async (req, res) => {		
	const address = utils.getAddress(req.body.address);
	const chainId = req.body.chainId

	const isAdded = await Contracts.findOne({ address, chainId })
	if (isAdded) throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Already added');

	const chain = bc.chains.find(c => c.id === chainId)
	const provider = new ethers.providers.JsonRpcProvider({ url: chain.rpc, timeout: 30000 }, 'any')
	const lastBlockNumber = await provider.getBlockNumber()
	
	await Contracts.create({ address, chainId, lastBlockNumber, startBlockNumber: lastBlockNumber })
	const contracts = await Contracts.find({ })

	res.send({ contracts });
});

const removeContract = catchAsync(async (req, res) => {		
	const id = req.body.id;
	
	const contract = await Contracts.findById(id)
	if (!contract) throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Not added');
	
	await Contracts.deleteOne({ _id: id })

	const contracts = await Contracts.find({ })

	res.send({ contracts });
});

module.exports = {
	addContract,
	getContracts,
	removeContract,
	getTraffic,
};
