# +----------------------------------------+
# | Target: dev-dependencies (INTERIM)     |
# |     Copies dev dependencies            |
# |                                        |
# | DO NOT PUBLISH THIS INTERIM TARGET     |
# +----------------------------------------+

ARG BASE_IMAGE=earnest/microservice-base:0.12-84e1636

FROM $BASE_IMAGE AS dev-dependencies

WORKDIR /usr/src/app

# IMPORTANT: don't publish this target with the .npmrc included
COPY .npmrc* package.json package-lock.json ./

# Install dev dependencies
RUN npm ci --force --production=false && npm cache verify

# +----------------------------------------+
# | Target: dev                            |
# +----------------------------------------+

FROM $BASE_IMAGE AS dev

WORKDIR /usr/src/app

# built dev-dependencies, sans .npmrc
COPY --from=dev-dependencies /usr/src/app/package.json ./package.json
COPY --from=dev-dependencies /usr/src/app/node_modules ./node_modules

# install in development mode to get binaries
# necessary to compile the source code

# Copy source files
COPY ./src ./src

# +----------------------------------------+
# | Target: prod-dependencies (INTERIM)    |
# |     1. compiles from source            |
# |     2. clears dev dependencies         |
# |     3. installs production dependencies|
# |                                        |
# | DO NOT PUBLISH THIS INTERIM TARGET     |
# +----------------------------------------+

FROM dev AS prod-dependencies

# IMPORTANT: don't publish this target with the .npmrc included
COPY .npmrc* package.json package-lock.json ./

# Remove source code and development libraries
RUN rm -r node_modules

# Install production dependencies
RUN npm ci --force --production=true && npm cache verify && rm -f .npmrc

# Compile from source (depends on npm install)
RUN npm run build

# +----------------------------------------+
# | Target: deployable                     |
# |     ONLY copies over compiled code and |
# |     production dependencies            |
# +----------------------------------------+

FROM $BASE_IMAGE AS prod

WORKDIR /usr/src/app

# Copy just compiled steps from production target
COPY --from=prod-dependencies /usr/src/app/package.json ./package.json
COPY --from=prod-dependencies /usr/src/app/node_modules ./node_modules
COPY --from=prod-dependencies /usr/src/app/dist ./dist

# Add definition files
COPY ./flows ./flows

ARG VERSION
ENV VERSION $VERSION
ENV NODE_ENV=production

EXPOSE 3000

