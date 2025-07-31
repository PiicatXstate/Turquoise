import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import { DatePicker } from 'ant-design-vue';

import MateChat from '@matechat/core';

import '@devui-design/icons/icomoon/devui-icon.css';

const pinia = createPinia()
const app =  createApp(App)

app.use(DatePicker);
app.use(pinia)
app.use(ElementPlus)
app.use(MateChat)


app.mount('#app')
