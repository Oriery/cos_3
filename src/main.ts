import './assets/main.css'
import './index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createNotivue } from 'notivue'

import 'notivue/notifications.css' // Only needed if using built-in notifications 
import 'notivue/animations.css' // Only needed if using built-in animations 

import App from './App.vue'
import router from './router'
import { setupI18n } from './i18n'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
const useDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: useDarkTheme ? 'dark' : 'light',
  },
})

const i18n = setupI18n()

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)
app.use(vuetify)

// pushNotify must be exported at the END of plugins chain, just before mounting the app
export const pushNotify = createNotivue(app)
app.mount('#app')
