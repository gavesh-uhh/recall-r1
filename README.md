# Recall (recall-r1)

A intelligent error memory and solution tracking system. **Recall** helps developers log software errors, record tried solutions, rank fixes based on recency and past success rates, and identify resurfacing error patterns across different codebases and projects.

---

## 🏗️ Architecture

This repository is structured into two main components:

| Component | Stack | Description |
| --- | --- | --- |
| **`backend/`** | Spring Boot, Java 21, H2 Database | Core REST API and business logic. Implements custom, hand-rolled in-memory data structures (`AVLTree`, `MaxHeap`, `Graph`) to rank solutions and discover cross-project error relations. |
| **`desktop-app/`** | Electron, Vite, Node.js | Desktop GUI built with Electron + Vite for desktop interaction with Recall. |

---

## ✨ Features

- 🔍 **O(log n) Error Signature Search**: Powered by a custom in-memory **AVL Tree** for fast lookup of exact error signatures.
- 📈 **Smart Solution Ranking**: Uses a custom **Max Heap** with time-decay scoring (`score = (successRate * w1 + usageFrequency * w2 + feedback * w3) * e^(-λ * days)`). Recent, verified fixes rank higher than old ones.
- 🕸️ **Cross-Project Pattern Discovery**: Hand-rolled **Graph** with BFS traversal and connected components algorithms to automatically detect related errors across multiple projects using fuzzy similarity matching.
- 💾 **Durable & Resilient**: H2 embedded database handles persistent storage, synced with thread-safe in-memory indexes.

---

## 🚀 Quick Start

### Prerequisites
- **Java 21+** & **Maven 3.9+** (for Backend)
- **Node.js 18+** & **npm** (for Desktop App)

---

### 1. Running the Backend

```bash
cd backend

# Start the Spring Boot server (http://localhost:8080)
mvn spring-boot:run

# Run unit tests (54 isolated tests for data structures and services)
mvn test
```

Verify backend liveness:
```bash
curl http://localhost:8080/api/health
```

Access the embedded database console at `http://localhost:8080/h2-console` (`JDBC URL: jdbc:h2:file:~/recall-db`, user: `sa`, no password).

---

### 2. Running the Desktop App

```bash
cd desktop-app

# Install dependencies
npm install

# Start Electron dev mode
npm start
```

---

## 📡 API Overview (Backend)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | System health check and index status |
| `POST` | `/api/errors` | Log a new error record |
| `GET` | `/api/errors/{id}` | Get error details by ID |
| `GET` | `/api/errors/search?signature=` | O(log n) AVL tree search for error signature |
| `GET` | `/api/errors?project=&language=` | Filter error records |
| `POST` | `/api/errors/{id}/solutions` | Attach a solution to an error |
| `GET` | `/api/errors/{id}/solutions` | Retrieve ranked solutions for an error |
| `PATCH` | `/api/solutions/{id}/feedback` | Log feedback (`{success, rating}`) to update solution ranking |
| `GET` | `/api/errors/{id}/related?depth=` | BFS lookup for related errors |
| `GET` | `/api/patterns` | Detect error patterns spanning multiple projects |

---

## 📂 Repository Structure

```
recall-r1/
├── backend/                  # Spring Boot backend API
│   ├── src/main/java/com/recall/
│   │   ├── controller/       # REST endpoints
│   │   ├── datastructure/    # Hand-rolled AVLTree, MaxHeap, Graph
│   │   ├── entity/           # JPA entities
│   │   ├── repository/       # Spring Data JPA repositories
│   │   └── service/          # Core logic & index managers
│   └── pom.xml
├── desktop-app/              # Electron desktop application
│   ├── src/                  # Main, renderer, and preload scripts
│   ├── forge.config.js       # Electron Forge configuration
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📄 License

This project is licensed under the MIT License.
