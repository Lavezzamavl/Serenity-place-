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