import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Socket } from 'socket.io-client';

interface RealtimeState {
  socket: Socket | null | any; // Using any to avoid Redux Toolkit serialization issues
  isConnected: boolean;
  currentPrice: Record<string, number>;
  timer: {
    remaining: number;
    isActive: boolean;
  } | null;
  lastTradeResult: {
    orderId: string;
    result: 'win' | 'loss';
    payout: number;
  } | null;
}

const initialState: RealtimeState = {
  socket: null,
  isConnected: false,
  currentPrice: {},
  timer: null,
  lastTradeResult: null,
};

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      state.socket = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    updatePrice: (state, action: PayloadAction<{ symbol: string; price: number }>) => {
      state.currentPrice[action.payload.symbol] = action.payload.price;
    },
    updateTimer: (state, action: PayloadAction<{ remaining: number; isActive: boolean }>) => {
      state.timer = action.payload;
    },
    setTradeResult: (
      state,
      action: PayloadAction<{ orderId: string; result: 'win' | 'loss'; payout: number }>
    ) => {
      state.lastTradeResult = action.payload;
    },
    clearTradeResult: (state) => {
      state.lastTradeResult = null;
    },
  },
});

export const {
  setSocket,
  setConnected,
  updatePrice,
  updateTimer,
  setTradeResult,
  clearTradeResult,
} = realtimeSlice.actions;
export default realtimeSlice.reducer;

