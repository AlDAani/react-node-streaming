import { openStreamText } from './api';
import type {
  EventSourceFactory,
  EventSourceLike,
  EventSourceListener,
  StreamEvent,
} from './types';

class FakeEventSource implements EventSourceLike {
  private readonly listeners = new Map<string, Set<EventSourceListener>>();

  close = vi.fn();

  addEventListener(type: string, listener: EventSourceListener) {
    const currentListeners = this.listeners.get(type) ?? new Set<EventSourceListener>();
    currentListeners.add(listener);
    this.listeners.set(type, currentListeners);
  }

  removeEventListener(type: string, listener: EventSourceListener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: Event | MessageEvent<string>) {
    this.listeners.get(type)?.forEach((listener) => {
      listener(event);
    });
  }
}

describe('openStreamText', () => {
  it('emits progressive delta events and done event from SSE stream', async () => {
    const events: StreamEvent[] = [];
    const source = new FakeEventSource();
    const eventSourceFactory: EventSourceFactory = vi.fn(() => source);

    const streamPromise = openStreamText({
      eventSourceFactory,
      onEvent: (event) => {
        events.push(event);
      },
    });

    source.emit(
      'delta',
      new MessageEvent('delta', {
        data: JSON.stringify({ delta: 'Hello ' }),
      }),
    );
    source.emit(
      'delta',
      new MessageEvent('delta', {
        data: JSON.stringify({ delta: 'stream ' }),
      }),
    );
    source.emit(
      'delta',
      new MessageEvent('delta', {
        data: JSON.stringify({ delta: 'world' }),
      }),
    );
    source.emit(
      'done',
      new MessageEvent('done', {
        data: '{}',
      }),
    );

    await streamPromise;

    expect(eventSourceFactory).toHaveBeenCalledTimes(1);
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      { type: 'delta', delta: 'Hello ' },
      { type: 'delta', delta: 'stream ' },
      { type: 'delta', delta: 'world' },
      { type: 'done' },
    ]);
  });
});
