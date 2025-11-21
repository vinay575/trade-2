import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { Order, InsertOrder } from '@shared/schema';

interface TradeState {
  orders: Order[];
  activeTrades: Order[];
  tradeHistory: Order[];
  isLoading: boolean;
  error: string | null;
  selectedSymbol: string | null;
}

const initialState: TradeState = {
  orders: [],
  activeTrades: [],
  tradeHistory: [],
  isLoading: false,
  error: null,
  selectedSymbol: null,
};

export const fetchOrders = createAsyncThunk(
  'trade/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/trades');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchTradeHistory = createAsyncThunk(
  'trade/fetchTradeHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/trades/history');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trade history');
    }
  }
);

export const createOrder = createAsyncThunk(
  'trade/createOrder',
  async (orderData: InsertOrder, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/trades', orderData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Order creation failed');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'trade/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/api/trades/${orderId}`);
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Order cancellation failed');
    }
  }
);

const tradeSlice = createSlice({
  name: 'trade',
  initialState,
  reducers: {
    setSelectedSymbol: (state, action: PayloadAction<string | null>) => {
      state.selectedSymbol = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      if (action.payload.status === 'pending' || action.payload.status === 'partial') {
        state.activeTrades.push(action.payload);
      }
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      const activeIndex = state.activeTrades.findIndex((o) => o.id === action.payload.id);
      if (activeIndex !== -1) {
        if (action.payload.status === 'filled' || action.payload.status === 'cancelled') {
          state.activeTrades.splice(activeIndex, 1);
        } else {
          state.activeTrades[activeIndex] = action.payload;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.activeTrades = action.payload.filter(
          (o: Order) => o.status === 'pending' || o.status === 'partial'
        );
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.tradeHistory = action.payload;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
        if (action.payload.status === 'pending' || action.payload.status === 'partial') {
          state.activeTrades.push(action.payload);
        }
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o.id !== action.payload);
        state.activeTrades = state.activeTrades.filter((o) => o.id !== action.payload);
        state.error = null;
      });
  },
});

export const { setSelectedSymbol, addOrder, updateOrder, clearError } = tradeSlice.actions;
export default tradeSlice.reducer;

