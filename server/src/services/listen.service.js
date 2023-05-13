const config = require('../config/config');
const axios = require('axios')

const { utils, BigNumber, ethers } = require('ethers');
const { LastBlock, Events, Transactions, Interactions , Wallets, History} = require('../models');
const dayjs = require('dayjs');
const Moralis = require("moralis").default;
const { EvmChain, EvmTransaction } = require("@moralisweb3/common-evm-utils");

const reset = async function() {
    await LastBlock.deleteMany({})
	await Events.deleteMany({})
	await Transactions.deleteMany({})
	await Interactions.deleteMany({})
	
    console.log('RESET COMPLETED')
}

const chains = [
	{
		name: 'Polygon',
		id: '137',
		wss: 'wss://matic.getblock.io/e2370cd5-76ec-459e-a41d-a69c0950795e/mainnet/', //wss://rpc-mainnet.matic.network
		rpc: 'https://rpc.ankr.com/polygon'
	},
]
const partnersList = [
	{
		name: 'Lens',
		address: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
		chainId: '137'
	},
	{
		name: 'Galxe',
		address: '0x6cad6e1abc83068ea98924aef37e996ed02abf1c',
		chainId: '137'
	},
]
const clients = [
	{
		name: 'Amplicata',
		address: '0xCBC87C71e53eF0501aCD2F9ceE29f3B9C35670F1',
		chainId: '137'
	}
]

const scan = async function(chain, address) {
	let delay
    const currentDelay = 10000	
	const chainId = chain.id
	
	console.log(`SCAN STARTED: ${chainId}:${address}`)
	const step = 3000		
	const provider = new ethers.providers.JsonRpcProvider({ url: chain.rpc, timeout: 30000 }, 'any')
    const contract = new ethers.Contract(address, [], provider)
		
	setTimeout(async function tick() {
        try {			
			const currentBlock = await provider.getBlockNumber()	
								
			let lastBlock = await LastBlock.findOne({ chainId, address })
			//if (!lastBlock) lastBlock = await LastBlock.create({ chainId, address, blockNumber: currentBlock })	
			if (!lastBlock) lastBlock = await LastBlock.create({ chainId, address, blockNumber: 42655743 })		
						
			if (lastBlock.blockNumber < currentBlock) {					
				let fromBlock = lastBlock.blockNumber + 1
				let toBlock = lastBlock.blockNumber + step - 1			
				if (toBlock > currentBlock) {
					toBlock = currentBlock
					delay = currentDelay
				} else {
					delay = 100
				}
				const rawEvents = await contract.queryFilter("*", fromBlock, toBlock)				
				const events = []
				
				console.log(`SCAN ${chainId}:${address} from: ${fromBlock} to: ${toBlock} current: ${currentBlock} left: ${currentBlock - toBlock} events: ${rawEvents.length}`)

				const transactions = []
				if (rawEvents.length) {
					await Events.bulkWrite(rawEvents.map((e) => { 
						//console.log(`EVENT:`, e)
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
						//console.log(`EVENT:`, e)
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
				
				//if (isProd) {
				lastBlock.blockNumber = toBlock
				await lastBlock.save()					
				//}								
				//console.log('LOTTERY SCAN COMPLETED')
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
				const provider = new ethers.providers.JsonRpcProvider({ url: chain.rpc, timeout: 30000 }, 'any')
				const tx = await provider.getTransaction(transactionHash)

					await Transactions.updateOne(
						{ 
							chainId,
							transactionHash								
						}, 
						{ 
							$set: {
								chainId,
								transactionHash,
								from: tx.from,
								to: tx.to
							}
						}, 
						{ 
							upsert: true 
						}
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
				{ checkedAt: { $lt: dayjs().subtract(100, 'seconds') } },
			]})	

			console.log(wallet)

			if(wallet) {
				for (let i = 0; i < chains.length; i++) {
					const chain = chains[i];
					
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
	getTransactions(chains[0])
	scan(chains[0], '0xCBC87C71e53eF0501aCD2F9ceE29f3B9C35670F1')
	walletHistory()
}
init()

module.exports = {
	
};