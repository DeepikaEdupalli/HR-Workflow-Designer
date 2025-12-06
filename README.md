This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project is a visual workflow-builder built using Next.js, React Flow, TailwindCSS, and a lightweight mock API.
Users can design HR workflows using drag-and-drop nodes, edit node configurations, run simulations, and export/import workflows.

## Architecture Overview

The application is split into several logical layers:
1. UI Layer (React + TailwindCSS)
    - Provides layout: left toolbar, center canvas, right inspector panel.
    - Responsive and styled using TailwindCSS.

2. Canvas / Graph Engine (React Flow)

    Located in workflowCanvas.tsx 
        - workflowCanvas
        - Renders the workflow graph.
        - Supports:
        - Drag-and-drop node creation
        - Node selection & editing
        - Edge creation with custom rules (Start cannot have incoming; End cannot have outgoing)
        - Fit-view, zooming, and panning
        - Minimap, background grid

3. Node Types & Strong Typing (TypeScript)

    types.tsx defines all node structures and guarantees correctness.
        - types
        - start, task, approval, automated, end nodes
        - Each node has typed attributes (assignee, metadata, action params, etc.)

4. Node Factory Utility

    createNode() in utility.tsx generates new nodes with defaults.
        - utility
        - Unique node IDs
        - Default positioning
        - Default values for every node type

5. Mock API Layer

    mockapi.tsx simulates:
        - mockapi
        - /automations — returns mock automated actions
        - /simulate — executes workflow logic, validates graph, returns logs
        - Detects cycles, incomplete paths, and prints execution trace

6. Workflow Editor UI

    The right panel (NodeFormPanel) lets users edit:
        - Titles
        - Assignees
        - Action parameters
        - Approval thresholds
        - Metadata
        - End node summary preferences

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Build for Production

```bash
npm run build
npm start
```
## Design Decisions

1. React Flow for Graph Engine

    React Flow was chosen because:
       -  Easy custom node rendering
       -  Stable drag-and-drop behavior
       -  Large ecosystem
       -  Supports panning/zooming/controls out of the box

2. Fully Typed Node Data (TypeScript)

    Reasons: 
       - Every node type has its own schema. 
       - No runtime shape errors
       - Form fields adapt automatically
       - Safer simulation logic

3. Mock API Instead of Real Backend

    Reasons:
       - Fast to iterate
       - No server dependency
       - Easy for interview/project demo
       - Backend can be added later without changing UI architecture.

4. Simulation Engine is Deterministic

    Reasons: 
       - Traverses graph linearly
       - Allows branching but logs only first path
       - Works with all node types including automations

5. JSON Export / Import

    Enables sharing workflows or saving them locally without backend.

### What Has Been Completed

1. Drag & drop nodes

2. Start / End / Task / Approval / Automated nodes

3. Node editor panel

4. Simulation system with logs

5. Cycle detection

6. Save/Load workflow JSON

7. Custom constraints (start can't receive, end can't send)

8. Fit view, zoom, minimap, background grid

9. Clean component architecture & file separation

10. Automation Features

11. Fetch mock automations

12. Render dynamic parameters based on automation type

13. Simulation prints automation actions + parameters

### TO DO

1. Branch Handling (Decision Nodes) which supports Conditional edges, Multi-path execution and Rule engine

2. Real Backend with Persistent DB, Multi-user sharing, Real automation execution and Auth

3. Icons for node types, Color coding, Custom shapes instead of basic node cards.

4. Workflow Validation Screen which shows Unconnected nodes, Missing required fields and Simulated warnings

5. Undo / Redo (History)

6. Animate execution path on canvas.

7. Mobile & Tablet Friendly UI

