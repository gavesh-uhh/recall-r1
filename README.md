# Recall R1

An error tracking and solution ranking system that logs errors, ranks solution fixes based on recency and success rate, and detects pattern clusters across projects.

## 🧠 Data Structures & Usage

* **AVL Tree (`AVLTree`)**: Fast $O(\log n)$ error signature lookups and prefix searching in Error Explorer (`/api/errors/search`).
* **Max Heap (`MaxHeap`)**: Dynamic, decay-weighted solution ranking in Solution Ranker (`/api/errors/{id}/solutions`).
* **Graph (`Graph`)**: Error network traversal (BFS) and cross-project pattern clustering in Pattern Graph (`/api/patterns` & `/api/errors/{id}/related`).

## Modules

* **[`backend`](./backend)**: Java 21 & Spring Boot REST API (embedded H2, custom AVL Tree, Max Heap, and Graph structures).
* **[`desktop-app`](./desktop-app)**: Desktop client built with Electron, React, TypeScript, and Tailwind CSS.

## Quick Start

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
```
* API: `http://localhost:8080`
* DB Console: `http://localhost:8080/h2-console`

### 2. Start Desktop App
```bash
cd desktop-app
npm install
npm start
```

