# IT3160 Nagoya Map

A GitHub-ready Nagoya pathfinding project for class demo.

This version keeps the same overall idea as the previous semester project:
- FastAPI backend
- HTML/CSS/JavaScript frontend
- A* pathfinding
- admin scenarios that change route penalties

It is prepared in a repository layout similar to the reference project, so it is easy to upload to GitHub.

## Features
- Nagoya basemap with OpenStreetMap
- User page for choosing start and end points
- `Find Path (fast)` for the final best route immediately
- `Show A* Search` for visualizing explored nodes on the map
- Admin page for `Rain Zone` and `Road Block`
- Simple scenario management and deletion

## Project structure
```text
IT3160-NagoyaMap-github-ready/
├── backend/
│   └── app/
│       ├── api/
│       │   ├── path.py
│       │   └── scenarios.py
│       ├── services/
│       │   ├── pathfinding.py
│       │   └── scenario.py
│       └── main.py
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── config.js
│   │   ├── map.js
│   │   └── pathfinding.js
│   ├── admin.html
│   └── index.html
├── map/
├── .gitignore
├── README.md
└── requirements.txt
```

## Run locally (Windows)
Open a terminal in the project root:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\activate
py -3.12 -m pip install -r requirements.txt
py -3.12 -m uvicorn backend.app.main:app --reload
```

Open a second terminal:

```powershell
cd frontend
py -3.12 -m http.server 8080
```

Open:
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8080/index.html
- http://127.0.0.1:8080/admin.html

## Upload to GitHub
Inside the project root:

```powershell
git init
git add .
git commit -m "Initial Nagoya map project"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Notes
- This repository is arranged to look similar to the earlier reference project.
- It uses a curated demo graph for a stable classroom demo, not the full Nagoya OSM road graph.
- The `map/` folder is included so the repository structure matches the reference more closely.
