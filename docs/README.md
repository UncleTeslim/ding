# Ding documentation

Start with the path that matches your goal:

| Goal | Guide |
| --- | --- |
| Deploy your own instance | [Production installation](DEPLOYMENT.md) |
| Try locally or change the source | [Local development](LOCAL_DEVELOPMENT.md) |
| Write and publish your first update | [Publishing](PUBLISHING.md) |
| Add Ding to your app | [Embedding and framework examples](EMBEDDING.md) |
| Understand settings | [Configuration](CONFIGURATION.md) |
| Protect and recover data | [Backup and restore](BACKUP_AND_RESTORE.md) |
| Update an existing instance | [Upgrading](UPGRADING.md) |
| Diagnose a problem | [Troubleshooting](TROUBLESHOOTING.md) |
| Use HTTP endpoints | [API reference](API.md) |

The [website documentation](https://www.dingwidget.com/docs/introduction/) presents these guides with navigation and copyable examples. The public repository guides are their source of truth.

Ding is one service with an embedded SQLite database. Production needs persistent storage and an HTTPS origin; it does not need a separate database server or one Ding instance per visitor. Docker is the recommended deployment path. A static hosting service alone cannot run the backend.

Commands use Bash unless a PowerShell block is shown. In PowerShell, use `curl.exe` for the curl examples. Values such as `updates.example.com` and `<published-version>` are placeholders to replace.

For maintainers: [release procedure](RELEASING.md) and [contributing](../CONTRIBUTING.md).
