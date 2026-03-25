import { createLongText } from '@/domain/stream-text';
import { STREAM_CHUNK_SIZE, STREAM_INTERVAL_MS } from '@/infrastructure/runtime/constants';

interface IReadableRequest {
  once(event: 'close', listener: () => void): void;
}

interface IWritableResponse {
  write(chunk: string): boolean;
  once(event: 'drain', listener: () => void): void;
  writableEnded: boolean;
  end(): void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitDrainOrClose(req: IReadableRequest, res: IWritableResponse): Promise<'drain' | 'close'> {
  return new Promise((resolve) => {
    let isSettled = false;

    req.once('close', () => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      resolve('close');
    });

    res.once('drain', () => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      resolve('drain');
    });
  });
}

export function createStreamTextPayload(): string {
  return createLongText();
}

export async function streamTextWithBackpressure(
  req: IReadableRequest,
  res: IWritableResponse,
  text: string,
): Promise<void> {
  let cursor = 0;
  let isClosed = false;

  req.once('close', () => {
    isClosed = true;
  });

  while (cursor < text.length && !isClosed) {
    const chunk = text.slice(cursor, cursor + STREAM_CHUNK_SIZE);
    cursor += STREAM_CHUNK_SIZE;

    const writable = res.write(chunk);
    if (!writable) {
      const event = await waitDrainOrClose(req, res);
      if (isClosed || event === 'close') {
        return;
      }
    }

    if (STREAM_INTERVAL_MS > 0) {
      await sleep(STREAM_INTERVAL_MS);
    }
  }

  if (!res.writableEnded) {
    res.end();
  }
}
