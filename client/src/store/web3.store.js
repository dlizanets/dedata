import dayjs from 'dayjs';
import { ethers } from "ethers";
import { defineStore } from "pinia";
import { userStore } from "./user.store.js";

import bcConfig_all from '../../../bcConfig.json';
const bcConfig = bcConfig_all[CHAIN_ID]

export const rpc = new ethers.providers.JsonRpcProvider(CHAIN_RPC_URL)

export const web3Store = defineStore("web3", {	
	state: () => ({		
		web3Modal: null,		
        accountData: {
            address: null,
            signer: null,
            chainId: null,
            provider: null
        },
        chainData: {
            id: CHAIN_ID,
            name: CHAIN_NAME,            
            explorerUrl: CHAIN_EXPLORER_URL,
            symbol: CHAIN_CURRENCY,
            rpc: rpc
        },
        //lensHub: new ethers.Contract(bcConfig.lensHub.address, bcConfig.lensHub.abi, rpc),
        //lensPeriphery: new ethers.Contract(bcConfig.lensPeriphery.address, bcConfig.lensPeriphery.abi, rpc),
        timestamp: parseInt(dayjs().valueOf() / 1000), 
        bcConfig,
        fanaticoHubConfigData: null,

	}),

	getters: {      
        chain: (state) => state.chainData,
        chainValid: (state) => state.accountData.chainId === state.chainData.id,    
        account: (state) => state.accountData,
        accountValid: (state) => state.accountData.address === userStore().profile.ownedBy, 
        fanaticoHub: () => { return new ethers.Contract(bcConfig.fanaticoHub.address, bcConfig.fanaticoHub.abi, rpc) },
        fanaticoHubConfig: (state) => state.fanaticoHubConfigData,
    },

    actions: {
        setWeb3Modal(web3Modal) {
            this.web3Modal = web3Modal
        },
        setFanaticoHubConfig(fanaticoHubConfig) {
            this.fanaticoHubConfigData = fanaticoHubConfig
        },

        

        async updateTimestamp() {
            try {
                //const blockNum = await rpc.getBlockNumber();					
			    //const block = await rpc.getBlock(blockNum);
                this.timestamp = parseInt(dayjs().valueOf() / 1000)  // block.timestamp
            } catch (error) {
                console.log(error)
            }            
        },

        async connect() {
            //console.log(`connect`);
            try {
                const providerWeb3 = await this.web3Modal.connect();          
                                
                this.accountData.provider = new ethers.providers.Web3Provider(providerWeb3, "any")
                this.accountData.signer = await this.accountData.provider.getSigner()            
                
                const network = await this.accountData.provider.getNetwork()
                this.accountData.chainId = parseInt(network.chainId) 

                const accounts = await this.accountData.provider.listAccounts()
                if (accounts.length > 0) {                
                    this.accountData.address = accounts[0]
                } else {
                    this.disconnect()
                }
                
                providerWeb3.on("connect", async (info) => {
                    this.accountData.chainId = parseInt(info.chainId)                
                });
        
                providerWeb3.on("accountsChanged", async (accounts) => { 
                     
                    if (accounts.length > 0) { 
                        if (this.accountData.address) {
                            await userStore().logout()
                        }                                               
                        this.accountData.address = accounts[0] 
                    } else {
                        this.disconnect()
                    }                          
                });
        
                providerWeb3.on("chainChanged", async (chainId) => {
                    this.accountData.chainId = parseInt(chainId)            
                });
        
                providerWeb3.on("network", (newNetwork, oldNetwork) => {
                    // https://github.com/ethers-io/ethers.js/issues/866
                    // When a Provider makes its initial connection, it emits a "network"
                    // event with a null oldNetwork along with the newNetwork. So, if the
                    // oldNetwork exists, it represents a changing network
                    //console.log(`providerWeb3.on network`, newNetwork, oldNetwork);                
                });    
            } catch (error) {
                
            }            
        },

        async disconnect() { 
            
            this.accountData.address = null
            this.accountData.signer = null
            this.accountData.chainId = null     
            this.accountData.provider = null                       
            try {
                await this.web3Modal.clearCachedProvider();
            } catch (error) {
                
            }                  
        },
    },
});
