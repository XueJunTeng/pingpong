import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initRequestInterceptor } from './api/request'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

// 先注册路由和状态管理
app.use(pinia)
app.use(router)

// 再注册ElementPlus
app.use(ElementPlus)

// 初始化请求拦截器（确保pinia已注册）
initRequestInterceptor()

app.mount('#app')