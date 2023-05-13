<template>
	<div>
		<div class="d-flex align-items-center mb-2">
            <div v-if="mode === 'pub'" class="fs-5 fw-bold">My publications</div>  
			<div v-if="mode === 'col'" class="fs-5 fw-bold">My collection</div> 
			<div v-if="mode === 'exp'" class="fs-5 fw-bold">Publications feed</div> 
        </div>
		
        <div class="d-flex align-items-center justify-content-between mb-2">
			<div class="d-flex align-items-center">
				<select class="form-select form-select-sm border-0 pointer fw-bold" v-model="query.sort" @change="setPage(1)">
					<option class="fw-bold " v-for="option in sortFilters" :value="option.value">
						{{ option.text }}
					</option>
				</select>				
				
				<select class="form-select form-select-sm border-0 pointer fw-bold" v-model="query.select" @change="setPage(1)" v-if="mode === 'pub' || mode === 'exp'">
					<option class="fw-bold " v-for="option in selectFilters" :value="option.value">
						{{ option.text }}
					</option>
				</select>

				<template v-if="mode !== 'pub'">
					<input
						class="form-control form-control-sm" 
						type="text"
						v-model="query.search" 
						placeholder="Search..."
					/>	
					<div class="_icon_search bg-primary pointer me-1 ms-2" @click="setPage(1)"></div>
					<div class="_icon_close bg-primary pointer me-1 ms-2" @click="clearSearch()" v-if="query.search?.length >= 3"></div>	
				</template>							
			</div>
			
			<div class="d-flex align-items-center">
				<div class="_icon_reload bg-primary pointer me-1 ms-2" @click="get()"></div>				
			</div>
		</div>

		<div class="d-flex align-items-center justify-content-center mb-2" v-if="totalPages > 1">				
			<Paginate
                :page-count="parseInt(totalPages)" 
                :click-handler="setPage"
				:force-page="parseInt(query.page)" 
                :prev-text="'...'" 
                :next-text="'...'">
			</Paginate>				
		</div>

		<!--Item v-for="item in items" :mode="mode" :item="item"/-->		
        
        <div class="d-flex align-items-center justify-content-center mb-3 mt-3" v-if="totalPages > 1">			
			<Paginate 
                :page-count="parseInt(totalPages)" 
                :click-handler="setPage"
				:force-page="parseInt(query.page)" 
                :prev-text="'...'" 
                :next-text="'...'">
			</Paginate>			
		</div>
	</div>	
</template>

<script>
	import { api } from '@/api/api'
	//import Item from './Item.vue'
	import Paginate from '@/views/components/Paginate.vue'
	
	export default {
		components: {			
			Paginate,
			//Item
		},
		props: {
			mode: { type: String, required: true },
		},	
		data() {
			return {
				items: [],
                query: {
                    page: 1,
                    limit: 5,
                    select: 'all',
                    id: null,
				},
                limitDefault: 5,
                totalPages: 0,
                totalResults: 0,										
			}
		},
		computed: {
			
			sortFilters() {
				return [
					{ text: 'Recent', value: 'desc' },
					{ text: 'Oldest', value: 'asc' },	
				]
			},
			selectFilters() {
				if (this.mode === 'pub') {
					return [
						{ text: 'All', value: 'all' },
						{ text: 'Purchased', value: 'purchased' },	
					]
				} 
				if (this.mode === 'col') {
					return [
						{ text: 'All', value: 'all' },
						{ text: 'Collected', value: 'collected' },	
						{ text: 'Readed', value: 'readed' },	
					]
				} 
				if (this.mode === 'exp') {
					return [
						{ text: 'Available', value: 'available' },
						{ text: 'All', value: 'all' },	
					]
				}				
			} 
		},
		watch: {
			
		},
		async mounted() {
			this.getQuery()            
			//this.get()
			this.$mitt.on("campaigns::publications::reload", this.setPage)
			
		},	
		beforeUnmount() {			
			this.$mitt.off("campaigns::publications::reload")
			
		},	
		methods: {
			searchByUser(address) {
				this.query.search = address
				this.setPage(1)
			},
			lockItem(data) {
				const publicationIdx = this.items.findIndex(p => p.id === data.id)
				if (publicationIdx > -1) this.items[publicationIdx].locked = data.lock
			},				
			publicationUpdate(publication) {
				const publicationIdx = this.items.findIndex(p => p.id === publication.id)
				if (publicationIdx > -1) {
					this.items[publicationIdx].owner = publication.owner
				}
			},
			transferToken(collect) {
				const publicationIdx = this.items.findIndex(p => p.id === collect.publication)
				if (publicationIdx > -1) {
					const collectIdx = this.items[publicationIdx].collects.findIndex(c => c.id === collect.id)
					if (collectIdx > -1) {
						this.items[publicationIdx].collects[collectIdx] = collect
					} else {
						this.items[publicationIdx].collects = [ collect, ...this.items[publicationIdx].collects ]
					}
					this.items[publicationIdx].locked = false
				}				
			},
			queryValues(q) {
                return Object.fromEntries(
                    Object.entries(q).filter(([key, value]) => {
                        return value !== null && value !== undefined && value !== '' && this.query.hasOwnProperty(key)
                    })
                )
            },
            getQuery() {
                this.query = this.queryValues(this.$route.query)
                if (!this.query.page || this.query.id) this.query.page = 1
                if (!this.query.limit) this.query.limit = this.limitDefault
				if (!this.query.select) {
					if (this.mode === 'pub') this.query.select = 'all'
					if (this.mode === 'col') this.query.select = 'all'
					if (this.mode === 'exp') this.query.select = 'available'
				}        
				if (!this.query.sort) this.query.sort = 'desc'             
            },
            setQuery() {
                try { this.$router.push({ name: this.$route.name, query: this.queryValues(this.query) })
                } catch (error) { }
            },
            setPage(page) {
                this.query.id = null
                this.query.page = page
                this.get()
            },
			clearSearch() {
                this.query.search = null               
                this.setPage(1)
            }, 

			addPublication(publication) {
				if (this.mode === 'pub') {
					this.items = [publication, ...this.items]
				}				
			},

			async get() {
                await this.getList()
                this.setQuery()
            },

			async getList() {				
				this.gLoaderShow()
				try {					
					const publications = (await api.get('/publication/getList', {
                        params: {
                            ...this.queryValues(this.query),
							mode: this.mode
                        }
                    })).data
					
					this.items = publications.results
					this.totalPages = publications.totalPages
                    this.totalResults = publications.totalResults	
					window.scrollTo(0,0);				
				} catch (err) {
					console.log(err)
				}
				this.gLoaderHide()
			},
		},
	}
</script>
