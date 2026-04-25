from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.scenario import scenario_service

router = APIRouter()


class ScenarioRequest(BaseModel):
    type: Literal["rain", "road_block"]
    penalty: float = 4.0
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_m: Optional[float] = None
    lat1: Optional[float] = None
    lng1: Optional[float] = None
    lat2: Optional[float] = None
    lng2: Optional[float] = None


@router.get("/scenarios")
def list_scenarios():
    return {"items": scenario_service.active_scenarios}


@router.post("/scenarios")
def create_scenario(payload: ScenarioRequest):
    if payload.type == "rain":
        scenario = scenario_service.add_circle(
            center=(float(payload.center_lat or 0.0), float(payload.center_lng or 0.0)),
            radius_m=float(payload.radius_m or 200.0),
            penalty=float(payload.penalty),
        )
    else:
        scenario = scenario_service.add_line(
            p1=(float(payload.lat1 or 0.0), float(payload.lng1 or 0.0)),
            p2=(float(payload.lat2 or 0.0), float(payload.lng2 or 0.0)),
            penalty=float(payload.penalty),
        )
    return scenario


@router.delete("/scenarios")
def clear_scenarios():
    scenario_service.clear_all()
    return {"message": "All scenarios cleared"}


@router.delete("/scenarios/{scenario_id}")
def delete_scenario(scenario_id: int):
    removed = scenario_service.remove(scenario_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"message": f"Scenario {scenario_id} removed"}
