import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/api/constants/base-url';
import { normalizeQueueSocketEvent } from './normalizers';
import type { QueueConnectionState, QueueResultEvent } from './types';

type QueueSocketCallbacks = {
  onConnectChange?: (isConnected: boolean) => void;
  onConnectionStateChange?: (state: QueueConnectionState) => void;
  onQueueResult?: (payload: QueueResultEvent) => void;
};

export const connectQueueSocket = ({
  onConnectChange,
  onConnectionStateChange,
  onQueueResult,
}: QueueSocketCallbacks): Socket => {
  const emitConnectionState = (state: QueueConnectionState) => {
    onConnectChange?.(state === 'connected');
    onConnectionStateChange?.(state);
  };

  const socket = io(API_BASE_URL || undefined, {
    path: '/socket.io',
    reconnection: true,
  });

  socket.on('connect', () => {
    emitConnectionState('connected');
  });

  socket.on('disconnect', () => {
    emitConnectionState('disconnected');
  });

  socket.on('connect_error', () => {
    emitConnectionState('reconnecting');
  });

  socket.io.on('reconnect_attempt', () => {
    emitConnectionState('reconnecting');
  });

  socket.io.on('reconnect', () => {
    emitConnectionState('connected');
  });

  socket.io.on('reconnect_failed', () => {
    emitConnectionState('disconnected');
  });

  socket.on('jobs:snapshot', (payload: unknown) => {
    const jobs = Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [];

    jobs.forEach((job) => {
      const normalized = normalizeQueueSocketEvent(job);

      if (normalized) {
        onQueueResult?.(normalized);
      }
    });
  });

  socket.on('queue-result', (payload: unknown) => {
    const normalized = normalizeQueueSocketEvent(payload);

    if (normalized) {
      onQueueResult?.(normalized);
    }
  });

  return socket;
};
