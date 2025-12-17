# notification-service Helm Chart

This chart deploys the Notification Service (Python + Mail API).

## Secrets

Mail/SMS provider credentials are provided via a Kubernetes Secret and injected as environment variables. The CI workflow can create the Secret per release from GitHub Secrets.

- Secret name (in namespace): `shopease-notification-credentials`
- Expected GitHub Secrets (repo/org):
  - `NOTIFICATION_MAIL_HOST` (e.g., `smtp.example.com`)
  - `NOTIFICATION_MAIL_PORT` (e.g., `587`)
  - `NOTIFICATION_MAIL_USER`
  - `NOTIFICATION_MAIL_PASSWORD`
  - `NOTIFICATION_MAIL_FROM`
  - Optional: `NOTIFICATION_MAIL_API_KEY`, `NOTIFICATION_MAIL_API_URL`, `NOTIFICATION_SMS_API_KEY`, `NOTIFICATION_SMS_API_URL`

The workflow sets Helm with `--set credentials.secretName=${CREDENTIALS_SECRET_NAME}` so the Deployment loads the Secret with `envFrom`.

## Values

```yaml
credentials:
  secretName: ""            # Set to the Secret name (e.g., shopease-notification-credentials)
  createDevSecret: false     # Dev only: generate Secret from values.credentials.dev
  dev: {}
  #  NOTIFICATION_MAIL_HOST: smtp.example.com
  #  NOTIFICATION_MAIL_PORT: "587"
  #  NOTIFICATION_MAIL_USER: username
  #  NOTIFICATION_MAIL_PASSWORD: password
  #  NOTIFICATION_MAIL_FROM: no-reply@example.com
  #  NOTIFICATION_MAIL_API_KEY: ""
  #  NOTIFICATION_MAIL_API_URL: https://api.mailprovider.example
  #  NOTIFICATION_SMS_API_KEY: ""
  #  NOTIFICATION_SMS_API_URL: https://api.smsprovider.example
```

Do not commit real credentials. Use GitHub Secrets or external secret managers in production.
