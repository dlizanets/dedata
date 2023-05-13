const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { Contracts, LastBlock, Events, Transactions, Interactions , Wallets, History} = require('../models');
const bc = require('../config/bc')
const pick = require("../utils/pick");
const dayjs = require("dayjs");
const { utils, ethers } = require('ethers');

const list = catchAsync(async (req, res) => {
	const mode = req.query.mode || "promoter"; // 'influencer'
	let select = req.query.select || "all"; // 'profile'
	const sortBy = req.query.sort || "createdAt:desc"; // ''
	const profileId = req.query.profileId; //'0x01a9c0' //

	const timestamp = parseInt(dayjs().valueOf() / 1000);

	const filter = {
		$and: [],
	};
	const options = pick(req.query, ["page", "limit"]);
	options.sortBy = sortBy;

	if (mode === "cmp") {
		filter.$and.push({ profileId });

		if (select === "amp") {
			//filter.$and.push({ publicationId: pubId, dataLayerId: arr[3] });
		}
	}
	if (mode === "mir") {
		if (select === "id") {
			const id = req.query.id
			if (id) {
				if (id.includes('-')) {
					filter.$and.push({ publicationId: id });
				} else {
					filter.$and.push({ uid: id });
				}
			} else {
				select = "all";
			}
		}

		if (select === "all") {
			const hubConfig = await HubConfig.findOne({ version: 1 })
			const ids = await Promotion.aggregate([
				{
					$match: {
						active: true,
						endsAt: { $gte: dayjs().toDate() },		
						profileId: { $ne: profileId }										
					},
				},
				{
					$lookup: {
						from: "profiles",
						localField: "profile",
						foreignField: "_id",
						as: "profileWallet",
					},
				},
				{
					$unwind: "$profileWallet",
				},
				{
					$addFields: {
						available: {							
							$subtract: [
								{ $toDouble: "$profileWallet.balanceNum" },
								{ $toDouble: "$profileWallet.lockedNum" },
							],
						},						
						tire: {
							$arrayElemAt: [
								"$rewardTiers",								
								0,
							],
						}
					},
				},
				{
					$addFields: {
						tireRequired: {
							$add: [
								{ $toDouble: "$tire.amountNum" },
								{ $divide: [ { $multiply: [ { $toDouble: "$tire.amountNum" }, hubConfig.serviceFee] }, 1000 ] } ,
							]
						},
						budgetLeft: {
							$cond: {
								if: { $eq: ["$budgetNum", 0] },
								then: "$available",
								else: { 
									$subtract: [
										{ $toDouble: "$budgetNum" },
										{ $add: [
											{ $toDouble: "$lockedNum" },
											{ $toDouble: "$payoutNum" },
										]},
									],
								}
							}
						},
					},
				},
				{
					$match: {
						$and: [
							{
								$expr: {
									$lte: ["$tireRequired", "$available"],
								},	
							},
							{
								$expr: {
									$lte: ["$tireRequired", "$budgetLeft"],
								},	
							},					
						]
					},
				},
				{ 
					$project: {
						_id: 1
					}
				},
			])

			filter.$and.push({
				_id: { $in: ids.map(p => p._id) },	
			})			
		}

		if (select === "mir") {	
			const mirrors = (
				await Mirror.find({ profileId }).select("promotion")
			).map((m) => m.promotion);
			filter.$and.push({				 
				_id: { $in: mirrors },
				//profileId: { $ne: profileId }
			});
		}

		if (select === "elg") {
			const profileData = (
				await lensClient.query({
					query: getProfileDataQuery,
					variables: {
						profileId,
						limit: 50,
					},
				})
			).data;
			const profile = profileData.profile;
			if (!profile) throw new ApiError(httpStatus.NOT_ACCEPTABLE, "Profile not found" );
			const profileMirrors = profileData.publications.items;			
			
			const totalPostsAndMirrors = profile.stats.totalPosts + profile.stats.totalMirrors;
			const postsToMirrorsRatio = totalPostsAndMirrors > 0 ? Math.ceil(profile.stats.totalPosts / (totalPostsAndMirrors / 100)) : 0;			
			const age = timestamp - (await lensHub.instance.mintTimestampOf(profileId));
			
			const mirroredPromotions = (await Mirror.find({ profileId }).select("promotion")).map((m) => m.promotion);
			const hubConfig = await HubConfig.findOne({ version: 1 })

			//console.log(mirroredPromotions)

			const ids = await Promotion.aggregate([
				{
					$match: {
						active: true,
						endsAt: { $gte: dayjs().toDate() },	
						profileId: { $ne: profileId },											
						_id: { $nin: mirroredPromotions },	
						"profileEligibility.minPosts": {
							$lte: profile.stats.totalPosts,
						},
						"profileEligibility.minComments": {
							$lte: profile.stats.totalComments,
						},
						"profileEligibility.minAge": { $lte: age },
						"profileEligibility.minPostsToMirrorsRatio": {
							$lte: postsToMirrorsRatio,
						},									
					},
				},
				{
					$lookup: {
						from: "profiles",
						localField: "profile",
						foreignField: "_id",
						as: "profileWallet",
					},
				},
				{
					$unwind: "$profileWallet",
				},
				{
					$addFields: {
						available: {							
							$subtract: [
								{ $toDouble: "$profileWallet.balanceNum" },
								{ $toDouble: "$profileWallet.lockedNum" },
							],
						},
						
						tire: {
							$arrayElemAt: [
								{
									$filter: {
										input: "$rewardTiers",
										as: "rt",
										cond: {
											$lte: [ "$$rt.followers", profile.stats.totalFollowers ],
										},
									},
								},
								0,
							],
						}
					},
				},
				{
					$addFields: {
						tireRequired: {
							$add: [
								{ $toDouble: "$tire.amountNum" },
								{ $divide: [ { $multiply: [ { $toDouble: "$tire.amountNum" }, hubConfig.serviceFee] }, 1000 ] },
							]
						},
						budgetLeft: {
							$cond: {
								if: { $eq: [{ $toDouble: "$budgetNum" }, 0] },
								then: "$available",
								else: { 
									$subtract: [
										{ $toDouble: "$budgetNum" },
										{ $add: [
											{ $toDouble: "$lockedNum" },
											{ $toDouble: "$payoutNum" },
										]},
									],
								}
							}
						},
					},
				},
				{
					$match: {
						tire: { $exists: true },
						$and: [
							{
								$expr: {
									$lte: ["$tireRequired", "$available"],
								},	
							},
							{
								$expr: {
									$lte: ["$tireRequired", "$budgetLeft"],
								},	
							},					
						]
					},
				},
				{ 
					$project: {
						_id: 1
					}
				},
			]);
			
			filter.$and.push({
				_id: { $in: ids.map(p => p._id) },	
			});
						

			const mirrorsForLastDurations = [];
			for (let i = 1; i <= 4; i++) {
				const duration = WEEK * i;
				const count = profileMirrors.filter(
					(m) =>
						dayjs(m.createdAt) >=
						dayjs((timestamp - duration) * 1000)
				).length;
				if (count) {
					mirrorsForLastDurations.push({
						"profileEligibility.maxMirrors": {
							$ne: 0,
							$gte: count,
						},
						"profileEligibility.mirrorsForLastDuration": duration,
					});
				}
			}

			filter.$and.push({
				$or: [
					{ "profileEligibility.maxMirrors": 0 },
					{
						"profileEligibility.maxMirrors": {
							$ne: 0,
							$gte: profileMirrors.length,
						},
						"profileEligibility.mirrorsForLastDuration": 0,
					},
					...mirrorsForLastDurations,
				],
			});
		}
	}

	if (filter.$and.length == 0) {
		delete filter.$and;
	}

	//console.log(JSON.stringify(filter, null, 2), options);

	const resp = await Promotion.paginate(filter, options);
	resp.results = await formatResult(resp.results, mode);

	res.send(resp);
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
	
	await Contracts.create({ address, chainId, lastBlockNumber })
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
	list,
	addContract,
	getContracts,
	removeContract
};
