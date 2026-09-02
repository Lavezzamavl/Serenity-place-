import api, { unwrapList } from './client';

export async function getInventoryItems() {
  const { data } = await api.get('/inventory/');
  return unwrapList(data);
}

export async function createInventoryItem(payload) {
  const { data } = await api.post('/inventory/', payload);
  return data;
}
export async function adjustStock(itemId, change, reason, pricing) {
  // pricing: optional { buying_price, unit_price } - only meaningful (and
  // only accepted by the backend) on a restock, i.e. change > 0.
  const { data } = await api.post('/inventory/adjustments/', {
    item: itemId,
    change,
    reason,
    ...(pricing || {}),
  });
  return data;
}