#!/bin/bash
# Load .env file and run the Spring Boot app
set -a
source .env
set +a
./mvnw spring-boot:run
