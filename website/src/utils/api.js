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

export function apiFetch(url, options = {}) {
  const headers = buildApiHeaders(options.headers || {});
  return fetch(url, { credentials: 'include', ...options, headers });
} 