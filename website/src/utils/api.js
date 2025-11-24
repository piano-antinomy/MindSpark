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

function handleAuthFailure() {
  localStorage.removeItem('idToken');
  localStorage.removeItem('currentUser');

  if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
    window.location.href = '/';
  }
}

export async function apiFetch(url, options = {}) {
  const headers = buildApiHeaders(options.headers || {});
  const isLocalMode = process.env.REACT_APP_LOCAL_MODE === 'true';

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