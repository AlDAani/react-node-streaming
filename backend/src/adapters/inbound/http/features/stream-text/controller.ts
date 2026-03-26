import type { NextFunction, Request, Response } from 'express';
import type { GetStreamTextUseCase } from '@/application/usecases/stream-text/get-stream-text';

function createServerSentEvent(event: string, payload: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function createStreamTextController(useCase: GetStreamTextUseCase) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const text = useCase.createPayload();
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      await useCase.stream(req, res, text);
    } catch (error) {
      if (res.headersSent && !res.writableEnded) {
        res.write(
          createServerSentEvent('server-error', {
            message: error instanceof Error ? error.message : 'Stream failed.',
          }),
        );
        res.end();
        return;
      }

      next(error);
    }
  };
}
