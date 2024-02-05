# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.143.0-1

### Added:
* Добавлена возможность обработки заголовка `x-rpc-authorization` с возможностью прокидывания ответа в `response`, как свойство rpc. Механизм включается есть передан аргумент `NODE_RPC_URL`. Результат храниться в переменной `ctx` объекта `Request`.