#!/usr/bin/env bash
# Production instances get secrets differently than during development.  Only
# wait for vault during non-production runs.
if [ "$APP_ENV" == "development" ] || [ "$APP_ENV" == "test" ]; then
    echo "---------- Waiting for vault to start and load secrets ------"
    /usr/bin/wait-for-it.sh -h "${VAULT_HOST}" -p "${VAULT_PORT}" -t 90 -s -- echo "vault is up"
fi

set -e

AS=($(from_vault apply-flow-service \
    database_name \
    database_password \
    database_username \
    database_host \
))

# override db name and host if env var already set (docker-compose.yml)
if [ -z "${DATABASE_NAME}" ]; then
    export DATABASE_NAME=${AS[0]}
fi
if [ -z "${DATABASE_PASSWORD}" ]; then
    export DATABASE_PASSWORD=${AS[1]}
fi
if [ -z "${DATABASE_USERNAME}" ]; then
    export DATABASE_USERNAME=${AS[2]}
fi
if [ -z "${DATABASE_HOST}" ]; then
    export DATABASE_HOST=${AS[3]}
fi

wait-for-it.sh -s "$DATABASE_HOST:5432" -t 90 -- echo "postgres is up"

POSTGRES_URL=${POSTGRES_URL:-"jdbc:postgresql://${DATABASE_HOST}/${DATABASE_NAME}"}

if [ "$APP_ENV" == "development" ] || [ "$APP_ENV" == "test" ]; then
    flyway \
      -baselineOnMigrate=true \
      -locations=filesystem://usr/src/app/schema/sql/ \
      -user=${DATABASE_USERNAME} \
      -password=${DATABASE_PASSWORD} \
      -url=${POSTGRES_URL} \
      -schemas=test \
      "$@"
fi

exec flyway \
  -baselineOnMigrate=true \
  -locations=filesystem://usr/src/app/schema/sql/ \
  -user=${DATABASE_USERNAME} \
  -password=${DATABASE_PASSWORD} \
  -url=${POSTGRES_URL} \
  -schemas=public \
  "$@"
