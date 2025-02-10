#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up development environment...${NC}"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}$1 is not installed. Please install $1 first.${NC}"
        exit 1
    fi
}

# Function to check required files
check_required_files() {
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}docker-compose.yml not found. Please ensure you're in the correct directory.${NC}"
        exit 1
    fi
}

# Check for required commands
check_command "docker"
check_command "docker compose"

# Check for required files
check_required_files

# Clean up existing containers
echo -e "${YELLOW}Cleaning up existing containers...${NC}"
docker compose down -v 2>/dev/null || true

# Copy environment file if it doesn't exist
if [ ! -f ".env.development" ]; then
    echo -e "${GREEN}Creating development environment file...${NC}"
    cp .env.example .env.development
fi

# Copy npmrc if it doesn't exist
if [ ! -f ".npmrc" ]; then
    echo -e "${GREEN}Copying .npmrc file...${NC}"
    cp ~/.npmrc .
fi

# Build the service image
echo -e "${GREEN}Building service image...${NC}"
if ! docker compose build service; then
    echo -e "${RED}Failed to build service image${NC}"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
if ! docker compose run --rm service npm install; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p .coverage
mkdir -p docker/data/redis
mkdir -p docker/data/vault

# Set permissions
echo -e "${GREEN}Setting permissions...${NC}"
chmod -R 777 .coverage
chmod -R 777 docker/data

# Validate service startup
echo -e "${GREEN}Validating service setup...${NC}"
if ! docker compose up -d service; then
    echo -e "${RED}Failed to start service${NC}"
    exit 1
fi

# Wait for service to be healthy
echo -e "${YELLOW}Waiting for service to be healthy...${NC}"
for i in {1..30}; do
    if docker compose ps | grep -q "healthy"; then
        echo -e "${GREEN}Service is healthy!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Service failed to become healthy within timeout${NC}"
        docker compose logs service
        docker compose down
        exit 1
    fi
    echo -n "."
    sleep 1
done

docker compose down

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}You can now run 'npm run dev' to start the development environment.${NC}"