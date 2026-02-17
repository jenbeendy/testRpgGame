import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.1'],                    // Error rate below 10%
  },
};

const SERVICES = {
  auth: 'http://localhost:8001',
  crafting: 'http://localhost:8002',
  inventory: 'http://localhost:8003',
  admin: 'http://localhost:8004',
};

const USER_ID = '1';

export default function () {
  // Auth Service
  group('Auth Service', () => {
    http.get(`${SERVICES.auth}/health`);

    const loginRes = http.post(`${SERVICES.auth}/auth/login`, JSON.stringify({
      email: 'test@test.com',
      password: 'password',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
      'login ok': (r) => r.status === 200 || r.status === 401,
    });
  });

  sleep(0.5);

  // Crafting Service
  group('Crafting Service', () => {
    http.get(`${SERVICES.crafting}/health`);

    const recipesRes = http.get(`${SERVICES.crafting}/recipes`);
    check(recipesRes, {
      'recipes ok': (r) => r.status === 200,
    });

    const recipeRes = http.get(`${SERVICES.crafting}/recipes/1`);
    check(recipeRes, {
      'recipe ok': (r) => r.status === 200 || r.status === 404,
    });

    const skillsRes = http.get(`${SERVICES.crafting}/skills/${USER_ID}`, {
      headers: { 'X-User-ID': USER_ID },
    });
    check(skillsRes, {
      'skills ok': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(0.5);

  // Inventory Service
  group('Inventory Service', () => {
    http.get(`${SERVICES.inventory}/health`);

    const inventoryRes = http.get(`${SERVICES.inventory}/inventory/${USER_ID}`);
    check(inventoryRes, {
      'inventory ok': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(0.5);

  // Admin Service
  group('Admin Service', () => {
    http.get(`${SERVICES.admin}/health`);

    const itemsRes = http.get(`${SERVICES.admin}/items`);
    check(itemsRes, {
      'items ok': (r) => r.status === 200 || r.status === 401,
    });

    const recipesRes = http.get(`${SERVICES.admin}/recipes`);
    check(recipesRes, {
      'recipes ok': (r) => r.status === 200 || r.status === 401,
    });
  });

  sleep(1);
}
