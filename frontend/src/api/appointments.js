import api from './client';

export async function getAppointments() {
  const { data } = await api.get('/appointments/');
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getDoctors() {
  const { data } = await api.get('/appointments/doctors/');
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function createAppointment(payload) {
  const { data } = await api.post('/appointments/', payload);
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await api.patch(`/appointments/${id}/`, { status });
  return data;
}