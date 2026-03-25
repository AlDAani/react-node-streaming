export type QueueJobResponse = {
  requestId: string;
  status: 'pending' | 'done' | 'error';
  result?: string;
  error?: string;
};

export type QueueResultEvent = {
  requestId: string;
  status?: 'pending' | 'done' | 'error';
  result?: string;
  error?: string;
};

export type QueueConnectionState = 'connected' | 'disconnected' | 'reconnecting';
