import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';
import type { Wallet, Transaction, InsertTransaction } from '@shared/schema';

interface WalletState {
  wallets: Wallet[];
  transactions: Transaction[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  wallets: [],
  transactions: [],
  selectedWallet: null,
  isLoading: false,
  error: null,
};

export const fetchWallets = createAsyncThunk(
  'wallet/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/wallet');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallets');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/wallet/transactions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const createDeposit = createAsyncThunk(
  'wallet/createDeposit',
  async (data: Omit<InsertTransaction, 'type'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/wallet/deposit', { ...data, type: 'deposit' });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Deposit failed');
    }
  }
);

export const createWithdrawal = createAsyncThunk(
  'wallet/createWithdrawal',
  async (data: Omit<InsertTransaction, 'type'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/wallet/withdraw', { ...data, type: 'withdrawal' });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Withdrawal failed');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSelectedWallet: (state, action: PayloadAction<Wallet | null>) => {
      state.selectedWallet = action.payload;
    },
    updateBalance: (state, action: PayloadAction<{ walletId: string; balance: string }>) => {
      const wallet = state.wallets.find((w) => w.id === action.payload.walletId);
      if (wallet) {
        wallet.balance = action.payload.balance;
      }
      if (state.selectedWallet?.id === action.payload.walletId) {
        state.selectedWallet.balance = action.payload.balance;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallets = action.payload;
        if (!state.selectedWallet && action.payload.length > 0) {
          state.selectedWallet = action.payload[0];
        }
        state.error = null;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(createDeposit.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.error = null;
      })
      .addCase(createWithdrawal.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.error = null;
      });
  },
});

export const { setSelectedWallet, updateBalance, addTransaction, clearError } = walletSlice.actions;
export default walletSlice.reducer;

