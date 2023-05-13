import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

const production = process.env.NODE_ENV === 'production' 
//const production = true
//const chainId = 137
const chainId = '0x13881' //80001
const mainChain = chainId == 137

console.log('.')

// https://vitejs.dev/config/
export default defineConfig(() => {	
	return {
		plugins: [
			vue(),
		],
		server: {
			port: 5200
		},
		define: {
			IS_PRODUCTION: production,
			APP_NAME: JSON.stringify('FANATICO'),		
			CHAIN_CURRENCY: JSON.stringify('MATIC'),
			CHAIN_NAME: JSON.stringify(mainChain ? 'Polygon' : 'Mumbai'),
			
			IS_MAIN_CHAIN: mainChain,
			CHAIN_ID: JSON.stringify(chainId),
			CHAIN_RPC_URL: JSON.stringify(mainChain ? 'https://polygon-rpc.com' : 'https://rpc.ankr.com/polygon_mumbai'),
			CHAIN_EXPLORER_URL: JSON.stringify(mainChain ? 'https://polygonscan.com/' : 'https://mumbai.polygonscan.com/'),
			
			API_URL: JSON.stringify(production ? (mainChain ? '' : 'https://fanatico-api.appdev.pp.ua') : 'http://127.0.0.1:3900'),

			INFURA_PR_ID: JSON.stringify('2NSM3Nt9x4c7xUho5oRM629TDnt'),
			INFURA_SERCET: JSON.stringify('e0693705597ab31bdd167c3a66309c3f'),						
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),	
				crypto: "crypto-browserify",			
			},
		},
		optimizeDeps: {
			esbuildOptions: {
				// Node.js global to browser globalThis
				define: {
					global: 'globalThis',
				},
				// Enable esbuild polyfill plugins
				plugins: [
					NodeGlobalsPolyfillPlugin({
						//buffer: true,
						process: true,						
					}),
					//NodeModulesPolyfillPlugin(),
				],
			},
		},		
		build: {
			rollupOptions: {
				plugins: [
					rollupNodePolyFill()
				],
			},
			chunkSizeWarningLimit: false,
			
			//outDir: path.resolve("z:/www/client"),		
			//emptyOutDir: true,
			//root: 'src',
		},		
	};
});
