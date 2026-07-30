import api from './client';

export async function getInventoryItems() {
  const { data } = await api.get('/inventory/');
  return data;
}

export async function adjustStock(itemId, change, reason) {
  const { data } = await api.post('/inventory/adjustments/', { item: itemId, change, reason });
  return data;
}