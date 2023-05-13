import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [	
	{
		path: '/',
		name: 'home',
		component: Home,
	},
	{ path: "/:pathMatch(.*)*", redirect: '/', }	
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
})

export default router

// // http://localhost:5173/mirrors?id=6400c7280cb4487ed312b15c
