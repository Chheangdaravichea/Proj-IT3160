(function () {
  const { API_BASE_URL } = window.APP_CONFIG;
  const STORAGE_KEY = 'nagoya_astar_auth';

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveAuth(auth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }

  function clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function authHeaders() {
    const auth = getAuth();
    return auth && auth.token ? { Authorization: `Bearer ${auth.token}` } : {};
  }

  function goToLogin() {
    localStorage.setItem('nagoya_after_login', window.location.href);
    window.location.href = './login.html';
  }

  async function login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Login failed');
    }

    const data = await res.json();
    saveAuth(data);
    return data;
  }

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch (error) {
      console.warn(error);
    }
    clearAuth();
    window.location.href = './login.html';
  }

  async function requireAuth(allowedRoles) {
    const auth = getAuth();
    if (!auth || !auth.token) {
      goToLogin();
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      clearAuth();
      goToLogin();
      return null;
    }

    const user = await res.json();
    saveAuth({ token: auth.token, user });

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      alert('This page requires admin permission. Please login as admin.');
      window.location.href = './login.html';
      return null;
    }

    return user;
  }

  function renderUserBadge(user) {
    const badge = document.getElementById('user-badge');
    if (badge && user) {
      badge.textContent = `${user.display_name} (${user.role})`;
      badge.className = user.role === 'admin' ? 'badge warning' : 'badge success';
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.onclick = logout;
    }
  }

  window.AuthModule = {
    getAuth,
    saveAuth,
    clearAuth,
    authHeaders,
    login,
    logout,
    requireAuth,
    renderUserBadge,
  };
})();
