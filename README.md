# Nagoya A* Live Demo

This project is a class demo for A* pathfinding in central Nagoya.

Main features:
- Real Nagoya basemap with OpenStreetMap and Leaflet.
- User route page with start/end picking and A* search visualization.
- Admin scenario page for adding rain zones and road blocks.
- Simple login system with two roles: `user` and `admin`.
- Backend protection: normal users can search routes, only admins can create/delete scenarios.
- Fixed minimum rain radius so the admin page does not show NaN radius.

## Demo accounts

| Role | Username | Password | Page |
|---|---|---|---|
| User | `user` | `user123` | `index.html` |
| Admin | `admin` | `admin123` | `admin.html` |

> Note: This login system is intentionally simple for class demonstration. Tokens are stored in backend memory and reset when the backend restarts.

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
- http://127.0.0.1:8080/login.html
- http://127.0.0.1:8080/index.html
- http://127.0.0.1:8080/admin.html


## Dataset

This project does not use a machine-learning training dataset. Because the AI method is A* pathfinding, the dataset is a graph dataset:

- File: `backend/app/data/nagoya_graph.json`
- Nodes: 15 important locations in central Nagoya, each with `id`, `name`, `lat`, and `lng`
- Edges: 26 simplified road connections between nearby nodes
- Edge weight: calculated automatically by Haversine geographic distance
- Heuristic: straight-line Haversine distance from the current node to the goal node
- Dynamic data: admin-created rain zones and road blocks are temporary scenarios stored in backend memory

For the report, you can call this a **curated central Nagoya road graph dataset**. It is suitable for demonstrating A* clearly, but it is not the full OpenStreetMap road network.

## User page demo flow

1. Open `login.html` and login with `user / user123`.
2. Click **Pick Start** and choose a point.
3. Click **Pick End** and choose another point.
4. Click **Show A* Search** to animate the explored nodes.
5. Click **Find Path (fast)** if you only want the final result.

## Admin page demo flow

1. Open `login.html` and login with `admin / admin123`.
2. Open the admin page.
3. Click **Add Rain Zone**.
4. Click once for the center.
5. Click again for the radius.
6. Go back to the user page and run the path again.

## Important API behavior

- `POST /api/auth/login`: login and receive a token.
- `GET /api/auth/me`: check current logged-in user.
- `GET /api/nodes` and `GET /api/path`: require login as user or admin.
- `GET /api/scenarios`: requires login.
- `POST /api/scenarios`, `DELETE /api/scenarios`, and `DELETE /api/scenarios/{id}`: require admin role.

## Note

This project still uses a curated road graph for a stable demo, not the full Nagoya OSM road graph.


## Place search feature

The user page includes a simple Google-Maps-style search panel, but it searches inside the local project dataset only.

- Dataset file: `backend/app/data/nagoya_graph.json`
- Searchable places: the 15 nodes in the dataset, such as Nagoya Station, Sakae, Fushimi, Osu Kannon, and Kanayama
- Users can type a place name, choose it from suggestions, click **Use Start** or **Use End**, then run A*
- Users can also click the blue dataset nodes on the map to set the current start/end point

This is intentionally limited to the project graph dataset, not the full Google Maps database. To search every real place in Nagoya, the project would need an external geocoding API or a much larger road-network dataset.
