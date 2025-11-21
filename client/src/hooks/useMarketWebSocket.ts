import { useEffect, useRef, useState } from 'react';

interface MarketData {
  type: string;
  data: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    timestamp: number;
  };
}

export function useMarketWebSocket() {
  const [marketData, setMarketData] = useState<MarketData['data'] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Safely construct WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "localhost:5000";
    const wsUrl = `${protocol}//${host}/ws/market`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Market WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MarketData;
          setMarketData(data.data);
        } catch (error) {
          console.error('Error parsing market data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Market WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Market WebSocket disconnected');
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return () => {};
    }
  }, []);

  return { marketData, isConnected };
}
