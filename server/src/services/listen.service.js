const config = require('../config/config');
const axios = require('axios')
const bc = require('../config/bc')
const { utils, BigNumber, ethers } = require('ethers');
const { LastBlock, Events, Transactions, Interactions , Wallets, History, Contracts} = require('../models');
const dayjs = require('dayjs');
const Moralis = require("moralis").default;
const { EvmChain, EvmTransaction } = require("@moralisweb3/common-evm-utils");
const { Network, Alchemy, AlchemySubscription } = require('alchemy-sdk') ;

const alchemyPly = new Alchemy({
    apiKey: "jBZHTGriUbwLW1baF5E4osgbxIpehULq",
    network: Network.MATIC_MAINNET,
});
const alchemyEth = new Alchemy({
    apiKey: "jBZHTGriUbwLW1baF5E4osgbxIpehULq",
    network: Network.ETH_MAINNET,
});


const reset = async function() {
    //await LastBlock.deleteMany({})
	//await Events.deleteMany({})
	await Transactions.deleteMany({})
	await Interactions.deleteMany({})

	const contracts = await Contracts.find({ })
	for (let i = 0; i < contracts.length; i++) {
		const contract = contracts[i]
		contract.lastBlockNumber = contract.startBlockNumber
		await contract.save()
	}
	
    console.log('RESET COMPLETED')
}

const scan = async function() {
    console.log(`SCAN STARTED`)
	const currentDelay = 10000	
	const step = 3000	
	
	for (let c = 0; c < bc.chains.length; c++) {
		const chain = bc.chains[c];
		const chainId = chain.id
		const provider = new ethers.providers.JsonRpcProvider({ url: chain.rpc, timeout: 30000 }, 'any')
		let delay = currentDelay
		setTimeout(async function tick() {
			try {	
				const contracts = await Contracts.find({ chainId })
				const currentBlock = await provider.getBlockNumber()

				for (let i = 0; i < contracts.length; i++) {
					const contract = contracts[i];
					const address = contract.address
					
					const lastBlock = contract.lastBlockNumber

					if (lastBlock < currentBlock) {	
						
						console.log(lastBlock, currentBlock)

						let fromBlock = lastBlock + 1
						let toBlock = lastBlock + step - 1			
						if (toBlock > currentBlock) {
							toBlock = currentBlock
							//delay = currentDelay
						} else {
							//delay = 100
						}
						const contractInstance = new ethers.Contract(address, [], provider)

						const rawEvents = await contractInstance.queryFilter("*", fromBlock, toBlock)				
						const events = []
						
						console.log(`SCAN ${chainId}:${address} from: ${fromBlock} to: ${toBlock} current: ${currentBlock} left: ${currentBlock - toBlock} events: ${rawEvents.length}`)

						const transactions = []
						if (rawEvents.length) {
							await Events.bulkWrite(rawEvents.map((e) => { 
								const txhIdx = transactions.findIndex(t => t.transactionHash === e.transactionHash)
								if (txhIdx == -1) transactions.push(e)
								return { updateOne: {
									filter: {
										address, 	
										chainId,							
										blockNumber: e.blockNumber,
										logIndex: e.logIndex,								
									},
									update: { $set: {
										address,
										chainId,
										blockNumber: e.blockNumber,
										logIndex: e.logIndex,						
										raw: e,
									} },
									upsert: true
								}}
							}))	

							await Transactions.bulkWrite(transactions.map((t) => { 
								const transactionHash = t.transactionHash
								return { updateOne: {
									filter: {
										chainId,							
										transactionHash,								
									},
									update: { $set: {
										chainId,							
										transactionHash,
									} },
									upsert: true
								}}
							}))
						}
						
						contract.lastBlockNumber = toBlock
						await contract.save()					
					}
				
				}
			} catch (error) {
				console.log('ERROR', error)			
			}
			setTimeout(tick, delay);             
		}, 1000)
	}
}

const scan_ = async function() {
	let delay = 10000
    	
	console.log(`SCAN STARTED`)	

	const contractsByChain = {}

	setTimeout(async function tick() {
        try {	
			for (let c = 0; c < bc.chains.length; c++) {
				const chain = bc.chains[c];
				const chainId = chain.id

				const contracts = await Contracts.find({ chainId })
				if (contractsByChain[chainId]?.length != contracts.length) {
					contractsByChain[chainId] = contracts
					alchemyPly.ws.removeAllListeners()
					console.log(contracts.map(c => { return { to: c.address} }))
					alchemyPly.ws.on(
						{
						  method: AlchemySubscription.MINED_TRANSACTIONS,
						  addresses: contracts.map(c => { return { to: c.address} }),
						  includeRemoved: true,
						  hashesOnly: false,
						},
						async (td) => {
							const tx = td.transaction
							const transactionHash = tx.hash
							const from = utils.getAddress(tx.from)
							const to = utils.getAddress(tx.to)
							console.log('TX', chainId, from, to)
							await Transactions.create({  
								chainId, 
								transactionHash,
								from: from,
								to: to,
								timestamp: dayjs(),	
							});
							await Interactions.updateOne(
								{ 
									chainId,
									address: to,
									wallet: from								
								}, 
								{ 
									$set: {
										chainId,
										address: to,
										wallet: from	
									}
								}, 
								{ 
									upsert: true 
								}
							);
							await Wallets.updateOne(
								{ 
									address: from,
								}, 
								{ 
									$set: {
										address: from,
									}
								}, 
								{ 
									upsert: true 
								}
							);
						}
					);
				}
			}
        } catch (error) {
            console.log('ERROR', error)			
        }
      	setTimeout(tick, delay);             
    }, 1000)
}

const getTransactions = async function(chain) {
	//await Events.deleteMany({})
	const chainId = chain.id	
	setTimeout(async function tick() {
        try {			
			const txs = await Transactions.find({ from: { $exists: false }}).limit(10)	

			for (let i = 0; i < txs.length; i++) {
				const txr = txs[i];
				const transactionHash = txr.transactionHash
				const chain = bc.chains.find(c => c.id === txr.chainId)
				const provider = new ethers.providers.JsonRpcProvider({ url: chain.rpc, timeout: 30000 }, 'any')
				const tx = await provider.getTransaction(transactionHash)
				const block = await provider.getBlock(tx.blockHash)
				
				await Transactions.updateOne(
					{  chainId, transactionHash	}, 
					{ $set: {
						chainId,
						transactionHash,
						from: tx.from,
						to: tx.to,
						timestamp: block.timestamp,
					}}, 
					{ upsert: true }
				);

				const address = tx.to
				const wallet = tx.from

					await Interactions.updateOne(
						{ 
							chainId,
							address,
							wallet								
						}, 
						{ 
							$set: {
								chainId,
								address,
								wallet
							}
						}, 
						{ 
							upsert: true 
						}
					);

					await Wallets.updateOne(
						{ 
							address: wallet,
						}, 
						{ 
							$set: {
								address: wallet,
							}
						}, 
						{ 
							upsert: true 
						}
					);
			}		
        } catch (error) {
            console.log('ERROR', error)			
        }
      	setTimeout(tick, 1000);             
    }, 1000)	
}

const walletHistory = async function() {
	setTimeout(async function tick() {
        try {			
			const wallet = await Wallets.findOne({ $or: [
				{ checkedAt: null },
				{ checkedAt: { $lt: dayjs().subtract(600, 'seconds') } },
			]})	

			if(wallet) {
				console.log('check', wallet.address)
				for (let i = 0; i < bc.chains.length; i++) {
					const chain = bc.chains[i];
					
					const filter = {
						chain: BigNumber.from(chain.id)._hex,
						address: wallet.address,
					}
					const last = await History.find({ chainId: chain.id, from: wallet.address.toLowerCase() }).sort({blockNumber: -1}).limit(1)
					if (last?.length) {
						filter.fromBlock = parseInt(last[0].blockNumber) + 1
					}
					
					const transactionsResp = await Moralis.EvmApi.transaction.getWalletTransactions(filter);

					await History.bulkWrite(transactionsResp.getResult().map((t) => { 
						const transaction = t.toJSON()
						console.log('tx', transaction.from, transaction.to)
						return { updateOne: {
							filter: {
								chainId: chain.id,							
								from: transaction.from,	
								to: transaction.to,	
								txHash: transaction.hash,	
								blockNumber: transaction.blockNumber				
							},
							update: { $set: {
								chainId: chain.id,							
								from: transaction.from,	
								to: transaction.to,	
								txHash: transaction.hash,
								blockNumber: transaction.blockNumber	
							} },
							upsert: true
						}}
					}))
				}

				wallet.checkedAt = dayjs()
				await wallet.save()
			}

        } catch (error) {
            console.log('ERROR', error)			
        }
      	setTimeout(tick, 1000);             
    }, 1000)	
}

async function init() {
	//await reset()

	await Moralis.start({
		apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjYxZjYwOGU5LTI1MGQtNDJkMi1hMzUyLTY2NTZlYjVkMTNlOSIsIm9yZ0lkIjoiMjQzODY4IiwidXNlcklkIjoiMjQ2MzY3IiwidHlwZUlkIjoiNzgzNTJmZDQtNmI3Yy00MWRhLWI0Y2ItZDEwYmEzMzNmNjI2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE2ODM5MzE0NDgsImV4cCI6NDgzOTY5MTQ0OH0.kpboafHtPKVpqQZ9SpOXrhC35T9S58q6Fl6unQyJNzs'
	});

	// for (let c = 0; c < bc.chains.length; c++) {
	// 	const chain = bc.chains[c];
	// 	getTransactions(chain)
	// }
	scan_()
	//scan()
	//walletHistory()
}
init()

module.exports = {
	
};