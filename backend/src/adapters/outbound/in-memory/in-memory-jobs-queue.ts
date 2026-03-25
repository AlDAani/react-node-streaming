import EventEmitter from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { ApplicationError, APPLICATION_ERROR_CODES } from '@/application/errors';
import type { JobsQueuePort } from '@/application/ports/out';
import {
  DEFAULT_JOB_DELAY_MS,
  DEFAULT_WORKER_CONCURRENCY,
  JOB_COMPLETED_EVENT,
  JOB_ENQUEUED_EVENT,
  JOB_FAILED_EVENT,
  JOB_ID_PREFIX,
  JOB_STATUS,
  JOB_UPDATED_EVENT,
  QUEUE_REJECTED_EVENT,
  TSX_EXEC_ARGV,
  WORKER_MESSAGE_TYPES,
  WORKER_RESTARTED_EVENT,
} from '../../../domain/queue/constants';
import {
  IQueueJob,
  IQueueOptions,
  IQueueSnapshot,
  TWorkerOutputMessage,
} from '../../../domain/queue/types';

interface IWorkerSlot {
  index: number;
  worker: Worker;
  activeJobId: string | null;
  failed: boolean;
}

export interface InMemoryQueueWorkerRuntimeResolution {
  workerPath: string;
  workerExecArgv?: string[];
  workerRuntime: 'tsx' | 'node';
  workerReady: boolean;
  checkedPaths: string[];
}

interface IWorkerCandidate {
  workerPath: string;
  workerExecArgv?: string[];
  workerRuntime: 'tsx' | 'node';
}

function buildWorkerCandidates(): IWorkerCandidate[] {
  const rawCandidates: IWorkerCandidate[] = [
    {
      workerPath: path.join(__dirname, 'worker.ts'),
      workerExecArgv: [...TSX_EXEC_ARGV],
      workerRuntime: 'tsx',
    },
    {
      workerPath: path.join(__dirname, 'worker.js'),
      workerExecArgv: undefined,
      workerRuntime: 'node',
    },
    {
      workerPath: path.resolve(process.cwd(), 'src', 'adapters', 'outbound', 'in-memory', 'worker.ts'),
      workerExecArgv: [...TSX_EXEC_ARGV],
      workerRuntime: 'tsx',
    },
    {
      workerPath: path.resolve(process.cwd(), 'backend', 'src', 'adapters', 'outbound', 'in-memory', 'worker.ts'),
      workerExecArgv: [...TSX_EXEC_ARGV],
      workerRuntime: 'tsx',
    },
    {
      workerPath: path.resolve(process.cwd(), 'dist', 'adapters', 'outbound', 'in-memory', 'worker.js'),
      workerExecArgv: undefined,
      workerRuntime: 'node',
    },
    {
      workerPath: path.resolve(process.cwd(), 'backend', 'dist', 'adapters', 'outbound', 'in-memory', 'worker.js'),
      workerExecArgv: undefined,
      workerRuntime: 'node',
    },
  ];

  const deduped = new Map<string, IWorkerCandidate>();

  rawCandidates.forEach((candidate) => {
    deduped.set(candidate.workerPath, candidate);
  });

  return [...deduped.values()];
}

export function resolveInMemoryQueueWorkerRuntime(): InMemoryQueueWorkerRuntimeResolution {
  const candidates = buildWorkerCandidates();
  const foundCandidate = candidates.find((candidate) => fs.existsSync(candidate.workerPath));

  if (foundCandidate) {
    return {
      workerPath: foundCandidate.workerPath,
      workerExecArgv: foundCandidate.workerExecArgv,
      workerRuntime: foundCandidate.workerRuntime,
      workerReady: true,
      checkedPaths: candidates.map((candidate) => candidate.workerPath),
    };
  }

  const fallback = candidates[0] ?? {
    workerPath: path.resolve(process.cwd(), 'src', 'adapters', 'outbound', 'in-memory', 'worker.ts'),
    workerExecArgv: [...TSX_EXEC_ARGV],
    workerRuntime: 'tsx' as const,
  };

  return {
    workerPath: fallback.workerPath,
    workerExecArgv: fallback.workerExecArgv,
    workerRuntime: fallback.workerRuntime,
    workerReady: false,
    checkedPaths: candidates.map((candidate) => candidate.workerPath),
  };
}

function isTerminalStatus(status: IQueueJob['status']): boolean {
  return status === JOB_STATUS.COMPLETED || status === JOB_STATUS.FAILED;
}

function getNowIso(): string {
  return new Date().toISOString();
}

export class InMemoryJobQueue extends EventEmitter implements JobsQueuePort {
  private delayMs: number;

  private workerConcurrency: number;

  private maxQueueSize: number;

  private maxStoredJobs: number;

  private jobTtlMs: number;

  private cleanupIntervalMs: number;

  private jobs: Map<string, IQueueJob>;

  private jobOrder: string[];

  private pendingJobIds: string[];

  private jobCounter: number;

  private workers: IWorkerSlot[];

  private isClosing: boolean;

  private accepting: boolean;

  private workerPath: string;

  private workerExecArgv?: string[];

  private cleanupTimer: NodeJS.Timeout | null;

  constructor(options: IQueueOptions = {}) {
    super();

    const workerRuntime = resolveInMemoryQueueWorkerRuntime();

    this.delayMs = options.delayMs ?? DEFAULT_JOB_DELAY_MS;
    this.workerConcurrency = Math.max(1, options.workerConcurrency ?? DEFAULT_WORKER_CONCURRENCY);
    this.maxQueueSize = options.maxQueueSize ?? 500;
    this.maxStoredJobs = Math.max(options.maxStoredJobs ?? 2000, this.maxQueueSize);
    this.jobTtlMs = options.jobTtlMs ?? 1_800_000;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000;

    this.jobs = new Map();
    this.jobOrder = [];
    this.pendingJobIds = [];
    this.jobCounter = 0;
    this.workers = [];
    this.isClosing = false;
    this.accepting = true;
    this.workerPath = options.workerPath ?? workerRuntime.workerPath;
    this.workerExecArgv = options.workerExecArgv ?? workerRuntime.workerExecArgv;
    this.cleanupTimer = null;

    this.assertWorkerScriptExists(workerRuntime.checkedPaths);
    this.startWorkers();
    this.startCleanupLoop();
  }

  private assertWorkerScriptExists(checkedPaths: string[]): void {
    if (fs.existsSync(this.workerPath)) {
      return;
    }

    const messageParts = [
      `Queue worker script not found at "${this.workerPath}".`,
      checkedPaths.length > 0 ? `Checked: ${checkedPaths.join(', ')}` : null,
      `Current working directory: ${process.cwd()}.`,
    ].filter((part): part is string => Boolean(part));

    throw new Error(messageParts.join(' '));
  }

  private startCleanupLoop(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredJobs();
      this.trimStoredJobs();
    }, this.cleanupIntervalMs);

    this.cleanupTimer.unref?.();
  }

  private createWorkerSlot(index: number): IWorkerSlot {
    const worker = new Worker(this.workerPath, this.workerExecArgv ? { execArgv: this.workerExecArgv } : undefined);
    const slot: IWorkerSlot = {
      index,
      worker,
      activeJobId: null,
      failed: false,
    };

    worker.on('message', (message: TWorkerOutputMessage) => this.handleWorkerMessage(slot, message));
    worker.on('error', (error) => this.handleWorkerFailure(slot, error));
    worker.on('exit', (code) => {
      if (!this.isClosing && code !== 0) {
        this.handleWorkerFailure(slot, new Error(`Worker ${slot.index} exited with code ${code}`));
      }
    });

    return slot;
  }

  private startWorkers(): void {
    for (let index = 0; index < this.workerConcurrency; index += 1) {
      this.workers[index] = this.createWorkerSlot(index);
    }
  }

  private disposeWorker(slot: IWorkerSlot): Promise<number> {
    slot.worker.removeAllListeners();

    return slot.worker.terminate().catch(() => 0);
  }

  private getAvailableWorker(): IWorkerSlot | null {
    for (const slot of this.workers) {
      if (!slot.failed && slot.activeJobId === null) {
        return slot;
      }
    }

    return null;
  }

  private getActiveJobIds(): string[] {
    return this.workers
      .map((slot) => slot.activeJobId)
      .filter((value): value is string => Boolean(value));
  }

  private createJob(input: string, clientId: number | null): IQueueJob {
    this.jobCounter += 1;
    const id = `${JOB_ID_PREFIX}${String(this.jobCounter).padStart(4, '0')}`;

    return {
      id,
      requestId: id,
      clientId,
      input,
      status: JOB_STATUS.PENDING,
      result: null,
      submittedAt: getNowIso(),
      startedAt: null,
      completedAt: null,
      error: null,
    };
  }

  private markJobFailed(jobId: string, reason: string): void {
    const job = this.jobs.get(jobId);

    if (!job || isTerminalStatus(job.status)) {
      return;
    }

    job.status = JOB_STATUS.FAILED;
    job.error = reason;
    job.completedAt = getNowIso();
    this.emit(JOB_FAILED_EVENT, this.serialize(job));
    this.emit(JOB_UPDATED_EVENT, this.serialize(job));
  }

  stopAccepting(): void {
    this.accepting = false;
  }

  enqueue(input: string, clientId: number | null = null): IQueueJob {
    if (!this.accepting || this.isClosing) {
      throw new ApplicationError(
        APPLICATION_ERROR_CODES.SERVER_SHUTTING_DOWN,
        'Queue is shutting down and no longer accepts jobs.',
      );
    }

    if (this.pendingJobIds.length >= this.maxQueueSize) {
      this.emit(QUEUE_REJECTED_EVENT, {
        queueSize: this.pendingJobIds.length,
        maxQueueSize: this.maxQueueSize,
        emittedAt: getNowIso(),
      });
      throw new ApplicationError(APPLICATION_ERROR_CODES.QUEUE_FULL, 'Queue is full. Please retry later.', {
        maxQueueSize: this.maxQueueSize,
      });
    }

    const job = this.createJob(input, clientId);
    this.jobs.set(job.id, job);
    this.jobOrder.push(job.id);
    this.pendingJobIds.push(job.id);
    this.emit(JOB_ENQUEUED_EVENT, this.serialize(job));
    this.emit(JOB_UPDATED_EVENT, this.serialize(job));
    this.trimStoredJobs();

    const accepted = this.serialize(job);
    this.processNext();

    return accepted;
  }

  getJob(jobId: string): IQueueJob | null {
    const job = this.jobs.get(jobId);
    return job ? this.serialize(job) : null;
  }

  listJobs(limit = 20): IQueueJob[] {
    return [...this.jobs.values()]
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .slice(0, limit)
      .map((job) => this.serialize(job));
  }

  getSnapshot(): IQueueSnapshot {
    const activeJobIds = this.getActiveJobIds();

    return {
      pending: this.pendingJobIds.length,
      activeJobId: activeJobIds[0] ?? null,
      activeJobsCount: activeJobIds.length,
      totalJobs: this.jobs.size,
      accepting: this.accepting && !this.isClosing,
    };
  }

  private processNext(): void {
    if (this.isClosing || this.pendingJobIds.length === 0) {
      return;
    }

    while (this.pendingJobIds.length > 0) {
      const workerSlot = this.getAvailableWorker();

      if (!workerSlot) {
        return;
      }

      const nextJobId = this.pendingJobIds.shift();

      if (!nextJobId) {
        return;
      }

      const job = this.jobs.get(nextJobId);

      if (!job) {
        continue;
      }

      workerSlot.activeJobId = nextJobId;
      job.status = JOB_STATUS.PROCESSING;
      job.startedAt = getNowIso();
      this.emit(JOB_UPDATED_EVENT, this.serialize(job));

      workerSlot.worker.postMessage({
        type: WORKER_MESSAGE_TYPES.PROCESS_JOB,
        jobId: job.id,
        input: job.input,
        delayMs: this.delayMs,
      });
    }
  }

  private handleWorkerMessage(slot: IWorkerSlot, message: TWorkerOutputMessage): void {
    if (slot.failed || !message || !message.jobId) {
      return;
    }

    const job = this.jobs.get(message.jobId);

    if (!job) {
      slot.activeJobId = null;
      this.processNext();
      return;
    }

    if (message.type === WORKER_MESSAGE_TYPES.JOB_PROCESSING) {
      job.status = JOB_STATUS.PROCESSING;
      job.startedAt = job.startedAt ?? getNowIso();
      this.emit(JOB_UPDATED_EVENT, this.serialize(job));
      return;
    }

    if (message.type === WORKER_MESSAGE_TYPES.JOB_COMPLETED) {
      job.status = JOB_STATUS.COMPLETED;
      job.result = message.result;
      job.completedAt = getNowIso();
      slot.activeJobId = null;
      this.emit(JOB_COMPLETED_EVENT, this.serialize(job));
      this.emit(JOB_UPDATED_EVENT, this.serialize(job));
      this.trimStoredJobs();
      this.processNext();
    }
  }

  private handleWorkerFailure(slot: IWorkerSlot, error: Error): void {
    if (this.isClosing || slot.failed) {
      return;
    }

    slot.failed = true;

    if (slot.activeJobId) {
      this.markJobFailed(slot.activeJobId, error.message);
      slot.activeJobId = null;
    }

    this.emit(WORKER_RESTARTED_EVENT, {
      reason: error.message,
      emittedAt: getNowIso(),
      workerIndex: slot.index,
    });

    void this.disposeWorker(slot);

    if (!this.isClosing) {
      this.workers[slot.index] = this.createWorkerSlot(slot.index);
      this.processNext();
    }
  }

  private cleanupExpiredJobs(): void {
    const now = Date.now();

    for (const jobId of [...this.jobOrder]) {
      const job = this.jobs.get(jobId);

      if (!job) {
        this.removeFromOrder(jobId);
        continue;
      }

      if (!isTerminalStatus(job.status) || !job.completedAt) {
        continue;
      }

      const completedAt = Date.parse(job.completedAt);

      if (!Number.isFinite(completedAt)) {
        continue;
      }

      if (now - completedAt >= this.jobTtlMs) {
        this.jobs.delete(jobId);
        this.removeFromOrder(jobId);
      }
    }
  }

  private trimStoredJobs(): void {
    if (this.jobs.size <= this.maxStoredJobs) {
      return;
    }

    for (const jobId of [...this.jobOrder]) {
      if (this.jobs.size <= this.maxStoredJobs) {
        break;
      }

      const job = this.jobs.get(jobId);

      if (!job) {
        this.removeFromOrder(jobId);
        continue;
      }

      if (!isTerminalStatus(job.status)) {
        continue;
      }

      this.jobs.delete(jobId);
      this.removeFromOrder(jobId);
    }
  }

  private removeFromOrder(jobId: string): void {
    const index = this.jobOrder.indexOf(jobId);

    if (index >= 0) {
      this.jobOrder.splice(index, 1);
    }
  }

  private async waitForActiveJobs(graceMs: number): Promise<void> {
    if (this.getActiveJobIds().length === 0) {
      return;
    }

    const startedAt = Date.now();

    while (this.getActiveJobIds().length > 0 && Date.now() - startedAt < graceMs) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  async close(graceMs = 0): Promise<void> {
    this.accepting = false;
    this.isClosing = true;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (graceMs > 0) {
      await this.waitForActiveJobs(graceMs);
    }

    for (const activeJobId of this.getActiveJobIds()) {
      this.markJobFailed(activeJobId, 'Queue stopped before job completion.');
    }

    for (const pendingJobId of [...this.pendingJobIds]) {
      this.markJobFailed(pendingJobId, 'Queue stopped before job completion.');
    }

    this.pendingJobIds = [];

    await Promise.all(
      this.workers.map(async (slot) => {
        slot.activeJobId = null;
        await this.disposeWorker(slot);
      }),
    );
  }

  private serialize(job: IQueueJob): IQueueJob {
    return {
      id: job.id,
      requestId: job.requestId,
      clientId: job.clientId,
      input: job.input,
      status: job.status,
      result: job.result,
      submittedAt: job.submittedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
    };
  }
}
