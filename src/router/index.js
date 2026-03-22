
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'




const routes = [

  {
    path: '/',
    component: () => import('../App.vue'),
    meta: {
      title: '代办事项'
    }

  }
]
export default router