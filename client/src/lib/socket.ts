import { io, Socket } from 'socket.io-client';
import { store } from '@/store/store';
import {
  setSocket,
  setConnected,
  updatePrice,
  updateTimer,
  setTradeResult,
} from '@/store/slices/realtimeSlice';
import { updateBalance, addTransaction } from '@/store/slices/walletSlice';
import { updateOrder, addOrder } from '@/store/slices/tradeSlice';
import { addNotification } from '@/store/slices/notificationSlice';

let socket: Socket | null = null;

export const initializeSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:5000';
  const socketUrl = `${protocol}//${host}`;

  socket = io(socketUrl, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
    store.dispatch(setSocket(socket));
    store.dispatch(setConnected(true));
    store.dispatch(
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are now active',
      })
    );
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    store.dispatch(setConnected(false));
    if (reason === 'io server disconnect') {
      // Server disconnected, reconnect manually
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    store.dispatch(setConnected(false));
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to real-time server',
      })
    );
  });

  // Price updates
  socket.on('price_update', (data: { symbol: string; price: number }) => {
    store.dispatch(updatePrice(data));
  });

  // Trade confirmation
  socket.on('trade_confirmation', (data: any) => {
    store.dispatch(addOrder(data));
    store.dispatch(
      addNotification({
        type: 'success',
        title: 'Trade Placed',
        message: `Your ${data.side} order for ${data.symbol} has been placed`,
      })
    );
  });

  // Timer updates
  socket.on('timer_update', (data: { remaining: number; isActive: boolean }) => {
    store.dispatch(updateTimer(data));
  });

  // Trade result
  socket.on('result_update', (data: { orderId: string; result: 'win' | 'loss'; payout: number }) => {
    store.dispatch(setTradeResult(data));
    store.dispatch(
      addNotification({
        type: data.result === 'win' ? 'success' : 'error',
        title: data.result === 'win' ? 'Trade Won!' : 'Trade Lost',
        message: `Payout: $${data.payout.toFixed(2)}`,
      })
    );
  });

  // Balance updates
  socket.on('balance_update', (data: { walletId: string; balance: string }) => {
    store.dispatch(updateBalance(data));
  });

  // Transaction updates
  socket.on('transaction_update', (data: any) => {
    store.dispatch(addTransaction(data));
    store.dispatch(
      addNotification({
        type: 'info',
        title: 'Transaction Update',
        message: `Your ${data.type} transaction has been ${data.status}`,
      })
    );
  });

  // Order updates
  socket.on('order_update', (data: any) => {
    store.dispatch(updateOrder(data));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    store.dispatch(setSocket(null));
    store.dispatch(setConnected(false));
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export default socket;

