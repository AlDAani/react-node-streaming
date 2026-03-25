import assert from 'node:assert/strict';
import test from 'node:test';
import { MetricsService } from './index';
import { METRIC_NAMES } from './constants';

test('MetricsService exposes expected metric names', async () => {
  const metrics = new MetricsService();
  metrics.observeHttp({ method: 'get', route: '/health', statusCode: 200, durationMs: 12 });
  metrics.incQueueJobsTotal();
  metrics.incQueueJobsCompletedTotal();

  const output = await metrics.metrics();
  assert.match(output, new RegExp(METRIC_NAMES.HTTP_REQUESTS_TOTAL));
  assert.match(output, new RegExp(METRIC_NAMES.QUEUE_JOBS_TOTAL));
  assert.match(output, new RegExp(METRIC_NAMES.QUEUE_JOBS_COMPLETED_TOTAL));
});
