<template>
	<div class="border shadow-sm rounded p-2 mb-2" >

		<div>Add contract</div>

		<div class="input-group input-group-sm mb-3">
			<input
				class="form-control"
				type="text"
				v-model="address"                                
				placeholder="address"
			/>
			<button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">{{chain.name}}</button>
			<ul class="dropdown-menu">
				<li v-for="c in chains" >
					<a class="dropdown-item" href="#" @click="chain = c" >{{c.name}}</a>
				</li>
			</ul>
			<button class="btn btn-primary d-flex align-items-center" @click="addContract()">
				Add
			</button>
		</div>

		<div>
			<div v-for="contract in contracts" class="d-flex align-items-center justify-content-between">
				<div class="d-flex align-items-center">
					<div class="_icon_vote bg-secondary me-3" :class="{'bg-success': contract.id === selectedContract.id}"></div>
					<a :href="`https://polygonscan.com/address/${contract.address}`"
						class="text-decoration-none d-flex align-items-center font-monospace" target="_blank" rel="noopener noreferrer"							
						>
						{{ contract.address }}
					</a>
				</div>
				
				<div class="d-flex align-items-center">
					<a class="ms-2 text-danger" href="#" @click.prevent="removeContract(contract.id)">
						Remove
					</a>
					<a class="ms-2 text-success" href="#" @click.prevent="selectContract(contract.id)">
						Select
					</a>
				</div>
			</div>
		</div>

		<!--WalletWarnings/-->
	</div>
</template>

<style lang="scss" scoped> 
	
</style>

<script>
	import { mainStore } from '@/store/main.store';
	import { mapState } from 'pinia'
	export default {
		components: { 
			
		},
		data() {
			return {
				address: null,
				chain: mainStore().chains[0], 
			};
		},
		mounted() {
			
		},
		async beforeMount() {
			await mainStore().getContracts()
		},
		watch: {
			
		},
		computed: {
			...mapState(mainStore, ['contracts', 'chains', 'selectedContract'])			
		},
		methods: {
			async addContract() {
				this.gLoaderShow();
				try {
					await mainStore().addContract(this.address, this.chain.id)	
					this.address = null				
				} catch (error) {
					this.$swal({
						icon: 'error',
						title: 'Add contract error',
						timer: 5000,
					});
				}
				this.gLoaderHide();
			},
			async removeContract(id) {
				this.gLoaderShow();
				try {
					await mainStore().removeContract(id)	
					this.address = null				
				} catch (error) {
					console.log(error)
					this.$swal({
						icon: 'error',
						title: 'Remove contract error',
						timer: 5000,
					});
				}
				this.gLoaderHide();
			},
			async selectContract(id){
				this.gLoaderShow();
				try {
					await mainStore().selectContract(id)	
				} catch (error) {
					this.$swal({
						icon: 'error',
						title: 'Fetch contract stats error',
						timer: 5000,
					});
				}
				this.gLoaderHide();
			}

		},
	}
</script>
