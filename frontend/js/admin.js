(function () {
  const { API_BASE_URL } = window.APP_CONFIG;
  const { authHeaders, requireAuth, renderUserBadge } = window.AuthModule;
  const { map, scenarioLayer, helperLayer, fromLeaflet } = window.MapModule;

  let mode = null;
  let firstPoint = null;
  let preview = null;

  const penaltyInput = document.getElementById('penalty');
  const modeBadge = document.getElementById('admin-mode-badge');
  const scenarioList = document.getElementById('scenario-list');
  const scenarioEmpty = document.getElementById('scenario-empty');

  function setMode(nextMode) {
    mode = nextMode;
    firstPoint = null;
    if (preview) {
      helperLayer.removeLayer(preview);
      preview = null;
    }
    const label = nextMode ? nextMode.replace('_', ' ') : 'none';
    modeBadge.textContent = `Mode: ${label}`;
  }

  document.getElementById('rain-mode').onclick = () => setMode('rain');
  document.getElementById('block-mode').onclick = () => setMode('road_block');
  document.getElementById('refresh-scenarios').onclick = () => refreshScenarios();
  document.getElementById('clear-scenarios').onclick = async () => {
    await fetch(`${API_BASE_URL}/scenarios`, { method: 'DELETE', headers: authHeaders() });
    await refreshScenarios();
  };

  map.on('mousemove', (e) => {
    if (!mode || !firstPoint) return;

    const point = fromLeaflet(e.latlng);
    if (preview) {
      helperLayer.removeLayer(preview);
      preview = null;
    }

    if (mode === 'rain') {
      const radius = Math.max(40, distanceMeters(firstPoint, point));
      preview = L.circle([firstPoint.lat, firstPoint.lng], {
        radius,
        color: '#0ea5e9',
        fillColor: '#38bdf8',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '6 6',
      }).addTo(helperLayer);
    } else {
      preview = L.polyline([
        [firstPoint.lat, firstPoint.lng],
        [point.lat, point.lng],
      ], {
        color: '#ef4444',
        weight: 4,
        dashArray: '8 8',
      }).addTo(helperLayer);
    }
  });

  map.on('click', async (e) => {
    if (!mode) return;

    const point = fromLeaflet(e.latlng);
    if (!firstPoint) {
      firstPoint = point;
      return;
    }

    const penalty = Number(penaltyInput.value || 4);
    let payload;
    if (mode === 'rain') {
      payload = {
        type: 'rain',
        center_lat: firstPoint.lat,
        center_lng: firstPoint.lng,
        radius_m: Math.max(40, distanceMeters(firstPoint, point)),
        penalty,
      };
    } else {
      payload = {
        type: 'road_block',
        lat1: firstPoint.lat,
        lng1: firstPoint.lng,
        lat2: point.lat,
        lng2: point.lng,
        penalty,
      };
    }

    await fetch(`${API_BASE_URL}/scenarios`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    firstPoint = null;
    if (preview) {
      helperLayer.removeLayer(preview);
      preview = null;
    }
    await refreshScenarios();
  });

  async function removeScenario(id) {
    await fetch(`${API_BASE_URL}/scenarios/${id}`, { method: 'DELETE', headers: authHeaders() });
    await refreshScenarios();
  }

  async function refreshScenarios() {
    const res = await fetch(`${API_BASE_URL}/scenarios`, { headers: authHeaders() });
    const data = await res.json();
    scenarioList.innerHTML = '';
    scenarioLayer.clearLayers();
    scenarioEmpty.style.display = data.items.length ? 'none' : 'block';

    data.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'scenario-item';

      const meta = document.createElement('div');
      meta.className = 'scenario-meta';
      const title = item.type === 'rain' ? `Rain #${item.id}` : `Road block #${item.id}`;
      const detail = item.type === 'rain'
        ? `${Math.round(item.radius_m)} m radius • penalty x${item.penalty}`
        : `Penalty x${item.penalty}`;
      meta.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'mini-delete';
      removeBtn.textContent = 'Delete';
      removeBtn.onclick = () => removeScenario(item.id);

      li.appendChild(meta);
      li.appendChild(removeBtn);
      scenarioList.appendChild(li);

      if (item.type === 'rain') {
        L.circle([item.center[0], item.center[1]], {
          radius: item.radius_m,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
          weight: 2,
        }).addTo(scenarioLayer);
      } else {
        L.polyline([
          [item.p1[0], item.p1[1]],
          [item.p2[0], item.p2[1]],
        ], {
          color: '#ef4444',
          weight: 5,
          opacity: 0.9,
        }).addTo(scenarioLayer);
      }
    });
  }

  function distanceMeters(a, b) {
    return map.distance([a.lat, a.lng], [b.lat, b.lng]);
  }

  requireAuth(['admin']).then((user) => {
    if (!user) return;
    renderUserBadge(user);
    refreshScenarios();
  });
})();
