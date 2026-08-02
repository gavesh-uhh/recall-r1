# Recall Backend

Spring Boot backend service for logging errors, ranking solution fixes using recency/decay scoring, and detecting cross-project error patterns.

## Quick Start

Requires **Java 21+** and **Maven 3.9+**.

```bash
mvn spring-boot:run   # Starts server on http://localhost:8080
mvn test              # Run unit tests
```

- **Health Check**: `http://localhost:8080/api/health`
- **H2 DB Console**: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:~/recall-db`, User: `sa`, No password)

## Core Data Structures & Usage

Custom in-memory data structures built over H2 persistence:

| Structure | Purpose | Usage in Application |
|---|---|---|
| `AVLTree` | Fast $O(\log n)$ signature lookup | Used in `ErrorRegistry` for `/api/errors/search` and prefix neighbor search. |
| `MaxHeap` | Dynamic solution ranking | Used in `SolutionRankingService` for decay-weighted solution ranking (`/api/errors/{id}/solutions`). |
| `Graph` | Error relation mapping & clustering | Used in `ErrorRelationService` for BFS traversal (`/api/errors/{id}/related`) and pattern detection (`/api/patterns`). |

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/errors` | Log a new error |
| `GET` | `/api/errors/search?signature=` | Search errors by signature |
| `POST` | `/api/errors/{id}/solutions` | Attach a solution to an error |
| `GET` | `/api/errors/{id}/solutions` | Get decay-ranked solutions |
| `PATCH` | `/api/solutions/{id}/feedback` | Update solution success/rating |
| `GET` | `/api/patterns` | Fetch error patterns across projects |
| `GET` | `/api/errors/{id}/related` | Traverse related error network |
| `POST` | `/api/admin/rebuild-index` | Rebuild in-memory indexes |

## Code Architecture

```
com.recall
├── controller     # REST endpoints & exception handlers
├── service        # Business logic & index synchronization
├── repository     # Spring Data JPA repositories
├── entity         # Error, Solution, Session & Relation entities
├── datastructure  # Custom AVLTree, MaxHeap, and Graph implementations
└── dto            # API request/response DTOs
```
