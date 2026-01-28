import { createSlice } from '@reduxjs/toolkit';

const registrationSlice = createSlice({
    name: 'registration',
    initialState: {
      registrations: [],
      loading: false,
    },
    reducers: {
      setRegistrations(state, action) {
        state.registrations = action.payload;
      },
      clearRegistrations(state) {
        state.registrations = [];
      },
    },
  });

  export const { setRegistrations,clearRegistrations } = registrationSlice.actions;
  export default registrationSlice.reducer;
    
  