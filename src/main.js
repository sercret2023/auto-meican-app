import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'  // 导入路由配置
import 'element-plus/es/components/date-picker/style/css'
import '@/assets/styles/global.scss'

const app = createApp(App)

// 使用路由
app.use(router)
app.use(ElementPlus)

app.mount('#app')
