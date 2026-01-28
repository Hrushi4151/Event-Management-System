// import { configureStore } from '@reduxjs/toolkit'

// export const makeStore = () => {
//   return configureStore({
//     reducer: {},
//   })
// }
// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slice';

export const makeStore = configureStore({
  reducer: {
    user: userReducer,
  },
});

