// features/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { name: '', role: '' },
  reducers: {
    setUser: (state, action) => {
      state.name = action.payload.name;
      state.role = action.payload.role;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
