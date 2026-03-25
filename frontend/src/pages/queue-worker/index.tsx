import { useEffect, useMemo, useRef, useState } from 'react';
import { Heading, Text } from '@radix-ui/themes';
import classnames from 'classnames/bind';
import i18next from 'i18next';
import {
  connectQueueSocket,
  fetchQueueJobById,
  type QueueConnectionState,
  type QueueResultEvent,
  runQueueRuntimePreflight,
  useCreateQueueJobMutation,
} from '@/api/queue';
import { getApiErrorMessage } from '@/api/utils/api-error';
import { COMMON_TRANSLATIONS } from '@/constants/i18next/common-translations';
import { QUEUE_WORKER_TRANSLATIONS } from './constants/translations';

import styles from './index.module.scss';

const cn = classnames.bind(styles);
const BLOCK_NAME = 'Queue-worker-page';
const SOCKET_STALL_THRESHOLD_MS = 7000;

type RowStatus = 'idle' | 'pending' | 'done' | 'error';

type QueueRow = {
  clientId: number;
  requestId?: string;
  status: RowStatus;
  result?: string;
  error?: string;
};

const makeInitialRows = (): QueueRow[] =>
  Array.from({ length: 20 }, (_, index) => ({
    clientId: index + 1,
    status: 'idle',
  }));

const STATUS_TRANSLATIONS: Record<RowStatus, string> = {
  idle: QUEUE_WORKER_TRANSLATIONS.statusIdle,
  pending: QUEUE_WORKER_TRANSLATIONS.statusPending,
  done: QUEUE_WORKER_TRANSLATIONS.statusDone,
  error: QUEUE_WORKER_TRANSLATIONS.statusError,
};

const CONNECTION_TRANSLATIONS: Record<QueueConnectionState, string> = {
  connected: QUEUE_WORKER_TRANSLATIONS.socketConnected,
  disconnected: QUEUE_WORKER_TRANSLATIONS.socketDisconnected,
  reconnecting: QUEUE_WORKER_TRANSLATIONS.socketReconnecting,
};

const mergeQueueResult = (row: QueueRow, payload: QueueResultEvent): QueueRow => {
  if (row.requestId !== payload.requestId) {
    return row;
  }

  const nextStatus =
    payload.status ?? (payload.error ? 'error' : payload.result ? 'done' : row.status);
  const nextResult = payload.result ?? row.result;
  const nextError = payload.error ?? row.error;

  if (nextStatus === row.status && nextResult === row.result && nextError === row.error) {
    return row;
  }

  return {
    ...row,
    status: nextStatus,
    result: nextResult,
    error: nextError,
  };
};

export const QueueWorkerPage = () => {
  const [rows, setRows] = useState<QueueRow[]>(() => makeInitialRows());
  const [connectionState, setConnectionState] = useState<QueueConnectionState>('disconnected');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [isPreflightChecking, setIsPreflightChecking] = useState(true);
  const [isSocketWatchdogVisible, setIsSocketWatchdogVisible] = useState(false);
  const pollInFlightRef = useRef(false);
  const lastQueueUpdateAtRef = useRef(Date.now());

  const [createQueueJob] = useCreateQueueJobMutation();

  const isSocketConnected = connectionState === 'connected';

  useEffect(() => {
    let isCancelled = false;

    const runPreflight = async () => {
      setIsPreflightChecking(true);
      const result = await runQueueRuntimePreflight();

      if (isCancelled) {
        return;
      }

      if (!result.ok) {
        setPreflightError(result.message ?? i18next.t(COMMON_TRANSLATIONS.error));
      } else {
        setPreflightError(null);
      }

      setIsPreflightChecking(false);
    };

    void runPreflight();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = connectQueueSocket({
      onConnectionStateChange: (state) => {
        setConnectionState(state);

        if (state === 'connected') {
          lastQueueUpdateAtRef.current = Date.now();
          setIsSocketWatchdogVisible(false);
        }
      },
      onQueueResult: (payload: QueueResultEvent) => {
        lastQueueUpdateAtRef.current = Date.now();
        setIsSocketWatchdogVisible(false);

        setRows((currentRows) => {
          let hasChanges = false;

          const nextRows = currentRows.map((row) => {
            const nextRow = mergeQueueResult(row, payload);

            if (nextRow !== row) {
              hasChanges = true;
            }

            return nextRow;
          });

          return hasChanges ? nextRows : currentRows;
        });
      },
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (connectionState !== 'connected') {
      setIsSocketWatchdogVisible(false);
      return;
    }

    const hasPendingRows = rows.some(
      (row) =>
        row.status === 'pending' && typeof row.requestId === 'string' && row.requestId.length > 0,
    );

    if (!hasPendingRows) {
      setIsSocketWatchdogVisible(false);
      return;
    }

    const intervalId = window.setInterval(() => {
      const staleDurationMs = Date.now() - lastQueueUpdateAtRef.current;
      if (staleDurationMs >= SOCKET_STALL_THRESHOLD_MS) {
        setIsSocketWatchdogVisible(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connectionState, rows]);

  useEffect(() => {
    if (connectionState === 'connected') {
      return;
    }

    const requestIds = rows
      .filter(
        (row): row is QueueRow & { requestId: string } =>
          row.status === 'pending' && typeof row.requestId === 'string',
      )
      .map((row) => row.requestId);

    if (requestIds.length === 0) {
      return;
    }

    let isCancelled = false;

    const pollQueueStatus = async () => {
      if (pollInFlightRef.current) {
        return;
      }

      pollInFlightRef.current = true;

      try {
        const pollResults = await Promise.all(
          requestIds.map((requestId) => fetchQueueJobById(requestId)),
        );

        if (isCancelled) {
          return;
        }

        const resultsByRequestId = new Map<string, QueueResultEvent>();

        pollResults.forEach((result) => {
          if (!result) {
            return;
          }

          resultsByRequestId.set(result.requestId, result);
        });

        if (resultsByRequestId.size === 0) {
          return;
        }

        setRows((currentRows) => {
          let hasChanges = false;

          const nextRows = currentRows.map((row) => {
            if (!row.requestId) {
              return row;
            }

            const queueResult = resultsByRequestId.get(row.requestId);

            if (!queueResult) {
              return row;
            }

            const nextRow = mergeQueueResult(row, queueResult);

            if (nextRow !== row) {
              hasChanges = true;
            }

            return nextRow;
          });

          return hasChanges ? nextRows : currentRows;
        });
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void pollQueueStatus();
    const intervalId = window.setInterval(() => {
      void pollQueueStatus();
    }, 1500);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [connectionState, rows]);

  const runBatch = async () => {
    if (isPreflightChecking) {
      return;
    }

    if (preflightError) {
      setErrorMessage(preflightError);
      return;
    }

    lastQueueUpdateAtRef.current = Date.now();
    setIsSocketWatchdogVisible(false);
    setErrorMessage(null);
    setIsSubmitting(true);

    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        status: 'pending',
        requestId: undefined,
        result: undefined,
        error: undefined,
      })),
    );

    const createRequests = makeInitialRows().map(async (row) => {
      const updateRow = (nextRow: QueueRow) => {
        setRows((currentRows) =>
          currentRows.map((currentRow) =>
            currentRow.clientId === row.clientId ? nextRow : currentRow,
          ),
        );
      };

      try {
        const created = await createQueueJob({ clientId: row.clientId }).unwrap();

        if (!created.requestId) {
          updateRow({
            clientId: row.clientId,
            status: 'error',
            error: i18next.t(COMMON_TRANSLATIONS.error),
          });

          return false;
        }

        // Queue state is controlled by socket events; initial request only registers requestId.
        updateRow({
          clientId: row.clientId,
          status: 'pending',
          requestId: created.requestId,
          result: undefined,
          error: undefined,
        });

        return true;
      } catch (error) {
        updateRow({
          clientId: row.clientId,
          status: 'error',
          error: getApiErrorMessage(error, COMMON_TRANSLATIONS.error),
        });

        return false;
      }
    });

    const createdRows = await Promise.all(createRequests);

    if (createdRows.every((isCreated) => !isCreated)) {
      setErrorMessage(i18next.t(COMMON_TRANSLATIONS.error));
    }

    setIsSubmitting(false);
  };

  const resetRows = () => {
    setRows(makeInitialRows());
    setErrorMessage(null);
  };

  const socketLabel = useMemo(
    () => i18next.t(CONNECTION_TRANSLATIONS[connectionState]),
    [connectionState],
  );

  return (
    <section className={cn(BLOCK_NAME)}>
      <header className={cn(`${BLOCK_NAME}__header`)}>
        <Heading as="h2" className={cn(`${BLOCK_NAME}__title`)} size="5">
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.title)}
        </Heading>
        <Text as="p" className={cn(`${BLOCK_NAME}__subtitle`)}>
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.description)}
        </Text>
      </header>

      <div className={cn(`${BLOCK_NAME}__actions`)}>
        <button
          className={cn(`${BLOCK_NAME}__action-button`)}
          type="button"
          disabled={isSubmitting || isPreflightChecking || Boolean(preflightError)}
          onClick={() => void runBatch()}
        >
          {isSubmitting
            ? i18next.t(COMMON_TRANSLATIONS.loading)
            : i18next.t(QUEUE_WORKER_TRANSLATIONS.runBatch)}
        </button>
        <button
          className={cn(`${BLOCK_NAME}__action-button`)}
          type="button"
          disabled={isSubmitting}
          onClick={resetRows}
        >
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.reset)}
        </button>
      </div>

      <Text
        as="p"
        className={cn(`${BLOCK_NAME}__socket-status`, {
          [`${BLOCK_NAME}__socket-status--ok`]: isSocketConnected,
          [`${BLOCK_NAME}__socket-status--warning`]: connectionState !== 'connected',
        })}
      >
        {socketLabel}
      </Text>

      {connectionState !== 'connected' ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__socket-note`)}>
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.pollingFallback)}
        </Text>
      ) : null}

      {isPreflightChecking ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__socket-note`)}>
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.runtimePreflightChecking)}
        </Text>
      ) : null}

      {isSocketWatchdogVisible ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__error-block`)}>
          {i18next.t(QUEUE_WORKER_TRANSLATIONS.socketWatchdogWarning)}
        </Text>
      ) : null}

      {preflightError ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__error-block`)}>
          {preflightError}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text as="p" className={cn(`${BLOCK_NAME}__error-block`)}>
          {errorMessage}
        </Text>
      ) : null}

      <div className={cn(`${BLOCK_NAME}__table-wrapper`)}>
        <table className={cn(`${BLOCK_NAME}__table`)}>
          <thead>
            <tr>
              <th>
                <Text as="span">#</Text>
              </th>
              <th>
                <Text as="span">{i18next.t(QUEUE_WORKER_TRANSLATIONS.statusLabel)}</Text>
              </th>
              <th>
                <Text as="span">{i18next.t(QUEUE_WORKER_TRANSLATIONS.resultLabel)}</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.clientId}>
                <td>
                  <Text as="span">{row.clientId}</Text>
                </td>
                <td>
                  <Text as="span">{i18next.t(STATUS_TRANSLATIONS[row.status])}</Text>
                </td>
                <td>
                  <Text as="span">{row.result || row.error || '-'}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
