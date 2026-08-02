# Recall Desktop App

Desktop client for Recall R1 built with Electron, React 19, TypeScript, Vite, Tailwind CSS, and ECharts.

## Quick Start

Requires **Node.js 18+** and **npm**.

```bash
npm install     # Install dependencies
npm start       # Start desktop application in dev mode
npm run package # Package executable for local platform
```

* Ensure the Spring Boot backend service is running on `http://localhost:8080`.

## Key Features

- **Error Explorer**: Search and filter error signatures, messages, projects, and tags.
- **Solution Ranker**: View decay-ranked fixes with success scores and submit feedback ratings.
- **Pattern Graph**: Interactive ECharts graph visualization showing cross-project error clusters with project, edge, and layout dropdown filters.
- **Session Logger**: Track active debugging sessions and link resolution histories.
- **Project & Language Manager**: Manage project and language categories with real-time search.

## 🧠 Data Structures Integration

The desktop app visualizes and interacts with the backend's custom data structures:
* **AVL Tree**: Powers $O(\log n)$ instant signature search in the **Error Explorer**.
* **Max Heap**: Powers real-time decay-ranked solution scores in the **Solution Ranker**.
* **Graph**: Powers interactive node topology & related error networks in the **Pattern Graph**.

## Tech Stack

* **Core**: Electron, React 19, TypeScript
* **Build System**: Vite, Electron Forge
* **Styling**: Tailwind CSS
* **Data Visualization**: ECharts (`echarts-for-react`)
* **Icons**: Lucide React
