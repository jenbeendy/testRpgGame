# Load Tests (k6)

Load testing for RPG Crafting Game targeting 1000 concurrent users.

## Tests Included

- **auth.js** - Auth service (register, login)
- **crafting.js** - Crafting service (recipes, skills, crafting)
- **inventory.js** - Inventory service (get, add, move, remove items)
- **admin.js** - Admin service (get items, recipes)
- **comprehensive.js** - All services together with realistic thresholds

## Prerequisites

### Option 1: Using Docker (Recommended)

```bash
docker build -t rpggame-load-test .
```

### Option 2: Using k6 CLI

Install k6: https://k6.io/docs/getting-started/installation/

## Running Load Tests

### Prerequisites - Ensure services are running:

```bash
# Terminal 1: Backend services
docker compose up

# Terminal 2: Frontend (optional for API tests)
cd frontend && npm run dev
```

### Option 1: Docker

Run individual tests:
```bash
docker run --network host -v $(pwd):/app rpggame-load-test run auth.js
docker run --network host -v $(pwd):/app rpggame-load-test run crafting.js
docker run --network host -v $(pwd):/app rpggame-load-test run inventory.js
docker run --network host -v $(pwd):/app rpggame-load-test run admin.js
```

Run comprehensive test (1000 users over 25 minutes):
```bash
docker run --network host -v $(pwd):/app rpggame-load-test run comprehensive.js
```

### Option 2: k6 CLI

```bash
k6 run auth.js
k6 run crafting.js
k6 run inventory.js
k6 run admin.js
k6 run comprehensive.js
```

## Load Test Stages

All tests follow same stage progression:

1. **Ramp-up (2 min)**: 0 → 100 users
2. **Ramp-up (5 min)**: 100 → 1000 users
3. **Sustain (10 min)**: 1000 users (peak load)
4. **Ramp-down (2 min)**: 1000 → 0 users

**Total Duration**: ~19 minutes per test

## Comprehensive Test Stages

More realistic progression:

1. **Ramp-up (1 min)**: 0 → 100 users
2. **Ramp-up (3 min)**: 100 → 500 users
3. **Ramp-up (5 min)**: 500 → 1000 users
4. **Sustain (10 min)**: 1000 users (peak)
5. **Ramp-down (2 min)**: 1000 → 500 users
6. **Cool-down (2 min)**: 500 → 0 users

**Total Duration**: ~23 minutes

## Success Metrics (Comprehensive Test)

- ✅ 95% of requests < 500ms
- ✅ 99% of requests < 1s
- ✅ Error rate < 10%

## Expected Results

For a healthy system at target load:

### Auth Service
- ~200 req/s at peak
- Response time: 50-100ms
- Success: >95%

### Crafting Service
- ~300 req/s at peak
- Response time: 30-80ms
- Success: >98%

### Inventory Service
- ~250 req/s at peak
- Response time: 40-100ms
- Success: >95%

### Admin Service
- ~150 req/s at peak
- Response time: 50-150ms
- Success: >90% (some 401s expected without auth)

## Output Analysis

k6 provides:
- Real-time metrics in console
- Detailed summary at end (requests, errors, response times)
- HTML report (if using --out=html flag)

## Interpreting Results

### Good Signs ✅
- Most requests complete in <500ms
- Error rate <5%
- Consistent response times across ramp-up/sustain
- No spike in error rate at peak load

### Warning Signs ⚠️
- Response time increases >100ms during ramp-up
- Error rate increases >1% at peak
- Timeouts or connection errors
- Memory spike on backend

## Optimization Strategies

If tests show poor performance:

1. **Database Query Optimization**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Cache frequently accessed recipes/items

2. **API Optimization**
   - Add response compression
   - Implement pagination for large datasets
   - Cache responses (Redis)

3. **Infrastructure**
   - Horizontal scaling (more service instances)
   - Load balancer distribution
   - Database replica for reads

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 HTTP API](https://k6.io/docs/javascript-api/k6-http)
- [k6 Checks](https://k6.io/docs/javascript-api/k6/check)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds)
