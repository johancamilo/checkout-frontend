import { createStore } from 'vuex';
import checkout from './modules/checkout';

export default createStore({
  modules: {
    checkout,
  },
});