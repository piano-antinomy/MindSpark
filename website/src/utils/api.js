export function buildApiHeaders(initHeaders = {}) {
  const headers = { ...initHeaders };
  if (process.env.REACT_APP_LOCAL_MODE === 'false') {
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  }
  return headers;
}

export async function apiFetch(url, options = {}) {
  const headers = buildApiHeaders(options.headers || {});
  const response = await fetch(url, { credentials: 'include', ...options, headers });

  if (response.status === 401 && process.env.REACT_APP_LOCAL_MODE === 'false') {
    localStorage.removeItem('idToken');
    localStorage.removeItem('currentUser');

    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      window.location.href = '/';
    }
  }

  return response;
} 