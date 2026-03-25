import type { NextFunction, Request, Response } from 'express';
import type { GetStreamTextUseCase } from '@/application/usecases/stream-text/get-stream-text';

export function createStreamTextController(useCase: GetStreamTextUseCase) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const text = useCase.createPayload();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      await useCase.stream(req, res, text);
    } catch (error) {
      next(error);
    }
  };
}
