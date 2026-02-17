#!/bin/bash

# Load testing runner script
# Usage: ./run.sh [auth|crafting|inventory|admin|all|comprehensive]

TEST=${1:-comprehensive}

echo "🚀 RPG Crafting Game - Load Testing"
echo "===================================="
echo ""

# Check if services are running
echo "📋 Checking if services are running..."
for port in 8001 8002 8003 8004; do
  if ! nc -z localhost $port 2>/dev/null; then
    echo "❌ Service on port $port not running"
    echo "   Run: docker compose up"
    exit 1
  fi
done
echo "✅ All services are running"
echo ""

# Build Docker image if needed
if ! docker images | grep -q rpggame-load-test; then
  echo "🐳 Building k6 Docker image..."
  docker build -t rpggame-load-test .
  echo ""
fi

# Run selected test
case $TEST in
  auth)
    echo "🧪 Running Auth Service load test..."
    docker run --network host -v $(pwd):/app rpggame-load-test run auth.js
    ;;
  crafting)
    echo "🧪 Running Crafting Service load test..."
    docker run --network host -v $(pwd):/app rpggame-load-test run crafting.js
    ;;
  inventory)
    echo "🧪 Running Inventory Service load test..."
    docker run --network host -v $(pwd):/app rpggame-load-test run inventory.js
    ;;
  admin)
    echo "🧪 Running Admin Service load test..."
    docker run --network host -v $(pwd):/app rpggame-load-test run admin.js
    ;;
  all)
    echo "🧪 Running all service tests..."
    docker run --network host -v $(pwd):/app rpggame-load-test run auth.js
    echo ""
    docker run --network host -v $(pwd):/app rpggame-load-test run crafting.js
    echo ""
    docker run --network host -v $(pwd):/app rpggame-load-test run inventory.js
    echo ""
    docker run --network host -v $(pwd):/app rpggame-load-test run admin.js
    ;;
  comprehensive)
    echo "🧪 Running comprehensive load test (1000 users, 23 min)..."
    docker run --network host -v $(pwd):/app rpggame-load-test run comprehensive.js
    ;;
  *)
    echo "❌ Unknown test: $TEST"
    echo "Available: auth, crafting, inventory, admin, all, comprehensive"
    exit 1
    ;;
esac

echo ""
echo "✅ Load test complete!"
