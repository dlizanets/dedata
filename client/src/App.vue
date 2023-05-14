<template>
	<div>		
		<Header class="mb-3 sticky-top"/>
						
		<div class="container px-2">
			<div class="row g-3 justify-content-center">
				<div class="col-12">
					<Contracts/>				
				</div>	
				<div class="col-12">
					<Traffic/>				
				</div>

				<div class="col-12">
					<Acquisition/>				
				</div>
							
				<div class="col-12">
					<router-view v-slot="{ Component, route }">
						<transition name="fade" mode="out-in">
							<component :is="Component" :key="route.path" />
						</transition>
					</router-view>
				</div>
			</div>			
		</div>		
	</div>		    
</template>

<style lang="scss" scoped>	
</style>

<script>
	import Header from '@/views/partials/Header.vue';
	import Contracts from '@/views/Contracts.vue'
	import Traffic from '@/views/Traffic.vue'
	import Acquisition from '@/views/Acquisition.vue'

	export default {
		name: "App",
		components: { Header, Contracts, Traffic, Acquisition }, 
		data() {
			return {
				
			};
		},

		methods: {
			async updateContractData() {		
				try {
									
				} catch (error) {
					console.log(error)
				}
			},		

			async txResultSwall({ tx, msg, emit, callback }) {
				try {
					const result = await tx.wait();
					if (callback) callback();
					if (emit) {
						this.gWait(1000)
						if (typeof emit === 'string') {
							this.$mitt.emit(emit);
						}
						if (Array.isArray(emit)) {
							emit.forEach(e => this.$mitt.emit(e))
						}						
					}
					if (result.status) {
						this.$swal({
							icon: "success",
							title: msg.title || "SUCCESS",
							text: msg.success || "Confirmation successful",
							footer: `<a href="${this.$web3.chain.explorerUrl + "tx/" + result.transactionHash}" target="_blank" class="font-monospace">${this.$filters.txHashShort(result.transactionHash)}</a>`,
							timer: 6000,
          					showConfirmButton: true,
						});
					} else {
						this.$swal({
							icon: "error",
							title: msg.title || "ERROR",
							text: msg.nosuccess || "Confirmation error",
							footer: `<a href="${this.$web3.chain.explorerUrl + "tx/" + result.transactionHash}" target="_blank" class="font-monospace">${this.$filters.txHashShort(result.transactionHash)}</a>`,
							timer: 3000
						});
					}
				} catch (error) {
					this.$swal({
						icon: "error",
						title: msg.title || "ERROR",
						text: "Error: " + (error.data?.message ? error.message + " ... " + error.data?.message : error.message),
						timer: 3000
					});
					console.error("txResultToast", error);
				}
			},
		},
	};
</script>
	