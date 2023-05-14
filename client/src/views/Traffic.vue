<template>
	<div class="border shadow-sm rounded p-2 mb-2" v-if="traffic">

        <div class="d-flex justify-content-between">
            <div>
                <div>Total users</div>
                <div>{{ totalUsers }}</div>
            </div>

            <div>
                <div>New users</div>
                <div>{{ newUsers }}</div>
            </div>

            <div>
                <div>Total interractions</div>
                <div>{{ totalInterractions }}</div>
            </div>

            

            <div>
                <div>Returning users</div>
                <div>{{ returningUsers }}</div>
            </div>
        </div>

	</div>
</template>

<style lang="scss" scoped> 
</style>

<script>
	import { mainStore } from '@/store/main.store';
	import { mapState } from 'pinia'
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    } from 'chart.js'
    import { Line } from 'vue-chartjs'
	export default {
		components: { 
			
		},
		data() {
			return {
				
			};
		},
		mounted() {
			
		},
		async beforeMount() {
			
		},
		watch: {
			
		},
		computed: {
			...mapState(mainStore, ['contracts', 'chains', 'selectedContract', 'traffic']),
            totalUsers() {
                return this.traffic.totalUsers
            },
            totalInterractions() {
                return this.traffic.transactions?.length || 0
            },
            newUsers() {
                return 0
            },
            returningUsers() {
                const users = {}
                let count = 0
                this.traffic.transactions.forEach(u => {
                    if(users[u.from]) {
                        count ++
                    } else {
                        users[u.from] = true
                    }
                })
                return count
            }	
		},
		methods: {
			
		},
	}
    const uniqueItems = (list, keyFn) => list.reduce((resultSet, item) =>
        resultSet.add(typeof keyFn === 'string' ? item[keyFn] : keyFn(item)), new Set).size;
</script>
