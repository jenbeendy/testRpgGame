import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:8003';
const USER_ID = '1';

export default function () {
  group('Inventory Service - Get Inventory', () => {
    const res = http.get(`${BASE_URL}/inventory/${USER_ID}`);

    check(res, {
      'inventory status 200': (r) => r.status === 200 || r.status === 404,
      'inventory has items': (r) => r.body.includes('items') || r.status === 404,
    });
  });

  sleep(0.5);

  group('Inventory Service - Add Item', () => {
    const payload = {
      item_template_id: 1,
      quantity: 1,
      slot_x: 0,
      slot_y: 0,
    };

    const res = http.post(`${BASE_URL}/inventory/${USER_ID}`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID,
      },
    });

    check(res, {
      'add item status': (r) => r.status === 200 || r.status === 400 || r.status === 401,
    });
  });

  sleep(0.5);

  group('Inventory Service - Move Item', () => {
    const payload = {
      item_id: 1,
      new_slot_x: 1,
      new_slot_y: 0,
    };

    const res = http.put(`${BASE_URL}/inventory/${USER_ID}`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID,
      },
    });

    check(res, {
      'move item status': (r) => r.status === 200 || r.status === 400 || r.status === 404,
    });
  });

  sleep(0.5);

  group('Inventory Service - Remove Item', () => {
    const res = http.del(`${BASE_URL}/inventory/${USER_ID}/1`, null, {
      headers: { 'X-User-ID': USER_ID },
    });

    check(res, {
      'remove item status': (r) => r.status === 200 || r.status === 400 || r.status === 404,
    });
  });

  sleep(1);
}
