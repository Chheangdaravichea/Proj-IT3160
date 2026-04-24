from __future__ import annotations

import itertools
import math
from typing import Dict, List

from .pathfinding import EdgeKey, LatLng, pathfinding_service


class ScenarioService:
    def __init__(self) -> None:
        self._id_counter = itertools.count(1)
        self.active_scenarios: List[Dict] = []

    @staticmethod
    def _distance_point_to_segment_m(p: LatLng, a: LatLng, b: LatLng) -> float:
        px, py = pathfinding_service.to_local_xy(p)
        ax, ay = pathfinding_service.to_local_xy(a)
        bx, by = pathfinding_service.to_local_xy(b)
        abx = bx - ax
        aby = by - ay
        ab_len_sq = abx * abx + aby * aby
        if ab_len_sq == 0:
            return math.dist((px, py), (ax, ay))
        t = ((px - ax) * abx + (py - ay) * aby) / ab_len_sq
        t = max(0.0, min(1.0, t))
        closest = (ax + t * abx, ay + t * aby)
        return math.dist((px, py), closest)

    def _edges_in_circle(self, center: LatLng, radius_m: float) -> List[EdgeKey]:
        affected: List[EdgeKey] = []
        for u, neighbors in pathfinding_service.adj.items():
            for v in neighbors:
                mid = pathfinding_service.edge_midpoint(u, v)
                if pathfinding_service.haversine(mid, center) <= radius_m:
                    affected.append((u, v))
        return affected

    def _edges_near_line(self, p1: LatLng, p2: LatLng, threshold_m: float = 140.0) -> List[EdgeKey]:
        affected: List[EdgeKey] = []
        for u, neighbors in pathfinding_service.adj.items():
            for v in neighbors:
                mid = pathfinding_service.edge_midpoint(u, v)
                if self._distance_point_to_segment_m(mid, p1, p2) <= threshold_m:
                    affected.append((u, v))
        return affected

    def rebuild_weights(self) -> None:
        pathfinding_service.reset_weights()
        for scenario in self.active_scenarios:
            pathfinding_service.apply_penalty_to_edges(scenario["affected_edges"], scenario["penalty"])

    def add_circle(self, center: LatLng, radius_m: float, penalty: float) -> Dict:
        radius_m = max(radius_m, 40.0)
        scenario = {
            "id": next(self._id_counter),
            "type": "rain",
            "center": center,
            "radius_m": radius_m,
            "penalty": max(penalty, 1.0),
            "affected_edges": self._edges_in_circle(center, radius_m),
        }
        self.active_scenarios.append(scenario)
        self.rebuild_weights()
        return scenario

    def add_line(self, p1: LatLng, p2: LatLng, penalty: float) -> Dict:
        scenario = {
            "id": next(self._id_counter),
            "type": "road_block",
            "p1": p1,
            "p2": p2,
            "penalty": max(penalty, 1.0),
            "affected_edges": self._edges_near_line(p1, p2),
        }
        self.active_scenarios.append(scenario)
        self.rebuild_weights()
        return scenario

    def remove(self, scenario_id: int) -> bool:
        original_len = len(self.active_scenarios)
        self.active_scenarios = [s for s in self.active_scenarios if s["id"] != scenario_id]
        changed = len(self.active_scenarios) != original_len
        if changed:
            self.rebuild_weights()
        return changed

    def clear_all(self) -> None:
        self.active_scenarios = []
        self.rebuild_weights()


scenario_service = ScenarioService()
