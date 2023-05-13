module.exports = {
	chains: [
        {
            name: 'Polygon',
            id: '137',
            wss: 'wss://matic.getblock.io/e2370cd5-76ec-459e-a41d-a69c0950795e/mainnet/', //wss://rpc-mainnet.matic.network
            rpc: 'https://rpc.ankr.com/polygon'
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
};