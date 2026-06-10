#!/bin/bash
# Load .env file and run the Spring Boot app
set -e

if [ ! -f .env ]; then
  echo "Missing backend/.env. Copy .env.example to .env and configure it."
  exit 1
fi

set -a
source .env
set +a
./mvnw spring-boot:run
