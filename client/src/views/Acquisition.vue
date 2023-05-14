<template>
	<div class="border shadow-sm rounded p-2 mb-2" v-if="traffic">

        <div class="fw-bold mb-2 ps-3 fs-4">Acquisition</div>

        <div v-for="partner in partners">
            <div class="d-flex justify-content-between px-2">
                <div>
                    {{ partner.name }}
                </div>
                <div>
                    {{ getPartnerHistory(partner.address).length || 0 }} wallets interracted in past
                </div>
            </div>
        </div>
	</div>
</template>

<style lang="scss" scoped> 
    .traffic_chart{
        max-height: 20rem;
    }
</style>

<script>
	import { mainStore } from '@/store/main.store';
	import { mapState } from 'pinia'
    
	export default {
		computed: {
			...mapState(mainStore, ['traffic', 'partners']),
            getPartnerHistory() {
                const self = this
                return function(address) {
                    return this.traffic.history.filter(h => {
                        return h.to.toLowerCase() === address.toLowerCase()
                    })
                    
                }
            }
        }
	}
</script>
