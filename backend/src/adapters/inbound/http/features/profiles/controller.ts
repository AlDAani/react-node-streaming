import type { Request, Response } from 'express';
import type { IServerConfig } from '@/infrastructure/config/types';
import { getRequestId } from '@/infrastructure/http/middleware/request-id';
import type { ProfilesService } from './service';
import { validateListProfilesQuery } from './schemas';

export function createListProfilesController(service: ProfilesService, config: IServerConfig) {
  return (req: Request, res: Response): void => {
    const params = validateListProfilesQuery(req.query, config);
    const result = service.listProfiles(params);

    res.json({
      data: result.items,
      meta: {
        requestId: getRequestId(req),
        pagination: {
          cursor: params.cursor,
          limit: params.limit,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          total: result.total,
        },
        filters: {
          search: params.search,
          nationality: params.nationality || null,
          hobby: params.hobby || null,
          ageMin: params.ageMin,
          ageMax: params.ageMax,
        },
      },
    });
  };
}

export function createProfilesFacetsController(service: ProfilesService) {
  return (req: Request, res: Response): void => {
    res.json({
      data: service.listFacets(20),
      meta: {
        requestId: getRequestId(req),
      },
    });
  };
}
