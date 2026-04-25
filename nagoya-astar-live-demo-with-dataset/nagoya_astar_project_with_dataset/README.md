# Nagoya A* Live Demo

This version is made to be easier to present in class.

What is different from the earlier demo:
- real Nagoya basemap with OpenStreetMap
- a **Show A* Search** button on the user page
- animated explored nodes on the map
- rain and road-block scenarios on the admin page
- fixed minimum rain radius so the admin page does not show NaN radius

## Run

Open a terminal in this folder and run:

```bash
py -3.12 -m venv .venv
.venv\Scripts\activate
py -3.12 -m pip install -r requirements.txt
py -3.12 -m uvicorn backend.app.main:app --reload
```

Open a second terminal and run:

```bash
cd frontend
py -3.12 -m http.server 8080
```

Then open:
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8080/index.html
- http://127.0.0.1:8080/admin.html

## User page demo flow
1. Click **Pick Start** and choose a point.
2. Click **Pick End** and choose another point.
3. Click **Show A* Search** to animate the explored nodes.
4. Click **Find Path (fast)** if you only want the final result.

## Admin page demo flow
1. Click **Add Rain Zone**.
2. Click once for the center.
3. Click again for the radius.
4. Go back to the user page and run the path again.

## Note
This project still uses a curated road graph for a stable demo, not the full Nagoya OSM road graph.

## Dataset files

This version includes the Nagoya road graph as dataset files:

- `backend/data/nagoya_nodes.csv` — node coordinates: `node_id`, `name`, `lat`, `lng`
- `backend/data/nagoya_edges.csv` — road links: `from_node`, `to_node`, `distance_m`

The backend now loads the graph from these CSV files in `backend/app/services/pathfinding.py`.
