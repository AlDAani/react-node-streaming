import type {
  IReadableStreamRequest,
  IWritableStreamResponse,
  StreamTextPort,
} from '../../ports/out';

export class GetStreamTextUseCase {
  constructor(private readonly streamText: StreamTextPort) {}

  createPayload(): string {
    return this.streamText.createLongText();
  }

  stream(
    req: IReadableStreamRequest,
    res: IWritableStreamResponse,
    text: string,
  ): Promise<void> {
    return this.streamText.streamTextWithBackpressure(req, res, text);
  }
}
