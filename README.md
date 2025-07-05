# external-secrets-operator

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/external-secrets-operator-headlamp-plugin)](https://artifacthub.io/packages/search?repo=external-secrets-operator-headlamp-plugin)

- Headlamp Plugin showing health and status of External Secrets Operator resrouces

## Development environment

### Headlamp development

In separate consoles start

```bash
make run-backend HEADLAMP_PLUGINS_DIR=../external-secrets-operator-headlamp-plugin
```

```bash
make run-frontend
```

And in this plugin folder run

```bash
npm start
```
