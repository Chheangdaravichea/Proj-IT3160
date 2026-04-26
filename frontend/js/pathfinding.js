(function () {
  const { API_BASE_URL, SEARCH_STEP_MS } = window.APP_CONFIG;
  const { authHeaders, requireAuth, renderUserBadge } = window.AuthModule;
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
  let graphNodes = [];

  const startText = document.getElementById('start-text');
  const endText = document.getElementById('end-text');
  const distanceText = document.getElementById('distance');
  const timeText = document.getElementById('time');
  const visitedText = document.getElementById('visited-count');
  const modeBadge = document.getElementById('mode-badge');
  const apiBadge = document.getElementById('api-badge');
  const algoStatus = document.getElementById('algo-status');
  const startSearchInput = document.getElementById('start-search');
  const endSearchInput = document.getElementById('end-search');
  const placeOptions = document.getElementById('place-options');
  const placesList = document.getElementById('places-list');
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

  function normalizePlaceName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function findPlaceByName(value) {
    const query = normalizePlaceName(value);
    if (!query) return null;

    return (
      graphNodes.find((node) => normalizePlaceName(node.name) === query) ||
      graphNodes.find((node) => normalizePlaceName(node.name).includes(query))
    );
  }

  function renderPlaceSearch(nodes) {
    if (!placeOptions || !placesList) return;

    placeOptions.innerHTML = '';
    placesList.innerHTML = '';

    nodes.forEach((node) => {
      const option = document.createElement('option');
      option.value = node.name;
      placeOptions.appendChild(option);

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'place-chip';
      chip.textContent = node.name;
      chip.title = 'Click to use this place for the current start/end mode';
      chip.addEventListener('click', () => selectNodeForCurrentMode(node));
      placesList.appendChild(chip);
    });
  }

  async function loadNodes() {
    try {
      const res = await fetch(`${API_BASE_URL}/nodes`, { headers: authHeaders() });
      const data = await res.json();
      graphNodes = [...data.nodes].sort((a, b) => a.name.localeCompare(b.name));
      renderPlaceSearch(graphNodes);

      nodeLayer.clearLayers();
      graphNodes.forEach((node) => {
        const marker = L.circleMarker([node.lat, node.lng], {
          radius: 5,
          color: '#1d4ed8',
          weight: 2,
          fillColor: '#93c5fd',
          fillOpacity: 0.95,
        });
        marker.bindPopup(`<strong>${node.name}</strong><br>${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}<br><em>Click node to set ${mode === 'start' ? 'start' : 'end'}.</em>`);
        marker.on('click', () => selectNodeForCurrentMode(node));
        marker.addTo(nodeLayer);
      });
    } catch (error) {
      console.error(error);
      if (placesList) placesList.textContent = 'Could not load dataset places. Check backend/login.';
    }
  }

  function pointLabel(point) {
    if (point.name) return point.name;
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }

  function setMarker(which, point) {
    const latlng = toLeaflet(point);
    if (which === 'start') {
      if (startMarker) markerLayer.removeLayer(startMarker);
      startMarker = L.marker(latlng, { icon: icons.start }).addTo(markerLayer);
      startMarker.bindPopup(`<strong>Start</strong><br>${pointLabel(point)}`);
      startText.textContent = pointLabel(point);
      if (startSearchInput && point.name) startSearchInput.value = point.name;
    } else {
      if (endMarker) markerLayer.removeLayer(endMarker);
      endMarker = L.marker(latlng, { icon: icons.end }).addTo(markerLayer);
      endMarker.bindPopup(`<strong>End</strong><br>${pointLabel(point)}`);
      endText.textContent = pointLabel(point);
      if (endSearchInput && point.name) endSearchInput.value = point.name;
    }
  }

  function selectNode(which, node) {
    if (!node) {
      alert('Place not found in the project dataset. Try a place from the suggestion list.');
      return;
    }

    const point = { lat: Number(node.lat), lng: Number(node.lng), name: node.name, id: node.id };
    if (which === 'start') {
      startPoint = point;
      setMarker('start', point);
      setMode('end');
    } else {
      endPoint = point;
      setMarker('end', point);
    }
    clearVisuals();
    map.setView([point.lat, point.lng], Math.max(map.getZoom(), 15));
  }

  function selectNodeForCurrentMode(node) {
    selectNode(mode, node);
  }

  function useSearch(which) {
    const input = which === 'start' ? startSearchInput : endSearchInput;
    selectNode(which, findPlaceByName(input ? input.value : ''));
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
    if (startSearchInput) startSearchInput.value = '';
    if (endSearchInput) endSearchInput.value = '';
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
  document.getElementById('use-start-search').onclick = () => useSearch('start');
  document.getElementById('use-end-search').onclick = () => useSearch('end');
  if (startSearchInput) {
    startSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') useSearch('start');
    });
  }
  if (endSearchInput) {
    endSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') useSearch('end');
    });
  }

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

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Could not get path (${res.status})`);
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
      if (error.message && error.message.includes('401')) {
        window.AuthModule.clearAuth();
        window.location.href = './login.html';
      } else {
        alert('Backend is not responding or your login session expired. Check uvicorn and login again if needed.');
      }
    }
  }

  document.getElementById('find-path').onclick = () => runPath(false);
  document.getElementById('show-astar').onclick = () => runPath(true);

  requireAuth(['user', 'admin']).then((user) => {
    if (!user) return;
    renderUserBadge(user);
    checkApi();
    loadNodes();
  });
})();
