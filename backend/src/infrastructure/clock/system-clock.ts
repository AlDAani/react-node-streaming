import type { ClockPort } from '../../application/ports/out';

export class SystemClock implements ClockPort {
  nowIso(): string {
    return new Date().toISOString();
  }
}
