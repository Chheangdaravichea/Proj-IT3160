# Nagoya A* Live Demo

A web-based AI pathfinding demo for finding an optimal route between two places in central Nagoya, Japan. The project models the map as a weighted graph and applies the **A\*** search algorithm to find the lowest-cost path. It also includes an admin scenario page where rain zones and road blocks can be added to simulate changing traffic conditions.

This project was built for the course **IT3160 - Introduction to Artificial Intelligence**.

---

## 1. Main Features

### User Page

- Display an interactive Nagoya map using Leaflet and OpenStreetMap tiles.
- Select a start point and an end point on the map.
- Find the optimal route using the A* search algorithm.
- Show route distance, estimated travel time, selected node path, and visited nodes.
- Animate the A* search process using the **Show A* Search** button.
- Recalculate paths after admin scenarios change the graph weights.

### Admin Page

- Add rain zones on the map.
- Add road-block scenarios on the map.
- Apply penalty costs to affected graph edges.
- Delete one scenario or clear all scenarios.
- Simulate real traffic/environment conditions and observe how A* changes the route.

### Dataset

- The project uses a curated Nagoya graph dataset.
- Nodes represent landmarks or important areas in central Nagoya.
- Edges represent simplified road/path connections between nodes.
- Edge distances are stored in CSV and loaded by the backend.

---

## 2. AI Method Used

The project applies **A\* Search**, an informed search algorithm.

A* evaluates each candidate node by:

```text
f(n) = g(n) + h(n)
```

Where:

- `g(n)` is the real path cost from the start node to the current node.
- `h(n)` is the heuristic estimate from the current node to the goal node.
- `f(n)` is the estimated total cost of the route through node `n`.

In this project:

- `g(n)` is calculated using weighted road distance.
- `h(n)` is calculated using the Haversine distance between the current node and the destination node.
- Rain zones and road blocks increase edge weights, causing A* to avoid affected roads when better routes exist.

---

## 3. Project Structure

```text
nagoya_astar_project_with_dataset/
├── README.md
├── requirements.txt
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── path.py
│   │   │   └── scenarios.py
│   │   └── services/
│   │       ├── pathfinding.py
│   │       └── scenario.py
│   └── data/
│       ├── nagoya_nodes.csv
│       ├── nagoya_edges.csv
│       └── README_dataset.md
└── frontend/
    ├── index.html
    ├── admin.html
    ├── css/
    │   └── style.css
    └── js/
        ├── config.js
        ├── map.js
        ├── pathfinding.js
        └── admin.js
```

---

## 4. Folder and File Explanation

### Root Folder

| File | Description |
|---|---|
| `README.md` | Main project documentation for GitHub. |
| `requirements.txt` | Python packages required to run the backend. |

### Backend

| File/Folder | Description |
|---|---|
| `backend/app/main.py` | Entry point of the FastAPI backend. Creates the app, enables CORS, and registers API routers. |
| `backend/app/api/path.py` | Defines API endpoints for graph nodes and pathfinding. |
| `backend/app/api/scenarios.py` | Defines API endpoints for creating, listing, deleting, and clearing scenarios. |
| `backend/app/services/pathfinding.py` | Core A* logic. Loads dataset, builds graph, calculates Haversine distance, runs A*, and returns path results. |
| `backend/app/services/scenario.py` | Handles rain zones and road blocks. Finds affected edges and updates edge penalties. |
| `backend/data/nagoya_nodes.csv` | Dataset file containing node ID, place name, latitude, and longitude. |
| `backend/data/nagoya_edges.csv` | Dataset file containing graph edges and distance in meters. |
| `backend/data/README_dataset.md` | Documentation for the dataset. |

### Frontend

| File/Folder | Description |
|---|---|
| `frontend/index.html` | Main user interface for choosing start/end points and finding the path. |
| `frontend/admin.html` | Admin interface for adding rain zones and road blocks. |
| `frontend/css/style.css` | Styling for both user and admin pages. |
| `frontend/js/config.js` | Stores frontend configuration such as backend API URL and map settings. |
| `frontend/js/map.js` | Initializes the Leaflet map, markers, route lines, and map interactions. |
| `frontend/js/pathfinding.js` | Controls user page logic, API calls, route drawing, and A* animation. |
| `frontend/js/admin.js` | Controls admin page logic for creating/deleting scenarios. |

---

## 5. Dataset Description

The dataset is stored in:

```text
backend/data/
```

### `nagoya_nodes.csv`

This file stores all graph nodes.

Example columns:

```text
node_id,name,lat,lng
```

Each node represents an important place or landmark in central Nagoya.

### `nagoya_edges.csv`

This file stores all graph edges.

Example columns:

```text
from_node,to_node,distance_m
```

Each edge represents a simplified road/path connection between two nodes.

### Dataset Role in A*

- Nodes become states in the state space.
- Edges become valid transitions between states.
- Edge distance becomes the path cost.
- Latitude/longitude coordinates are used to calculate the heuristic.

This dataset is manually curated for educational demonstration, so it is not the full Nagoya road network.

---

## 6. Technologies Used

### Backend

- **Python**: Main backend programming language.
- **FastAPI**: Framework for building REST APIs.
- **Uvicorn**: ASGI server used to run the FastAPI app.
- **Pydantic**: Request and response validation.
- **CSV**: Stores graph nodes and edges.
- **heapq**: Python priority queue used in A* search.
- **math**: Distance and geometry calculations.

### Frontend

- **HTML**: Page structure.
- **CSS**: Interface styling.
- **JavaScript**: User/admin interaction logic.
- **Leaflet.js**: Interactive map display.
- **OpenStreetMap tiles**: Map background.
- **Fetch API**: Communication with the backend.

---

## 7. API Endpoints

### Root

```http
GET /
```

Checks whether the backend is running.

### Get Nodes

```http
GET /api/nodes
```

Returns all nodes in the Nagoya graph dataset.

### Find Path

```http
GET /api/path
```

Query parameters:

| Parameter | Meaning |
|---|---|
| `start_lat` | Start latitude |
| `start_lng` | Start longitude |
| `end_lat` | Destination latitude |
| `end_lng` | Destination longitude |
| `speed_kmh` | Travel speed used to estimate time |

Example:

```text
/api/path?start_lat=35.170915&start_lng=136.881537&end_lat=35.16958&end_lng=136.90667&speed_kmh=5
```

### List Scenarios

```http
GET /api/scenarios
```

Returns all active rain zones and road blocks.

### Add Scenario

```http
POST /api/scenarios
```

Creates a rain zone or road block and applies penalty weights to affected edges.

### Delete Scenario

```http
DELETE /api/scenarios/{scenario_id}
```

Deletes one scenario by ID.

### Clear All Scenarios

```http
DELETE /api/scenarios
```

Clears all active scenarios and resets graph weights.

---

## 8. How to Run the Project

### Step 1: Clone or Download the Project

```bash
git clone <your-github-repository-url>
cd nagoya_astar_project_with_dataset
```

Or extract the ZIP file and open the project folder in VS Code.

### Step 2: Create a Virtual Environment

On Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If activation does not work, use the Python executable directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Step 3: Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

### Step 4: Run the Backend

```powershell
python -m uvicorn backend.app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### Step 5: Run the Frontend

Open a second terminal:

```powershell
cd frontend
python -m http.server 8080
```

Frontend will run at:

```text
http://127.0.0.1:8080/index.html
```

Admin page:

```text
http://127.0.0.1:8080/admin.html
```

---

## 9. Demo Instructions

### User Demo

1. Open `http://127.0.0.1:8080/index.html`.
2. Click **Pick Start** and select a point on the map.
3. Click **Pick End** and select a destination point.
4. Click **Show A* Search** to visualize explored nodes.
5. Click **Find Path (fast)** to display the final optimal path.
6. Read the route distance and estimated travel time.

### Admin Demo

1. Open `http://127.0.0.1:8080/admin.html`.
2. Click **Add Rain Zone**.
3. Click the map once to choose the rain center.
4. Click again to choose the radius.
5. Go back to the user page and find the path again.
6. Add a road block and observe how the route changes.
7. Use **Clear All Scenarios** to reset the map.

---

## 10. Example Use Case

A user wants to travel from Nagoya Station to Sakae. Under normal conditions, the app finds the shortest path based on road distance. If the admin adds a heavy rain zone or road block on part of that route, affected edges receive higher costs. The A* algorithm then recalculates and may choose another route with lower total cost.

This demonstrates how AI search can adapt to dynamic environmental conditions.

---

## 11. Notes and Limitations

- The graph dataset is manually curated and simplified.
- The project does not include the complete Nagoya road network.
- Road blocks are simulated by increasing edge cost, not by physically removing edges.
- The project is designed for educational demonstration, not real navigation use.
- Search accuracy depends on the dataset size and edge connections.

---

## 12. Future Improvements

- Add Google-Map-style place search using dataset node names.
- Add real user/admin login with protected admin APIs.
- Expand the dataset to include more Nagoya roads.
- Support different transport modes such as walking, bicycle, and car.
- Import real road data from OpenStreetMap.
- Add database storage for scenarios.
- Improve UI and mobile responsiveness.
- Deploy backend and frontend online.

---

## 13. Course Knowledge Applied

This project applies important topics from Introduction to Artificial Intelligence:

- Problem formulation
- State space representation
- Weighted graph representation
- Informed search
- A* search algorithm
- Heuristic function design
- Path cost calculation
- Dynamic cost update using simulated real-world scenarios

---

## 14. Author / Group Information

Course: **IT3160 - Introduction to Artificial Intelligence**

Project topic: **A* Pathfinding Application in Central Nagoya**

Group members:

| No. | Full Name | Student ID |
|---|---|---|
| 1 | Your Name | Your Student ID |
| 2 | Member Name | Student ID |
| 3 | Member Name | Student ID |

---

## 15. License

This project is for educational purposes.
