# Nagoya A* Dataset

This dataset is prepared for the Nagoya A* Live Demo project.

## Files

- `nagoya_nodes.csv`: location/intersection points.
- `nagoya_edges.csv`: road connections between nodes.
- `nagoya_graph.json`: same dataset in JSON format.

## Columns: nagoya_nodes.csv

- `node_id`: unique node id.
- `name`: place/intersection name.
- `lat`: latitude.
- `lng`: longitude.

## Columns: nagoya_edges.csv

- `from_node`: start node id.
- `to_node`: connected node id.
- `from_name`: name of start node.
- `to_name`: name of connected node.
- `distance_m`: edge cost in meters. Use this as `g(n)` cost for A*.
- `distance_km`: same distance in kilometers.
- `bidirectional`: `yes` means the road can be used both ways.

## How to use in A*

- `g(n)`: sum of `distance_m` values from start to current node.
- `h(n)`: straight-line distance from current node to goal, calculated from latitude and longitude.
- `f(n) = g(n) + h(n)`.

Coordinate system: WGS84 latitude/longitude.
