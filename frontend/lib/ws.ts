import { useEffect, useState, useRef } from 'react';
import { AgentStep } from './types';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = RAW_API_URL.replace(/\/$/, '');
// Convert http/https API URL to ws/wss protocol
const WS_URL = API_URL.replace(/^http/, 'ws');

export function useAgentWebSocket(jobId: string | null) {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const url = `${WS_URL}/v1/ws/${jobId}`;
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      setSteps([]);
    };

    ws.onmessage = (event) => {
      try {
        const stepData = JSON.parse(event.data);
        if (stepData.type === 'ping') return;
        
        if (stepData.error) {
          setError(stepData.error);
          return;
        }
        
        const step: AgentStep = {
          phase: stepData.phase,
          message: stepData.message,
          status: stepData.status,
          progress: stepData.progress,
          created_at: stepData.created_at || new Date().toISOString()
        };
        
        setSteps((prev) => [...prev, step]);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error occurred.');
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  return { steps, isConnected, error };
}
