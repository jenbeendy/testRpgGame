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

const BASE_URL = 'http://localhost:8002';
const USER_ID = '1'; // Use test user

export default function () {
  group('Crafting Service - Get All Recipes', () => {
    const res = http.get(`${BASE_URL}/recipes`);

    check(res, {
      'recipes status 200': (r) => r.status === 200,
      'recipes has data': (r) => r.body.length > 0,
    });
  });

  sleep(0.5);

  group('Crafting Service - Get Single Recipe', () => {
    const res = http.get(`${BASE_URL}/recipes/1`);

    check(res, {
      'recipe status 200': (r) => r.status === 200 || r.status === 404,
      'recipe has name': (r) => r.body.includes('name') || r.status === 404,
    });
  });

  sleep(0.5);

  group('Crafting Service - Get Player Skills', () => {
    const res = http.get(`${BASE_URL}/skills/${USER_ID}`, {
      headers: { 'X-User-ID': USER_ID },
    });

    check(res, {
      'skills status 200': (r) => r.status === 200 || r.status === 404,
      'skills has level': (r) => r.body.includes('crafting_level') || r.status === 404,
    });
  });

  sleep(0.5);

  group('Crafting Service - Craft Item', () => {
    const payload = {
      recipe_id: 1,
      ingredients: {},
    };

    const res = http.post(`${BASE_URL}/craft`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID,
      },
    });

    check(res, {
      'craft status 200': (r) => r.status === 200 || r.status === 400 || r.status === 401,
      'craft has response': (r) => r.body.length > 0,
    });
  });

  sleep(1);
}
