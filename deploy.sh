#!/bin/bash
# deploy.sh - Production deployment script

set -e

echo "🚀 Starting production deployment..."

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p nginx ssl logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << EOF
NODE_ENV=production
FRONTEND_URL=http://frontend:9002
BACKEND_URL=http://backend:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
SOCKET_IO_CORS_ORIGIN=http://localhost:9002,http://frontend:9002
LOG_LEVEL=info
EOF
    echo "✅ .env file created. Please review and update as needed."
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test connectivity
echo "🧪 Testing connectivity..."
if curl -f http://localhost:9002 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Backend is accessible"
else
    echo "❌ Backend is not accessible"
fi

echo "🎉 Deployment completed!"
echo ""
echo "📋 Access your application:"
echo "   Frontend: http://localhost:9002"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📊 Monitor with:"
echo "   docker-compose logs -f"
echo "   docker-compose ps"
echo "   docker stats"
