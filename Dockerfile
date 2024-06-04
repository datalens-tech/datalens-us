FROM ubuntu:22.04

# timezone setting
ENV TZ="Etc/UTC"
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

# add node.js repository
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# add postgresql repository
RUN install -d /usr/share/postgresql-common/pgdg && \
    curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc && \
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list

# install system dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install tzdata && \
    apt-get -y install nginx supervisor nodejs postgresql-client-13 build-essential

# cleanup tmp and defaults
RUN rm -rf /etc/nginx/sites-enabled/default /var/lib/apt/lists/*

ARG app_version
ARG CERT
ARG USER=app

ENV APP_VERSION=$app_version
ENV NODE_ENV=production

RUN mkdir -p /opt/app

RUN useradd -ms /bin/bash --uid 1000 ${USER}

WORKDIR /opt/app


COPY deploy/nginx /etc/nginx
COPY deploy/supervisor /etc/supervisor/conf.d
COPY package.json package-lock.json /opt/app/
COPY . .

# prepare rootless permissions for supervisor and nginx
RUN chown -R ${USER} /var/log/supervisor/ && \
    mkdir /var/run/supervisor && \
    chown -R ${USER} /var/run/supervisor && \
    mkdir -p /var/cache/nginx && chown -R ${USER} /var/cache/nginx && \
    mkdir -p /var/log/nginx  && chown -R ${USER} /var/log/nginx && \
    mkdir -p /var/lib/nginx  && chown -R ${USER} /var/lib/nginx && \
    touch /run/nginx.pid && chown -R ${USER} /run/nginx.pid 

# build app
RUN npm ci -q --no-progress --include=dev --also=dev
RUN npm run build
RUN npm prune --production
RUN rm -rf /tmp/*

RUN chown -R ${USER} /opt/app/dist/run

# adding certificate
RUN echo $CERT > /usr/local/share/ca-certificates/cert.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/cert.pem
RUN update-ca-certificates

USER app

ENTRYPOINT [ "/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf" ]
