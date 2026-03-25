# presight-backend

## Architectural Pattern: Hexagonal Architecture

Hexagonal Architecture isolates the core business logic from external concerns (HTTP, sockets, storage, workers) through well-defined interfaces called **Ports**. Concrete implementations of these interfaces are called **Adapters**.

### Key Principles

- **Domain-Centric Design**: Business logic lives in the center, independent of frameworks and infrastructure.
- **Dependency Inversion**: External systems depend on the domain/application ports, not vice versa.
- **Testability**: Core logic can be tested without infrastructure dependencies.
- **Flexibility**: Adapters can be swapped without changing business logic.

### Directory Structure (Project Mapping)

```text
src/
├── domain/                          # Core domain models/types/constants
│   ├── profiles/
│   ├── queue/
│   └── stream-text/
│
├── application/                     # Application layer (use cases + ports)
│   ├── contracts/                   # DTOs/contracts used by use cases/adapters
│   ├── errors/                      # Application-level errors (non-HTTP)
│   ├── ports/
│   │   └── out/                     # Output port interfaces
│   └── usecases/                    # Application services/use cases
│
├── adapters/                        # Adapter layer
│   ├── inbound/                     # Driving adapters
│   │   ├── http/                    # REST routes/controllers/schemas
│   │   └── socket/                  # WebSocket gateway/events
│   └── outbound/                    # Driven adapters
│       └── in-memory/               # In-memory repositories/queue/worker bridge
│
└── infrastructure/                  # Runtime/framework concerns
    ├── config/
    ├── runtime/                     # Composition root (wiring)
    ├── http/                        # Express app + middleware setup
    ├── metrics/
    ├── observability/
    └── rate-limit/
```

## Dependency Rules

- `domain` must not depend on `application`, `adapters`, `infrastructure`, or transport frameworks.
- `application` depends on `domain` and its own ports/contracts only.
- `adapters` implement/use `application` ports and map transport concerns.
- `infrastructure/runtime` is the composition root (wires everything together).
- HTTP-shaped errors are handled in inbound HTTP adapters, not in use cases.

## Request Flow

### Profiles (pagination/filter/search)

`HTTP -> inbound controller -> application use case -> ProfilesReadPort -> in-memory adapter -> HTTP response`

### Stream Text

`HTTP -> inbound controller -> application use case -> StreamTextPort -> adapter chunk writes -> streamed response`

### Queue + WebSocket

`POST /api/jobs -> enqueue use case -> JobsQueuePort -> worker-thread processing -> socket emit queue-result`

## Canonical API Contracts

### HTTP

- `GET /health`
- `GET /metrics`
- `GET /api/profiles`
- `GET /api/profiles/facets`
- `GET /api/stream-text`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`

### Socket Events

- `jobs:snapshot`
- `queue-result`

Removed legacy aliases:

- `POST /api/queue-jobs`
- `job-result`
- `job:updated`

## Queue Behavior

- New jobs return `pending` immediately.
- Requests are processed asynchronously in worker threads.
- Completion/failure is pushed via websocket (`queue-result`).
- In-memory queue limits and rate limiting are configurable.

## Error Envelope

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry later.",
    "details": null,
    "requestId": "<id>"
  }
}
```

## Scripts

- `pnpm --filter presight-backend dev`
- `pnpm --filter presight-backend build`
- `pnpm --filter presight-backend test`
- `pnpm --filter presight-backend start`
