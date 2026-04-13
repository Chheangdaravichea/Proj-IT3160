from __future__ import annotations

import heapq
import math
from dataclasses import dataclass
from typing import Dict, List, Tuple

LatLng = Tuple[float, float]
EdgeKey = Tuple[int, int]

EARTH_RADIUS_M = 6_371_000
REF_LAT = 35.1710
REF_LNG = 136.9060


@dataclass
class PathResult:
    path: List[LatLng]
    node_ids: List[int]
    distance_m: float
    estimated_time_min: float
    visited_order: List[int]


class PathfindingService:
    def __init__(self) -> None:
        # Curated graph near central Nagoya for stable class demo.
        self.nodes: Dict[int, Dict[str, float | str]] = {
            1: {"name": "Nagoya Station", "lat": 35.170915, "lng": 136.881537},
            2: {"name": "Meieki 4-chome", "lat": 35.171800, "lng": 136.889900},
            3: {"name": "Fushimi", "lat": 35.168920, "lng": 136.899750},
            4: {"name": "Marunouchi", "lat": 35.175200, "lng": 136.894950},
            5: {"name": "Nagoya Castle", "lat": 35.185556, "lng": 136.899296},
            6: {"name": "Hisaya-odori", "lat": 35.173450, "lng": 136.907850},
            7: {"name": "Sakae", "lat": 35.169580, "lng": 136.906670},
            8: {"name": "Osu Kannon", "lat": 35.158710, "lng": 136.899470},
            9: {"name": "Tsurumai", "lat": 35.156780, "lng": 136.917300},
            10: {"name": "Kanayama", "lat": 35.143900, "lng": 136.900950},
            11: {"name": "Shinsakae-machi", "lat": 35.171980, "lng": 136.919300},
            12: {"name": "Nagoya City Hall", "lat": 35.181450, "lng": 136.906180},
            13: {"name": "Yaba-cho", "lat": 35.164510, "lng": 136.907220},
            14: {"name": "Shiyakusho West", "lat": 35.179230, "lng": 136.897520},
            15: {"name": "Osu East", "lat": 35.160530, "lng": 136.908480},
        }

        undirected_edges = [
            (1, 2), (2, 3), (2, 4),
            (3, 4), (3, 7), (3, 8), (3, 13),
            (4, 5), (4, 6), (4, 14),
            (5, 12), (5, 14), (12, 6),
            (6, 7), (6, 11), (6, 12),
            (7, 11), (7, 13), (7, 15),
            (8, 9), (8, 10), (8, 13), (8, 15),
            (9, 10), (9, 15),
            (13, 15),
        ]

        self.adj: Dict[int, List[int]] = {nid: [] for nid in self.nodes}
        self.original_weights: Dict[EdgeKey, float] = {}
        self.current_weights: Dict[EdgeKey, float] = {}

        for u, v in undirected_edges:
            w = self.haversine(self.node_latlng(u), self.node_latlng(v))
            self.adj[u].append(v)
            self.adj[v].append(u)
            self.original_weights[(u, v)] = w
            self.original_weights[(v, u)] = w

        self.current_weights = dict(self.original_weights)

    def node_latlng(self, node_id: int) -> LatLng:
        node = self.nodes[node_id]
        return float(node["lat"]), float(node["lng"])

    @staticmethod
    def haversine(a: LatLng, b: LatLng) -> float:
        lat1, lng1 = map(math.radians, a)
        lat2, lng2 = map(math.radians, b)
        d_lat = lat2 - lat1
        d_lng = lng2 - lng1
        h = (
            math.sin(d_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
        )
        return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))

    @staticmethod
    def to_local_xy(point: LatLng) -> Tuple[float, float]:
        lat, lng = point
        meters_per_deg_lat = 111_320
        meters_per_deg_lng = 111_320 * math.cos(math.radians(REF_LAT))
        x = (lng - REF_LNG) * meters_per_deg_lng
        y = (lat - REF_LAT) * meters_per_deg_lat
        return x, y

    def heuristic(self, node_id: int, goal_id: int) -> float:
        return self.haversine(self.node_latlng(node_id), self.node_latlng(goal_id))

    def nearest_node(self, point: LatLng) -> int:
        return min(self.nodes, key=lambda nid: self.haversine(point, self.node_latlng(nid)))

    def reset_weights(self) -> None:
        self.current_weights = dict(self.original_weights)

    def apply_penalty_to_edges(self, edges: List[EdgeKey], penalty: float) -> None:
        for edge in edges:
            if edge in self.current_weights:
                self.current_weights[edge] = self.original_weights[edge] * max(penalty, 1.0)

    def edge_midpoint(self, u: int, v: int) -> LatLng:
        lat1, lng1 = self.node_latlng(u)
        lat2, lng2 = self.node_latlng(v)
        return ((lat1 + lat2) / 2.0, (lng1 + lng2) / 2.0)

    def a_star(self, start_id: int, goal_id: int) -> Tuple[List[int], float, List[int]]:
        open_heap: List[Tuple[float, int]] = [(self.heuristic(start_id, goal_id), start_id)]
        came_from: Dict[int, int] = {}
        g_score: Dict[int, float] = {nid: math.inf for nid in self.nodes}
        g_score[start_id] = 0.0
        visited_order: List[int] = []
        closed = set()

        while open_heap:
            _, current = heapq.heappop(open_heap)
            if current in closed:
                continue

            closed.add(current)
            visited_order.append(current)

            if current == goal_id:
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path, g_score[goal_id], visited_order

            for neighbor in self.adj[current]:
                tentative_g = g_score[current] + self.current_weights[(current, neighbor)]
                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + self.heuristic(neighbor, goal_id)
                    heapq.heappush(open_heap, (f_score, neighbor))

        return [], math.inf, visited_order

    def find_path(self, start: LatLng, end: LatLng, speed_kmh: float = 5.0) -> PathResult:
        start_id = self.nearest_node(start)
        goal_id = self.nearest_node(end)
        node_ids, distance_m, visited_order = self.a_star(start_id, goal_id)
        path = [self.node_latlng(nid) for nid in node_ids]

        speed_kmh = max(float(speed_kmh or 5.0), 0.1)
        estimated_time_min = 0.0 if math.isinf(distance_m) else (distance_m / 1000.0) / speed_kmh * 60.0

        return PathResult(
            path=path,
            node_ids=node_ids,
            distance_m=distance_m,
            estimated_time_min=estimated_time_min,
            visited_order=visited_order,
        )


pathfinding_service = PathfindingService()
