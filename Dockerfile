ARG UBUNTU_VERSION=24.04

# use native build platform for build js files only once
FROM --platform=${BUILDPLATFORM} ubuntu:${UBUNTU_VERSION} AS native-build-stage

ARG NODE_MAJOR=22

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg

# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nodejs g++ make

RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

WORKDIR /opt/app

COPY package.json package-lock.json .npmrc /opt/app/
RUN npm ci

COPY ./dist /opt/app/dist
COPY ./src /opt/app/src
COPY ./typings /opt/app/typings
COPY tsconfig.json /opt/app/

RUN npm run build && chown app /opt/app/dist/run

# runtime base image for both platform
FROM ubuntu:${UBUNTU_VERSION} AS base-stage

ARG NODE_MAJOR=22

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg

# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nodejs

# install postgresql-client
RUN apt-get -y install postgresql-client

# remove unnecessary packages
RUN apt-get -y purge curl gnupg gnupg2 && \
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /etc/apt/sources.list.d/nodesource.list && \
    rm -rf /etc/apt/keyrings/nodesource.gpg


# timezone setting
ENV TZ="Etc/UTC"
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# user app
RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

# install package dependencies for production
FROM base-stage AS install-stage

# install system dependencies
RUN apt-get update && apt-get -y install g++ make

WORKDIR /opt/app

COPY package.json package-lock.json .npmrc /opt/app/

RUN npm ci && npm prune --production

# production running stage
FROM base-stage AS runtime-stage

ARG USER=app
ARG app_version
ENV APP_VERSION=$app_version
ENV TMPDIR=/tmp

WORKDIR /opt/app

COPY package.json package-lock.json /opt/app/
COPY ./scripts/preflight.sh /opt/app/scripts/preflight.sh

COPY --from=install-stage /opt/app/node_modules /opt/app/node_modules
COPY --from=native-build-stage /opt/app/dist /opt/app/dist

RUN chown -R ${USER} /opt/app/dist/run

USER app

ENV NODE_ENV=production
ENV APP_PORT=8080

EXPOSE 8080

ENTRYPOINT ["/opt/app/scripts/preflight.sh"]