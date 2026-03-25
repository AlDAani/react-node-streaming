export const DEFAULT_STREAM_PARAGRAPHS = 32;

export const STREAM_FRAGMENTS = [
  'Presight makes it easier to explore large lists without losing context.',
  'Each profile card should feel lightweight, informative, and easy to scan.',
  'Streaming text is useful when the UI needs to react before the full payload arrives.',
  'Queue-driven updates help the client render asynchronous work without blocking the request lifecycle.',
  'This MVP keeps persistence in memory so the exercise stays easy to boot and reason about.',
  'The long-term design can swap these modules for database-backed repositories without changing the HTTP contract.',
  'Reliable contracts matter more than overengineering the first version of the system.',
  'Socket events should be easy to correlate with pending list rows in the client interface.',
] as const;
