#!/bin/bash -e

: ${APP_ENV:?}
# Production instances get secrets differently than during development.  Only
# wait for vault during non-production runs.
if [ "$APP_ENV" == "development" ] || [ "$APP_ENV" == "test" ]; then
  echo "---------- Waiting for vault to start and load secrets ------"
  /usr/bin/wait-for-it.sh -h "${VAULT_HOST}" -p "${VAULT_PORT}" -t 90 -s -- echo "vault is up"
  : ${APP_ENV:?}
fi

if [[ -z "${VAULT_AUTH_TOKEN}" ]]; then
  : ${VAULT_ENV_VAULT_AUTH_TOKEN:?}
  export VAULT_AUTH_TOKEN=${VAULT_ENV_VAULT_AUTH_TOKEN}
fi

export PATH="${PWD}/node_modules/.bin":$PATH

APP_NAME=$(jq -r .name package.json)
: ${APP_NAME:?}

GLOBAL=($(from_vault global \
  newRelicKey \
  2> /dev/null))


ENV_JSON='[
  { "key": "NEW_RELIC_LICENSE_KEY",
    "legacyValue": "'${GLOBAL[0]}'",
    "pbeValue": "'${newRelicKey}'"
  }
]'

# https://github.com/meetearnest/docker-images/blob/master/shared/export_non_null.sh
source $EXPORT_NON_NULL_FUNCTION_PATH
exportNonNull $ENV_JSON

exec "$@"
