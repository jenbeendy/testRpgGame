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

const BASE_URL = 'http://localhost:8004';

export default function () {
  group('Admin Service - Get Items', () => {
    const res = http.get(`${BASE_URL}/items`);

    check(res, {
      'items status 200': (r) => r.status === 200 || r.status === 401,
      'items is array': (r) => r.body.includes('[') || r.status === 401,
    });
  });

  sleep(0.5);

  group('Admin Service - Get Recipes', () => {
    const res = http.get(`${BASE_URL}/recipes`);

    check(res, {
      'recipes status 200': (r) => r.status === 200 || r.status === 401,
      'recipes is array': (r) => r.body.includes('[') || r.status === 401,
    });
  });

  sleep(0.5);

  group('Admin Service - Get Single Item', () => {
    const res = http.get(`${BASE_URL}/items/1`);

    check(res, {
      'item status': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    });
  });

  sleep(0.5);

  group('Admin Service - Get Single Recipe', () => {
    const res = http.get(`${BASE_URL}/recipes/1`);

    check(res, {
      'recipe status': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    });
  });

  sleep(1);
}
