import './scss/app.scss'
import 'bootstrap';

//import { Buffer } from "buffer/";
//window.Buffer = Buffer;
// string capitalize
Object.defineProperty(String.prototype, 'capitalize', {
    value: function() { return this.charAt(0).toUpperCase() + this.slice(1); },
    enumerable: false
});

// app
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App);

// createPinia
import { createPinia } from 'pinia'
app.use(createPinia())

// mitt
import mitt from 'mitt';
app.config.globalProperties.$mitt = mitt();

// globalMixins
import globalMixins from "./mixins/global.mixins"
app.mixin(globalMixins)

// globalFilters
import globalFilters from "./helpers/global.filters"
app.config.globalProperties.$filters = globalFilters

app.config.globalProperties.$location = window.location



// router
import router from "./router";
app.use(router)

// dayjs
import dayjs from "dayjs"; 
import relativeTime from "dayjs"; 
dayjs.locale('en')
dayjs.extend(relativeTime)
app.config.globalProperties.$date = dayjs


// breakpoint
import { breakpoint } from './store/breakpoint.store'
app.config.globalProperties.$breakpoint = breakpoint();
app.config.globalProperties.$breakpoint.init()

// sweetalert2
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
app.use(VueSweetalert2, {
    buttonsStyling: false,
    position: 'top',
    showConfirmButton: false,
    customClass: {
        popup: '_swal2_popup',
        confirmButton: 'btn btn-success px-4 mx-2 mb-2',
        denyButton: 'btn btn-primary px-4 mx-2 mb-2',
        cancelButton: 'btn btn-danger px-4 mx-2 mb-2',
        footer: '_swal2_footer',
    }
});


// vue-loading-overlay
import { LoadingPlugin } from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
app.use(LoadingPlugin, {
    loader: 'dots',
    width: 100,
    height: 100,
    color: '#fc965c',
    backgroundColor: '#000000',
    opacity: 0.1,
    zIndex: 99999999,
    blur: '0',
    enforceFocus: false
});

// logger
import VueLogger from 'vuejs3-logger';
app.use(VueLogger, {
    isEnabled: true,
    logLevel : process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    stringifyArguments : false,
    showLogLevel : true,
    showMethodName : true,
    separator: '|',
    showConsoleColors: true
});


import { tooltip } from './helpers/tooltip'
app.directive('tooltip', tooltip)

// mount
app.mount('#app')

