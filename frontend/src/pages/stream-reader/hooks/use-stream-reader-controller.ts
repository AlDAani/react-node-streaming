import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { openStreamText, type OpenStreamTextParams, type StreamEvent } from '@/api/stream';
import { getApiErrorMessage } from '@/api/utils/api-error';
import { STREAM_READER_TRANSLATIONS } from '@/constants/i18next/stream-reader-translations';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'stopped' | 'done' | 'error';

type OpenStreamFn = (params: OpenStreamTextParams) => Promise<void>;

type UseStreamReaderControllerOptions = {
  openStream?: OpenStreamFn;
};

type StreamReaderController = {
  status: StreamStatus;
  displayedText: string;
  errorMessage: string | null;
  isComplete: boolean;
  start: () => Promise<void>;
  stop: () => void;
};

const isActiveStatus = (status: StreamStatus): boolean =>
  status === 'connecting' || status === 'streaming';

export const useStreamReaderController = ({
  openStream = openStreamText,
}: UseStreamReaderControllerOptions = {}): StreamReaderController => {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [displayedText, setDisplayedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusRef = useRef<StreamStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef('');
  const pendingCharsRef = useRef<string[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const setStreamStatus = useCallback((nextStatus: StreamStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const typeNextCharacter = useCallback(() => {
    const nextCharacter = pendingCharsRef.current.shift();

    if (!nextCharacter) {
      animationFrameRef.current = null;
      return;
    }

    startTransition(() => {
      setDisplayedText((prev) => prev + nextCharacter);
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    const tick = () => {
      animationFrameRef.current = null;
      typeNextCharacter();

      if (pendingCharsRef.current.length > 0) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, [typeNextCharacter]);

  const stopTypingAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handleEvent = useCallback(
    (event: StreamEvent) => {
      if (event.type === 'delta') {
        if (statusRef.current === 'connecting') {
          setStreamStatus('streaming');
        }

        if (!event.delta) {
          return;
        }

        fullTextRef.current += event.delta;
        pendingCharsRef.current.push(...event.delta.split(''));
        scheduleFlush();
        return;
      }

      if (event.type === 'done') {
        stopTypingAnimation();
        pendingCharsRef.current = [];
        setDisplayedText(fullTextRef.current);
        setStreamStatus('done');
        return;
      }

      if (event.type === 'error') {
        stopTypingAnimation();
        pendingCharsRef.current = [];
        setErrorMessage(getApiErrorMessage(event.error, STREAM_READER_TRANSLATIONS.error));
        setStreamStatus('error');
      }
    },
    [scheduleFlush, setStreamStatus, stopTypingAnimation],
  );

  const stop = useCallback(() => {
    const currentRequestController = abortControllerRef.current;

    if (currentRequestController) {
      currentRequestController.abort();
      abortControllerRef.current = null;
    }

    stopTypingAnimation();
    pendingCharsRef.current = [];

    if (isActiveStatus(statusRef.current)) {
      setStreamStatus('stopped');
    }
  }, [setStreamStatus, stopTypingAnimation]);

  const start = useCallback(async () => {
    stop();

    fullTextRef.current = '';
    pendingCharsRef.current = [];
    setDisplayedText('');
    setErrorMessage(null);
    setStreamStatus('connecting');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await openStream({
        signal: controller.signal,
        onEvent: (event) => {
          if (controller.signal.aborted) {
            return;
          }

          handleEvent(event);
        },
      });
    } catch {
      if (!controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(undefined, STREAM_READER_TRANSLATIONS.error));
        setStreamStatus('error');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [handleEvent, openStream, setStreamStatus, stop]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      stopTypingAnimation();
    };
  }, [stopTypingAnimation]);

  return {
    status,
    displayedText,
    errorMessage,
    isComplete: status === 'done',
    start,
    stop,
  };
};
