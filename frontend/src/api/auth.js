import api from './client';

// mfaCode is only needed on the second step of login, once the backend has
// told us this account has MFA enabled (see the mfa_required check below).
export async function login(username, password, mfaCode) {
  const payload = { username, password };
  if (mfaCode) payload.mfa_code = mfaCode;
  const { data } = await api.post('/auth/login/', payload);
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data.user;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me/');
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem('refresh_token');
  try {
    if (refresh) await api.post('/auth/logout/', { refresh });
  } catch {
    // token may already be expired/invalid - clear local state regardless
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export async function changePassword(oldPassword, newPassword) {
  const { data } = await api.post('/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return data;
}

// Generates (but does not activate) a TOTP secret + QR code for the
// logged-in user. Call mfaEnable() with a code from the authenticator app
// to actually turn MFA on.
export async function mfaSetup() {
  const { data } = await api.get('/auth/mfa/setup/');
  return data; // { secret, qr_code }
}

export async function mfaEnable(code) {
  const { data } = await api.post('/auth/mfa/enable/', { code });
  return data;
}

export async function mfaDisable(password) {
  const { data } = await api.post('/auth/mfa/disable/', { password });
  return data;
}

export async function getRoles() {
  const { data } = await api.get('/auth/roles/');
  return data;
}

export async function forceLogoutUser(userId) {
  const { data } = await api.post(`/auth/users/${userId}/force-logout/`);
  return data;
}