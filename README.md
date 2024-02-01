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