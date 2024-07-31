ARG BASE_IMAGE_TAG
ARG BASE_IMAGE_REPO
ARG BASE_IMAGE=$BASE_IMAGE_REPO:$BASE_IMAGE_TAG

FROM $BASE_IMAGE

# Repeated because Docker is silly https://stackoverflow.com/questions/60450479/using-arg-and-env-in-dockerfile
ARG BASE_IMAGE_TAG
ARG BASE_IMAGE_REPO
ARG BASE_IMAGE=$BASE_IMAGE_REPO:$BASE_IMAGE_TAG
ARG TARGET_IMAGE_REPO
ARG TARGET_IMAGE_TAG
ARG NPM_INSTALL_FLAGS=--production=true
ARG NODE_ENV=production

COPY package.json package-lock.json ./

# Install dev dependencies
RUN --mount=type=secret,id=npmrc,dst=/usr/src/app/.npmrc \
    npm install --development=true && \
    npm cache verify


# Install production dependencies
RUN --mount=type=secret,id=npmrc,dst=/usr/src/app/.npmrc \
    npm install ${NPM_INSTALL_FLAGS} && \
    npm cache verify

# Copy source code into container
COPY . .

# Install gogo-nets
RUN apt-get -y update; apt-get -y install curl
RUN bash -c "$(curl -fsSL https://artifactory.tools.earnest.com/gogo/install.sh)"
RUN ~/.gogo/bin/ggo nets version

# Compile from source (depends on npm install)
RUN npm run build

# Inject some debug environment variables to the container
ENV BASE_IMAGE_REPO   $BASE_IMAGE_REPO
ENV BASE_IMAGE_TAG    $BASE_IMAGE_TAG
ENV TARGET_IMAGE_REPO $TARGET_IMAGE_REPO
ENV TARGET_IMAGE_TAG  $TARGET_IMAGE_TAG
ENV BASE_IMAGE        $BASE_IMAGE
ENV TARGET_IMAGE      $TARGET_IMAGE_REPO:$TARGET_IMAGE_TAG
ENV MICROSERVICE_CHASSIS_EXTRA_VERSION_INFO "{\"target_image\":\"${TARGET_IMAGE}\",\"base_image\":\"${BASE_IMAGE}\"}"

EXPOSE 3000
