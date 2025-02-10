#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up development environment...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

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
docker compose build service

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
docker compose run --rm service npm install

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p .coverage
mkdir -p docker/data/redis
mkdir -p docker/data/vault

# Set permissions
echo -e "${GREEN}Setting permissions...${NC}"
chmod -R 777 .coverage
chmod -R 777 docker/data

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}You can now run 'npm run dev' to start the development environment.${NC}"