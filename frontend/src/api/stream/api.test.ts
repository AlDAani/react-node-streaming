import { openStreamText } from './api';
import type { StreamEvent } from './types';

const createChunkedResponse = (chunks: string[]): Response => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });

  return new Response(stream, { status: 200 });
};

describe('openStreamText', () => {
  it('emits progressive delta events and done event from network stream', async () => {
    const events: StreamEvent[] = [];
    const fetchImpl = vi.fn(async () => createChunkedResponse(['Hello ', 'stream ', 'world']));

    await openStreamText({
      fetchImpl,
      onEvent: (event) => {
        events.push(event);
      },
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      { type: 'delta', delta: 'Hello ' },
      { type: 'delta', delta: 'stream ' },
      { type: 'delta', delta: 'world' },
      { type: 'done' },
    ]);
  });
});
