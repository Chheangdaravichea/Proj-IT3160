from fastapi import APIRouter, Depends, Query

from ..services.auth import CurrentUser, require_user
from ..services.pathfinding import pathfinding_service

router = APIRouter()


@router.get("/nodes")
def get_nodes(current_user: CurrentUser = Depends(require_user)):
    return {
        "nodes": [
            {
                "id": nid,
                "name": node["name"],
                "lat": node["lat"],
                "lng": node["lng"],
            }
            for nid, node in pathfinding_service.nodes.items()
        ]
    }


@router.get("/path")
def get_path(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...),
    speed_kmh: float = Query(5.0),
    current_user: CurrentUser = Depends(require_user),
):
    result = pathfinding_service.find_path(
        start=(start_lat, start_lng),
        end=(end_lat, end_lng),
        speed_kmh=speed_kmh,
    )

    visited_nodes = [
        {
            "id": nid,
            "lat": pathfinding_service.nodes[nid]["lat"],
            "lng": pathfinding_service.nodes[nid]["lng"],
            "name": pathfinding_service.nodes[nid]["name"],
        }
        for nid in result.visited_order
    ]

    return {
        "path": [{"lat": lat, "lng": lng} for lat, lng in result.path],
        "node_ids": result.node_ids,
        "visited_nodes": visited_nodes,
        "visited_count": len(result.visited_order),
        "distance_km": round(result.distance_m / 1000.0, 3),
        "estimated_time_min": round(result.estimated_time_min, 2),
    }
