(function () {
  const { API_BASE_URL, SEARCH_STEP_MS } = window.APP_CONFIG;
  const {
    map,
    nodeLayer,
    markerLayer,
    routeLayer,
    helperLayer,
    searchLayer,
    icons,
    fromLeaflet,
    toLeaflet,
  } = window.MapModule;

  let mode = 'start';
  let startPoint = null;
  let endPoint = null;
  let startMarker = null;
  let endMarker = null;
  let animationToken = 0;

  const startText = document.getElementById('start-text');
  const endText = document.getElementById('end-text');
  const distanceText = document.getElementById('distance');
  const timeText = document.getElementById('time');
  const visitedText = document.getElementById('visited-count');
  const modeBadge = document.getElementById('mode-badge');
  const apiBadge = document.getElementById('api-badge');
  const algoStatus = document.getElementById('algo-status');
  const buttons = {
    start: document.getElementById('pick-start'),
    end: document.getElementById('pick-end'),
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setMode(nextMode) {
    mode = nextMode;
    modeBadge.textContent = `Mode: ${nextMode === 'start' ? 'Pick Start' : 'Pick End'}`;
    buttons.start.classList.toggle('is-active', nextMode === 'start');
    buttons.end.classList.toggle('is-active', nextMode === 'end');
  }

  setMode('start');

  async function checkApi() {
    try {
      const res = await fetch('http://127.0.0.1:8000/');
      if (!res.ok) throw new Error('API not ready');
      apiBadge.textContent = 'API: online';
      apiBadge.className = 'badge success';
    } catch (error) {
      apiBadge.textContent = 'API: offline';
      apiBadge.className = 'badge danger';
    }
  }

  async function loadNodes() {
    try {
      const res = await fetch(`${API_BASE_URL}/nodes`);
      const data = await res.json();
      nodeLayer.clearLayers();
      data.nodes.forEach((node) => {
        const marker = L.circleMarker([node.lat, node.lng], {
          radius: 4,
          color: '#1d4ed8',
          weight: 2,
          fillColor: '#93c5fd',
          fillOpacity: 0.95,
        });
        marker.bindPopup(`<strong>${node.name}</strong><br>${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}`);
        marker.addTo(nodeLayer);
      });
    } catch (error) {
      console.error(error);
    }
  }

  function setMarker(which, point) {
    const latlng = toLeaflet(point);
    if (which === 'start') {
      if (startMarker) markerLayer.removeLayer(startMarker);
      startMarker = L.marker(latlng, { icon: icons.start }).addTo(markerLayer);
      startText.textContent = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
    } else {
      if (endMarker) markerLayer.removeLayer(endMarker);
      endMarker = L.marker(latlng, { icon: icons.end }).addTo(markerLayer);
      endText.textContent = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
    }
  }

  function clearVisuals() {
    routeLayer.clearLayers();
    helperLayer.clearLayers();
    searchLayer.clearLayers();
  }

  function clearRoute() {
    animationToken += 1;
    startPoint = null;
    endPoint = null;
    startText.textContent = '-';
    endText.textContent = '-';
    distanceText.textContent = '-';
    timeText.textContent = '-';
    visitedText.textContent = '-';
    algoStatus.textContent = 'Idle';
    markerLayer.clearLayers();
    clearVisuals();
    startMarker = null;
    endMarker = null;
    setMode('start');
  }

  function drawFinalPath(start, end, graphPath) {
    const graphLatLngs = graphPath.map((p) => [p.lat, p.lng]);
    const displayLatLngs = [[start.lat, start.lng], ...graphLatLngs, [end.lat, end.lng]];

    L.polyline(displayLatLngs, {
      color: '#0f766e',
      weight: 7,
      opacity: 0.95,
    }).addTo(routeLayer);

    if (graphLatLngs.length >= 2) {
      L.polyline(graphLatLngs, {
        color: '#2dd4bf',
        weight: 2,
        dashArray: '8 8',
        opacity: 0.9,
      }).addTo(helperLayer);
    }
  }

  async function animateVisitedNodes(visitedNodes, token) {
    visitedText.textContent = String(visitedNodes.length);
    algoStatus.textContent = 'A* exploring...';

    for (let i = 0; i < visitedNodes.length; i += 1) {
      if (token !== animationToken) return false;
      const node = visitedNodes[i];
      const isLast = i === visitedNodes.length - 1;

      L.circleMarker([node.lat, node.lng], {
        radius: isLast ? 7 : 5,
        color: isLast ? '#f97316' : '#f59e0b',
        weight: 2,
        fillColor: isLast ? '#fb923c' : '#facc15',
        fillOpacity: 0.85,
      }).bindTooltip(`${i + 1}. ${node.name}`).addTo(searchLayer);

      algoStatus.textContent = `A* exploring node ${i + 1}/${visitedNodes.length}: ${node.name}`;
      await sleep(SEARCH_STEP_MS);
    }

    return true;
  }

  document.getElementById('pick-start').onclick = () => setMode('start');
  document.getElementById('pick-end').onclick = () => setMode('end');
  document.getElementById('clear-path').onclick = clearRoute;

  map.on('click', (e) => {
    const point = fromLeaflet(e.latlng);
    if (mode === 'start') {
      startPoint = point;
      setMarker('start', point);
      setMode('end');
    } else {
      endPoint = point;
      setMarker('end', point);
    }
  });

  async function requestPath() {
    if (!startPoint || !endPoint) {
      alert('Pick both start and end first.');
      return null;
    }

    const speed = Number(document.getElementById('speed').value || 5);
    const url = new URL(`${API_BASE_URL}/path`);
    url.searchParams.set('start_lat', startPoint.lat);
    url.searchParams.set('start_lng', startPoint.lng);
    url.searchParams.set('end_lat', endPoint.lat);
    url.searchParams.set('end_lng', endPoint.lng);
    url.searchParams.set('speed_kmh', speed);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Could not get path');
    }
    return res.json();
  }

  async function runPath(showAnimation) {
    animationToken += 1;
    const currentToken = animationToken;

    try {
      clearVisuals();
      algoStatus.textContent = 'Requesting path...';
      const data = await requestPath();
      if (!data) return;

      distanceText.textContent = `${data.distance_km} km`;
      timeText.textContent = `${data.estimated_time_min} min`;

      if (showAnimation) {
        const completed = await animateVisitedNodes(data.visited_nodes, currentToken);
        if (!completed || currentToken !== animationToken) return;
      } else {
        visitedText.textContent = String(data.visited_count);
        algoStatus.textContent = 'A* completed instantly';
      }

      drawFinalPath(startPoint, endPoint, data.path);
      algoStatus.textContent = `Path found with ${data.visited_count} explored nodes`;
      if (routeLayer.getLayers().length) {
        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
      }
    } catch (error) {
      console.error(error);
      algoStatus.textContent = 'Error while finding path';
      alert('Backend is not responding. Check that uvicorn is running on port 8000.');
    }
  }

  document.getElementById('find-path').onclick = () => runPath(false);
  document.getElementById('show-astar').onclick = () => runPath(true);

  checkApi();
  loadNodes();
})();
