import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { GNBEventManager } from './utils/event-manager';

// 注册全局监听事件
GNBEventManager.shared.register();

createApp(App).mount('#app')
