GIT_BRANCH_NAME=${CHANGE_BRANCH:-main}
docker-compose run --rm \
        --env PACT_DO_NOT_TRACK='1' \
        pact sh -c "
            rm -rf ./dist/* && \
            export GIT_COMMIT=$GIT_COMMIT && \
            export GIT_BRANCH_NAME=$GIT_BRANCH_NAME && \
            export PACT_BROKER_URL=$PACT_BROKER_URL && \
            export PACT_BROKER_TOKEN=$PACT_BROKER_TOKEN && \
            export AFS_BEARER_TOKEN=$AFS_BEARER_TOKEN && \
            export TRACESTATE=$TRACESTATE && \
            export TRACEPARENT=$TRACEPARENT && \
            export CI=$CI && \
            npx chassis-tsc && \
            echo 'Run contract tests' && \
            node --test dist/pact-contract-tests/*.pact.js && \
            echo 'Publish contracts' && \
            ./node_modules/.bin/pact-broker publish ./pacts/*.json --broker-base-url ${PACT_BROKER_URL} \
                --consumer-app-version ${GIT_COMMIT} --branch $GIT_BRANCH_NAME
            "