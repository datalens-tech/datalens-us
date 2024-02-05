# United Storage (US)

United Storage is part of [DataLens](https://datalens.tech) that provides universal API for storing, updating and retrieving various configuration objects.

## Getting started

```sh
npm ci
npm run dev
```

[More details](https://github.com/datalens-tech/datalens)

## Комментарий
Для интеграции с RPC на NodeJS требуется передать переменную NODE_RPC_URL со значением адреса сервера, например
<pre>
NODE_RPC_URL=http://localhost:5000/dev/rpc
</pre>

## Отладка и запуск проекта
Требуется установить WSL2 и запусить проект в Visual Code

В терминале выбрать `Ubuntu WSL` и выполнить команду `code .`

Подробнее:
* https://www.petermorlion.com/debugging-wsl-from-vs-code/
* https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-vscode

## Сборка
<pre>
docker login -u [username]
docker build -t akrasnov87/datalens-us:0.143.0 .
docker push akrasnov87/datalens-us:0.143.0
</pre>

## Тестирвование

В корне проекта создать файл .env и добавить туда строки:
<pre>
POSTGRES_DSN_LIST=postgres://us:us@127.0.0.1:5432/us-db-ci_purgeable
APP_PORT=3030
#NODE_RPC_URL=http://localhost:5000/dev/rpc

### TEMPLATE SECRETS BEGIN
APP_INSTALLATION=opensource
APP_ENV=development

MASTER_TOKEN=development-master-token
CONTROL_MASTER_TOKEN=development-control-master-token

US_SURPRESS_DB_STATUS_LOGS=true

### TEMPLATE SECRETS END
</pre>

Создать файл .env.development и оставить его пустым