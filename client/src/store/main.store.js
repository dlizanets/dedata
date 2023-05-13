import { defineStore } from 'pinia';
import { utils } from 'ethers';
import { api } from '@/api/api'

export const mainStore = defineStore('main', {
	state: () => ({
        contracts: [],
        selectedContract: null,
        data: null,
        chains: [
            {
                name: 'Polygon',
                id: '137',
                rpc: 'https://rpc.ankr.com/polygon'
            },
            {
                name: 'Ethereum',
                id: '1',
                rpc: 'https://rpc.ankr.com/eth'
            },
            
        ],
        partners: [
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
	}),

    getters: {
        imagesCount(state) { return state.publication.attachments.reduce((acc, attachment) => acc + (attachment.type.includes('image') ? 1 : 0), 0) },
    },

    actions: {
        async getData() {
            this.data = (await api.get('/getData'))?.data
        },
		async getContracts() { 
            this.contracts = (await api.get('/getContracts'))?.data?.contracts || []
            this.selectedContract = this.contracts.length ? this.contracts[0] : null
        },
        async addContract(address, chainId) {
            this.contracts = (await api.post('/addContract', { address, chainId }))?.data?.contracts || []
            const s = this.contracts.find(c => c.address === address && c.chainId === chainId)
            this.selectContract(s.id)
        },
        async removeContract(id) {
            this.contracts = (await api.post('/removeContract', { id }))?.data?.contracts || []
            if(this.contracts.length) {
                this.selectContract(this.contracts[0].id)
            } else {
                this.selectedContract = null
            }
            
        },
        selectContract(id) {
            this.selectedContract = this.contracts.find(c => c.id === id)
        }  
	},
});



