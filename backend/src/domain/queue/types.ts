export type TJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IQueueJob {
  id: string;
  requestId: string;
  clientId: number | null;
  input: string;
  status: TJobStatus;
  result: string | null;
  submittedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface IQueueSnapshot {
  pending: number;
  activeJobId: string | null;
  activeJobsCount: number;
  totalJobs: number;
  accepting: boolean;
}

export interface IWorkerProcessingMessage {
  type: 'job-processing';
  jobId: string;
}

export interface IWorkerCompletedMessage {
  type: 'job-completed';
  jobId: string;
  result: string;
}

export type TWorkerOutputMessage = IWorkerProcessingMessage | IWorkerCompletedMessage;

export interface IWorkerProcessJobMessage {
  type: 'process-job';
  jobId: string;
  input: string;
  delayMs: number;
}

export interface IQueueOptions {
  delayMs?: number;
  workerPath?: string;
  workerExecArgv?: string[];
  workerConcurrency?: number;
  maxQueueSize?: number;
  maxStoredJobs?: number;
  jobTtlMs?: number;
  cleanupIntervalMs?: number;
}

export interface IWorkerRuntimeResolution {
  workerPath: string;
  workerExecArgv?: string[];
}
