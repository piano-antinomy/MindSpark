export function buildApiHeaders(initHeaders = {}) {
  const headers = { ...initHeaders };
  const isLocalMode = process.env.REACT_APP_LOCAL_MODE === 'true'
    || ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalMode) {
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
  }
  return headers;
}

function handleAuthFailure() {
  localStorage.removeItem('idToken');
  localStorage.removeItem('currentUser');

  if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
    window.location.href = '/';
  }
}

export async function apiFetch(url, options = {}) {
  const headers = buildApiHeaders(options.headers || {});
  const isLocalMode = process.env.REACT_APP_LOCAL_MODE === 'true'
    || ['localhost', '127.0.0.1'].includes(window.location.hostname);

  try {
    const response = await fetch(url, { credentials: 'include', ...options, headers });

    if (!isLocalMode && response.status === 401) {
      handleAuthFailure();
    }

    return response;
  } catch (error) {
    if (!isLocalMode) {
      handleAuthFailure();
    }
    console.error('apiFetch error:', error);
    throw error;
  }
} 