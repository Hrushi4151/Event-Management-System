
import { createSlice } from '@reduxjs/toolkit';

const eventSlice = createSlice({
    name: 'event',
    initialState: {
      events: [],
      loading: false,
    },
    reducers: {
      setEvents(state, action) {
        state.events = action.payload;
      },
      clearEvents(state) {
        state.events = [];
      },
    },
  });

  export const { setEvents,clearEvents } = eventSlice.actions;
export default eventSlice.reducer;
  