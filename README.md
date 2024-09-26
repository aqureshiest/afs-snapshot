# apply-flow-service
Interface for managing and executing custom product experiences

## Setup

1.  `cp ~/.npmrc .` to make sure the service picks up your npm credentials. (it is not necessary anymore, as soon as you have your .npmrc in your machine's root)
2.  Run `ggo ci msc build` (This will generate `earnest/apply-flow-service:local` image, which is needed for the service in docker compose to start)

## Dev

To use apply-flow-service locally, initialize the project with these steps

1. `gogo start`, this will start the service in docker compose, along with vault, mountebank redis and gateway.

## Running tests

Run `docker compose run service npx chassis-test` to run the test suites.
