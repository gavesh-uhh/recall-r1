# Recall

A backend for remembering how you fixed things. You log an error, attach the solutions you tried,
and Recall ranks them by what has actually worked recently — a fix that worked twenty times last
year loses to one that worked yesterday. It also links related errors across projects, so a bug
that keeps resurfacing in different codebases shows up as a pattern instead of three separate
mysteries.

Spring Boot + embedded H2. The AVL tree, max heap, and graph are hand-rolled rather than taken
from `java.util` — they are the point of the project, not an implementation detail.

## Setup

Requires **Java 21+** and **Maven 3.9+**.

```bash
mvn spring-boot:run     # starts on http://localhost:8080
mvn test                # 54 unit tests, no Spring context needed
```

No database setup step. H2 creates `~/recall-db.mv.db` on first run and Hibernate builds the
schema (`error_record`, `solution`, `debug_session`, `error_relation`, `error_record_tags`).
Confirm it came up:

```bash
curl localhost:8080/api/health     # {"status":"ok","indexStale":false}
```

Browse the data at `http://localhost:8080/h2-console` — JDBC URL `jdbc:h2:file:~/recall-db`,
user `sa`, no password.

## Try it

```bash
# log an error
curl -X POST localhost:8080/api/errors -H 'Content-Type: application/json' -d '{
  "signature":"NullPointerException:userService.load",
  "message":"Cannot invoke getName() because user is null",
  "language":"java","project":"my-app","tags":["npe"]}'

# attach a solution
curl -X POST localhost:8080/api/errors/1/solutions -H 'Content-Type: application/json' -d '{
  "description":"guard against a null user before calling getName()",
  "successCount":3,"lastSuccessDate":"2026-07-27T10:00:00","feedbackScore":4}'

# ranked solutions, best first
curl localhost:8080/api/errors/1/solutions

# record that it worked again — this moves it up in future rankings
curl -X PATCH localhost:8080/api/solutions/1/feedback \
  -H 'Content-Type: application/json' -d '{"success":true,"rating":5}'
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | liveness check, reports `indexStale` |
| POST | `/api/errors` | log an error |
| GET | `/api/errors/{id}` | fetch one |
| GET | `/api/errors/search?signature=` | O(log n) AVL lookup |
| GET | `/api/errors?project=&language=` | browse with filters |
| DELETE | `/api/errors/{id}` | delete, cascading to solutions/sessions/edges |
| POST | `/api/errors/{id}/solutions` | attach a solution |
| GET | `/api/errors/{id}/solutions` | ranked, each with its `decayScore` |
| PATCH | `/api/solutions/{id}/feedback` | `{success, rating?}` |
| POST | `/api/sessions` | log a debugging session |
| GET | `/api/sessions?project=&errorId=` | list sessions |
| POST | `/api/errors/{id}/relations` | link two errors manually |
| GET | `/api/errors/{id}/related?depth=` | BFS out from an error |
| GET | `/api/patterns` | errors clustered across ≥2 projects |
| POST | `/api/admin/rebuild-index` | rebuild in-memory indexes from H2 |

Errors come back as `{timestamp, status, error, message}`: 404 for a missing record,
400 for bad input, 500 otherwise.

## How it works

H2 is the durability layer; the three structures are in-memory indexes over it.

| Structure | Role | Lifecycle |
|---|---|---|
| `AVLTree<String, Long>` | `signature` → error id, O(log n) | rebuilt at startup |
| `MaxHeap<Solution>` | ranks solutions | built per request |
| `Graph<Long>` | error relations, BFS + components | rebuilt at startup |

**Ranking.** `score = (successRate*w1 + usageFrequency*w2 + feedback*w3) * exp(-λ * daysSinceLastSuccess)`

All three terms are normalised to 0–1 so no single one dominates: `usageFrequency` saturates at
`recall.heap.frequency-saturation` attempts and feedback is rescaled from its 0–5 capture range.
A solution that has never succeeded scores 0. The heap is rebuilt per query because scores depend
on *now* — a cached ordering would silently rot.

**Relations.** Edges are undirected and stored in `error_relation`, so the graph survives a
restart. Three rules create them: same project plus a fuzzy signature match
(common prefix length `≥ recall.graph.prefix-threshold` via BST neighbor search), a shared tag,
or a manual link. `/api/patterns` reports connected components spanning two or more projects.

**Staying in sync.** Writes go to H2 first, then to the in-memory index. If the second step fails
the registry is flagged stale (visible in `/api/health`) rather than left quietly diverged;
`/api/admin/rebuild-index` repairs it. Access is guarded by a read-write lock, since HTTP threads
mutate the structures concurrently.

## Config

Set in `src/main/resources/application.properties`.

| Property | Default | Meaning |
|---|---|---|
| `recall.decay.lambda` | `0.05` | decay per day since last success |
| `recall.heap.weights.w1/w2/w3` | `0.5/0.3/0.2` | success rate / frequency / feedback |
| `recall.heap.frequency-saturation` | `10.0` | attempts at which frequency hits 1.0 |
| `recall.graph.prefix-threshold` | `30` | minimum common-prefix character count needed to auto-link |

## Layout

```
com.recall
├── controller       REST endpoints + global exception handling
├── service          business logic, index sync, startup bootstrap
├── repository       Spring Data JPA
├── entity           ErrorRecord, Solution, DebugSession, ErrorRelation
├── datastructure    AVLTree, MaxHeap, Graph, SignatureSimilarity, DecayFunction
└── dto              request/response records
```

`datastructure` has no Spring dependencies and is unit-tested in isolation.
