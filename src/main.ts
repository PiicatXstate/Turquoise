import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import { DatePicker } from 'ant-design-vue';

const pinia = createPinia()
const app = createApp(App)

app.use(DatePicker);
app.use(pinia)
app.use(ElementPlus)
createApp(App).mount('#app')
