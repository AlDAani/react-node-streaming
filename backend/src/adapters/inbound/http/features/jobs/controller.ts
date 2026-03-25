import type { Request, Response } from 'express';
import { getRequestId } from '@/infrastructure/http/middleware/request-id';
import { ApplicationError, APPLICATION_ERROR_CODES } from '@/application/errors';
import { ApiError } from '../../errors';
import type { JobsService } from './service';
import { validateJobPayload, validateJobsListLimit } from './schemas';

function toApiError(error: unknown): never {
  if (error instanceof ApplicationError) {
    if (error.code === APPLICATION_ERROR_CODES.QUEUE_FULL) {
      throw new ApiError(429, error.code, error.message, error.details);
    }

    if (error.code === APPLICATION_ERROR_CODES.JOB_NOT_FOUND) {
      throw new ApiError(404, error.code, error.message);
    }

    if (error.code === APPLICATION_ERROR_CODES.SERVER_SHUTTING_DOWN) {
      throw new ApiError(503, error.code, error.message);
    }
  }

  throw error;
}

export function createListJobsController(service: JobsService) {
  return (req: Request, res: Response): void => {
    try {
      const limit = validateJobsListLimit(req.query.limit);

      res.json({
        data: service.listJobs(limit),
        meta: {
          requestId: getRequestId(req),
        },
      });
    } catch (error) {
      toApiError(error);
    }
  };
}

export function createGetJobController(service: JobsService) {
  return (req: Request, res: Response): void => {
    try {
      const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;

      res.json({
        data: service.getJob(jobId),
        meta: {
          requestId: getRequestId(req),
        },
      });
    } catch (error) {
      toApiError(error);
    }
  };
}

export function createEnqueueJobController(service: JobsService) {
  return (req: Request, res: Response): void => {
    try {
      const payload = validateJobPayload(req.body);
      const job = service.enqueue(payload);

      res.status(202).json({
        data: job,
        meta: {
          requestId: getRequestId(req),
        },
      });
    } catch (error) {
      toApiError(error);
    }
  };
}
