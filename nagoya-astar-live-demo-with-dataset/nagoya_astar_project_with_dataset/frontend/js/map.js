(function () {
  const { MAP_CENTER, MAP_ZOOM, MAP_MIN_ZOOM } = window.APP_CONFIG;

  function createMap() {
    const map = L.map('map', {
      zoomControl: false,
      preferCanvas: true,
    }).setView(MAP_CENTER, MAP_ZOOM);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: MAP_MIN_ZOOM,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const nodeLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    const scenarioLayer = L.layerGroup().addTo(map);
    const helperLayer = L.layerGroup().addTo(map);
    const searchLayer = L.layerGroup().addTo(map);

    const icons = {
      start: L.divIcon({ className: 'marker-icon marker-start', html: '<span>S</span>', iconSize: [30, 30], iconAnchor: [15, 15] }),
      end: L.divIcon({ className: 'marker-icon marker-end', html: '<span>E</span>', iconSize: [30, 30], iconAnchor: [15, 15] }),
    };

    return {
      map,
      nodeLayer,
      markerLayer,
      routeLayer,
      scenarioLayer,
      helperLayer,
      searchLayer,
      icons,
      toLeaflet(point) {
        return [point.lat, point.lng];
      },
      fromLeaflet(latlng) {
        return { lat: latlng.lat, lng: latlng.lng };
      },
    };
  }

  window.MapModule = createMap();
})();
