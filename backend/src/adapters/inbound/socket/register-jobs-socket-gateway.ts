import type { Server as TSocketServer } from 'socket.io';
import type { ClockPort, JobsQueuePort, MetricsPort } from '@/application/ports/out';
import {
  JOB_COMPLETED_EVENT,
  JOB_ENQUEUED_EVENT,
  JOB_FAILED_EVENT,
  JOB_UPDATED_EVENT,
  QUEUE_REJECTED_EVENT,
  WORKER_RESTARTED_EVENT,
} from '@/domain/queue/constants';
import { SOCKET_EVENTS } from './contracts';

interface IRegisterJobsSocketBridgeInput {
  io: TSocketServer;
  jobs: JobsQueuePort;
  metrics: MetricsPort;
  clock: ClockPort;
}

interface IQueueResultPayload {
  requestId: string;
  status: string;
  result: string | null;
  error: string | null;
}

function normalizeQueueResultPayload(payload: unknown): IQueueResultPayload | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const requestId = String(record.requestId ?? record.id ?? '').trim();
  const status = String(record.status ?? '').trim();

  if (!requestId || !status) {
    return null;
  }

  return {
    requestId,
    status,
    result: typeof record.result === 'string' ? record.result : null,
    error: typeof record.error === 'string' ? record.error : null,
  };
}

export function registerJobsSocketBridge({ io, jobs, metrics, clock }: IRegisterJobsSocketBridgeInput): void {
  let socketConnectionsCurrent = 0;
  metrics.setQueueDepth(jobs.getSnapshot().pending);

  jobs.on(JOB_ENQUEUED_EVENT, () => {
    metrics.incQueueJobsTotal();
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  jobs.on(JOB_COMPLETED_EVENT, () => {
    metrics.incQueueJobsCompletedTotal();
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  jobs.on(JOB_FAILED_EVENT, () => {
    metrics.incQueueJobsFailedTotal();
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  jobs.on(QUEUE_REJECTED_EVENT, () => {
    metrics.incQueueRejectedTotal();
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  jobs.on(WORKER_RESTARTED_EVENT, () => {
    metrics.incWorkerRestartsTotal();
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  jobs.on(JOB_UPDATED_EVENT, () => {
    metrics.setQueueDepth(jobs.getSnapshot().pending);
  });

  io.on('connection', (socket) => {
    socketConnectionsCurrent += 1;
    metrics.setSocketConnectionsCurrent(socketConnectionsCurrent);

    socket.emit(SOCKET_EVENTS.JOBS_SNAPSHOT, {
      data: jobs.listJobs(20),
      meta: {
        emittedAt: clock.nowIso(),
      },
    });

    socket.on('disconnect', () => {
      socketConnectionsCurrent = Math.max(0, socketConnectionsCurrent - 1);
      metrics.setSocketConnectionsCurrent(socketConnectionsCurrent);
    });
  });

  jobs.on(JOB_UPDATED_EVENT, (job: unknown) => {
    const normalizedPayload = normalizeQueueResultPayload(job);

    if (!normalizedPayload) {
      return;
    }

    io.emit(SOCKET_EVENTS.QUEUE_RESULT, {
      data: normalizedPayload,
      meta: {
        emittedAt: clock.nowIso(),
      },
    });
  });
}
