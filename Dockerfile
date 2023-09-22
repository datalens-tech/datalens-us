FROM ghcr.io/gravity-ui/node-nginx:ubuntu20-nodejs18

ARG app_version

ENV APP_VERSION=$app_version
ENV NODE_ENV=production

RUN mkdir -p /opt/app
WORKDIR /opt/app

RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt-get update && apt-get install -y postgresql-client-13 build-essential

COPY deploy/nginx /etc/nginx
COPY deploy/supervisor /etc/supervisor/conf.d
COPY package.json package-lock.json /opt/app/
COPY . .

RUN npm ci -q --no-progress --include=dev --also=dev
RUN npm run build
RUN npm prune --production
RUN rm -rf /tmp/*

RUN chown app /opt/app/dist/run

CMD /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
