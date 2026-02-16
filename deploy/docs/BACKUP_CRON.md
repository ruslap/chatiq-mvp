# Автоматичні бекапи PostgreSQL

Цей документ описує як налаштувати автоматичні щоденні бекапи бази даних.

## Структура бекапів

```
/opt/chtq/backups/
├── daily/      # Щоденні бекапи (останні 7 днів)
└── weekly/     # Щотижневі бекапи (останні 4 тижні)
```

## Налаштування Cron

### 1. Відкрийте crontab редактор

```bash
crontab -e
```

### 2. Додайте запис для щоденного бекапу

Бекап о 3:00 ночі кожен день:

```cron
# CHTQ Daily Database Backup - runs at 3:00 AM every day
0 3 * * * /opt/chtq/deploy/scripts/backup.sh >> /var/log/chtq-backup.log 2>&1
```

### 3. Збережіть і вийдіть

Для nano: `Ctrl+O`, `Enter`, `Ctrl+X`  
Для vim: `:wq`

## Перевірка

### Переглянути активні cron jobs:

```bash
crontab -l
```

### Запустити бекап вручну:

```bash
cd /opt/chtq/deploy
./scripts/backup.sh
```

### Переглянути логи:

```bash
tail -f /var/log/chtq-backup.log
```

### Перевірити наявні бекапи:

```bash
ls -lh /opt/chtq/backups/daily/
ls -lh /opt/chtq/backups/weekly/
```

## Відновлення з бекапу

```bash
cd /opt/chtq/deploy
./scripts/restore.sh /opt/chtq/backups/daily/<backup_file>.sql.gz
```

> ⚠️ **УВАГА:** Відновлення ПЕРЕЗАПИШЕ всі поточні дані! Перед відновленням автоматично створюється pre-restore бекап.

## Налаштування Retention

За замовчуванням:
- **Щоденні бекапи**: зберігаються 7 днів
- **Щотижневі бекапи**: зберігаються 4 тижні (створюються в неділю)

Для зміни відредагуйте змінні в `backup.sh`:

```bash
RETENTION_DAYS=7
RETENTION_WEEKS=4
```

## Моніторинг

Рекомендується налаштувати сповіщення при помилках бекапу. Приклад зі Slack webhook:

```bash
# Додайте в кінець backup.sh
if [ $? -ne 0 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"⚠️ CHTQ Backup failed!"}' \
        YOUR_SLACK_WEBHOOK_URL
fi
```

## Віддалене зберігання (рекомендовано)

Для додаткової безпеки рекомендується копіювати бекапи на віддалене сховище:

### S3/DigitalOcean Spaces:

```bash
# Встановіть s3cmd
apt install s3cmd
s3cmd --configure

# Додайте до cron після backup.sh
s3cmd sync /opt/chtq/backups/ s3://your-bucket/chtq-backups/
```

### Rsync на інший сервер:

```bash
rsync -avz /opt/chtq/backups/ user@backup-server:/backups/chtq/
```
