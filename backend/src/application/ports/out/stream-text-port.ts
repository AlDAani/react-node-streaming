export interface IReadableStreamRequest {
  once(event: 'close', listener: () => void): void;
}

export interface IWritableStreamResponse {
  write(chunk: string): boolean;
  once(event: 'drain', listener: () => void): void;
  writableEnded: boolean;
  end(): void;
}

export interface StreamTextPort {
  createLongText(): string;
  streamTextWithBackpressure(
    req: IReadableStreamRequest,
    res: IWritableStreamResponse,
    text: string,
  ): Promise<void>;
}
