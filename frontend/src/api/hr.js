import api, { unwrapList } from './client';

export async function getStaff() {
  const { data } = await api.get('/hr/staff/');
  return unwrapList(data);
}

export async function getLeaveRequests() {
  const { data } = await api.get('/hr/leave-requests/');
  return unwrapList(data);
}


export async function reviewLeave(leaveId, decision) {
  const { data } = await api.post(`/hr/leave-requests/${leaveId}/review/`, { decision });
  return data;
}

export async function getAvailableUsers() {
  const { data } = await api.get('/hr/staff/available-users/');
  return data;
}

// Links an existing (already-approved) account to a new staff profile.
export async function addStaffFromExisting(payload) {
  const { data } = await api.post('/hr/staff/', payload);
  return data;
}

// Creates a brand-new login account and staff profile together.
export async function createStaffAccount(payload) {
  const { data } = await api.post('/hr/staff/create-with-account/', payload);
  return data;
}
// Self-service: the logged-in user requests their own leave with a
// reason and expected return date. Bypasses the 'hr' module permission
// check on the backend, since any staff member can request leave.
export async function requestLeave(payload) {
  const { data } = await api.post('/hr/leave-requests/request/', payload);
  return data;
}