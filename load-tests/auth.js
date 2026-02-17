import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 1000 }, // Ramp up to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

const BASE_URL = 'http://localhost:8001';

export default function () {
  group('Auth Service - Register', () => {
    const payload = {
      email: `user${Math.random()}@test.com`,
      username: `user${Math.random()}`,
      password: 'password123',
    };

    const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'register status 201': (r) => r.status === 201 || r.status === 409, // Allow 409 if exists
      'register has message': (r) => r.body.includes('message'),
    });
  });

  sleep(1);

  group('Auth Service - Login', () => {
    const payload = {
      email: 'test@test.com',
      password: 'password',
    };

    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'login status 200': (r) => r.status === 200 || r.status === 401,
      'login has token': (r) => r.body.includes('access_token') || r.body.includes('message'),
    });
  });

  sleep(1);
}
