<template>
	<div class="border shadow-sm rounded p-2 mb-2" v-if="traffic">

        <div class="fw-bold mb-2 ps-3 fs-4">Traffic</div>

        <div class="d-flex justify-content-between border-bottom pb-2 mb-2 px-3">
            <div>
                <div class="text-secondary">New users</div>
                <div class="fs-5">{{ totalUsers }}</div>
            </div>

            <div>
                <div class="text-secondary">Returning users</div>
                <div class="fs-5">{{ returningUsers }}</div>
            </div>

            <div>
                <div class="text-secondary">Total interractions</div>
                <div class="fs-5">{{ totalInterractions }}</div>
            </div>

        </div>

        <Line :data="chartData" :options="chartOptions" class="traffic_chart"/>

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
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    )
    
	export default {
		components: { 
			Line
		},
		data() {
			return {
				chartOptions: {
                    responsive: true,
                    maintainAspectRatio: false
                }
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
            chartData() {
                const newUsers = []
                
                const res = this.traffic.transactions
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    .reduce((r, o, i, { [i - 1]: last }) => {
                        
                        if (!last || new Date(o.timestamp) - new Date(last.timestamp) > 5 * 50 * 1000) {
                            r.push([o]);
                        } else {
                            r[r.length - 1].push(o);
                        }

                        return r;
                    }, [])

                    const usrs = {}
                    const gr2 = []
                    for (let g = 0; g < res.length; g++) {
                        const gr = res[g];
                        gr2[g] = 0
                        for (let u = 0; u < gr.length; u++) {
                            if (usrs[gr[u].from] === undefined) {
                                usrs[gr[u].from] = true
                                gr2[g] ++
                            }
                        }
                    }

                    console.log(gr2)
                
                return {
                    labels: res.map(g => this.$date(g[0].timestamp).format('HH:mm') ),
                    datasets: [
                        {
                            label: 'New',
                            backgroundColor: '#64DB59',
                            data: gr2
                        },
                        {
                            label: 'Returning',
                            backgroundColor: '#f87979',
                            data: res.map((g, i) => g.length - gr2[i])
                        },
                        
                        {
                            label: 'Total',
                            backgroundColor: '#8848cc',
                            data: res.map((g) => g.length)
                        },
                    ]
                }
            },
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
