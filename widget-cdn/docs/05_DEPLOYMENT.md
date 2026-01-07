# 🚀 CHTQ Deployment Guide

> Complete guide for deploying CHTQ multi-tenant SaaS on a VPS with Docker and Cloudflare

**Last Updated:** 2026-01-07  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [VPS Preparation](#-vps-preparation)
3. [Cloudflare Configuration](#-cloudflare-configuration)
4. [Deployment Steps](#-deployment-steps)
5. [GitHub Actions CI/CD](#-github-actions-cicd)
6. [Verification Checklist](#-verification-checklist)
7. [Backup & Recovery](#-backup--recovery)
8. [Security Hardening](#-security-hardening)
9. [Troubleshooting](#-troubleshooting)
10. [Maintenance](#-maintenance)

---

## 🔧 Prerequisites

### VPS Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM | 2GB | 4GB |
| CPU | 1 vCPU | 2 vCPU |
| Storage | 25GB SSD | 50GB SSD |
| Bandwidth | 1TB | 2TB+ |

### Required Accounts

- [x] **Domain**: `chtq.ink` (already owned)
- [x] **Cloudflare account** with domain added
- [ ] **VPS with public IP** (DigitalOcean, Hetzner, Linode, etc.)
- [ ] **Google Cloud Console** credentials for OAuth
- [ ] **GitHub repository** access

---

## 💻 VPS Preparation

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Create Deploy User

```bash
# Create user with sudo access
adduser deploy
usermod -aG sudo deploy

# Setup SSH key authentication
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable password login (optional, recommended)
# Edit /etc/ssh/sshd_config and set PasswordAuthentication no
```

### Step 3: Install Docker

```bash
# Update packages
apt update && apt upgrade -y

# Install dependencies
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release git

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user to docker group
usermod -aG docker deploy

# Verify installation
docker --version
docker compose version
```

### Step 4: Configure Firewall (UFW)

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp  # Not needed for Cloudflare proxy, but good for testing
ufw enable

# Verify
ufw status
```

### Step 5: Create Project Directory

```bash
# Create directories
mkdir -p /opt/chtq
mkdir -p /opt/chtq/backups/{daily,weekly}
chown -R deploy:deploy /opt/chtq

# Switch to deploy user
su - deploy
```

---

## ☁️ Cloudflare Configuration

### DNS Records

Configure these A records in Cloudflare Dashboard:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | api | `YOUR_VPS_IP` | ✅ Proxied (orange cloud) |
| A | admin | `YOUR_VPS_IP` | ✅ Proxied (orange cloud) |
| A | cdn | `YOUR_VPS_IP` | ✅ Proxied (orange cloud) |

### SSL/TLS Settings

1. Go to **SSL/TLS** > **Overview**
2. Set mode to **Full (strict)**

### SSL/TLS Edge Certificates

1. **Always Use HTTPS**: ON
2. **Minimum TLS Version**: 1.2
3. **Opportunistic Encryption**: ON
4. **TLS 1.3**: ON

### Network Settings

1. **WebSockets**: ON (enabled by default)
2. **HTTP/2**: ON
3. **HTTP/3 (QUIC)**: ON (optional)

### Security Settings

1. **Bot Fight Mode**: ON
2. **Browser Integrity Check**: ON
3. **Challenge Passage**: 30 minutes

### Caching (for CDN)

1. Go to **Caching** > **Tiered Cache**
2. Enable **Smart Tiered Caching**

---

## 📦 Deployment Steps

### Step 1: Clone Repository

```bash
cd /opt/chtq
git clone https://github.com/YOUR_USERNAME/chatiq-mvp.git .
```

### Step 2: Configure Environment

```bash
cd deploy

# Copy and edit environment file
cp .env.example .env
nano .env
```

**Generate secrets:**

```bash
# Generate JWT_SECRET (64 chars)
openssl rand -base64 64 | tr -d '\n' && echo

# Generate NEXTAUTH_SECRET (32 chars)
openssl rand -base64 32 | tr -d '\n' && echo

# Generate POSTGRES_PASSWORD (32 chars)
openssl rand -base64 32 | tr -d '\n' && echo
```

**Update `.env` with:**
- Generated secrets
- Google OAuth credentials
- Correct database password in DATABASE_URL

### Step 3: Build and Deploy

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh --build
```

### Step 4: Run Database Migrations

```bash
docker compose exec api-server npx prisma migrate deploy
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f

# Test endpoints
curl -I https://api.chtq.ink
curl -I https://admin.chtq.ink
curl -I https://cdn.chtq.ink/widget.js
```

---

## 🔄 GitHub Actions CI/CD

### GitHub Repository Secrets

Add these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | SSH user (e.g., `deploy`) |
| `VPS_SSH_KEY` | Private SSH key for deployment |
| `VPS_PORT` | SSH port (default: 22) |

### Generate SSH Key for CI/CD

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@YOUR_VPS_IP

# Get private key for GitHub secret
cat ~/.ssh/github_deploy
```

### Deployment Flow

```
git push origin main
    ↓
GitHub Actions triggered
    ↓
SSH into VPS
    ↓
git pull
    ↓
docker compose build
    ↓
prisma migrate deploy
    ↓
docker compose up -d
    ↓
Health verification
```

---

## ✅ Verification Checklist

### Service Health

- [ ] `https://api.chtq.ink` responds (200 or 301)
- [ ] `https://admin.chtq.ink` loads login page
- [ ] `https://cdn.chtq.ink/widget.js` returns JavaScript file
- [ ] All containers are running: `docker compose ps`

### WebSocket Test

```bash
# Install wscat
npm install -g wscat

# Test WebSocket connection
wscat -c wss://api.chtq.ink/socket.io/?EIO=4&transport=websocket
```

### Database Test

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U chtq_user -d chtq_production

# Check tables
\dt

# Exit
\q
```

### Full Flow Test

1. Open `https://admin.chtq.ink`
2. Login with Google OAuth
3. Create a new site
4. Copy widget embed code
5. Embed on test page
6. Send test message
7. Verify message appears in admin panel

---

## 💾 Backup & Recovery

### Automatic Backups (Cron)

```bash
# Edit crontab for deploy user
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/chtq/deploy/scripts/backup.sh >> /var/log/chtq-backup.log 2>&1
```

### Manual Backup

```bash
cd /opt/chtq/deploy
./scripts/backup.sh my_backup_name
```

### Restore from Backup

```bash
cd /opt/chtq/deploy

# List available backups
ls -la /opt/chtq/backups/daily/

# Restore specific backup
./scripts/restore.sh /opt/chtq/backups/daily/chtq_backup_20260107_020000.sql.gz
```

### Backup Location

```
/opt/chtq/backups/
├── daily/      # Last 7 daily backups
└── weekly/     # Last 4 weekly backups (created on Sundays)
```

---

## 🔒 Security Hardening

### VPS Security

```bash
# Enable automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Install fail2ban
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### Cloudflare Security

1. **Firewall Rules**: Block countries you don't serve
2. **Rate Limiting**: Limit API requests per IP
3. **WAF**: Enable Web Application Firewall (Pro plan)
4. **Under Attack Mode**: Enable during DDoS

### Application Security

- [x] PostgreSQL not exposed (internal Docker network)
- [x] All containers run as non-root
- [x] Secrets stored in `.env` (not in git)
- [x] HTTPS enforced via Cloudflare
- [x] JWT authentication for API
- [x] siteId isolation in backend

### SSH Security

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Recommended settings:
PasswordAuthentication no
PermitRootLogin no
Port 22  # Consider changing to non-standard port

# Restart SSH
systemctl restart sshd
```

---

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs api-server
docker compose logs admin-panel
docker compose logs nginx

# Rebuild specific container
docker compose build --no-cache api-server
docker compose up -d api-server
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check DATABASE_URL in .env matches postgres credentials
cat .env | grep DATABASE

# Test connection
docker compose exec api-server npx prisma db pull
```

### WebSocket Not Working

1. Verify Cloudflare WebSocket setting is ON
2. Check NGINX logs: `docker compose logs nginx`
3. Check API logs: `docker compose logs api-server`
4. Verify browser DevTools shows WS connection

### 502 Bad Gateway

```bash
# Check if backend is running
docker compose ps

# Check NGINX can reach backends
docker compose exec nginx wget -O- http://api-server:3000/ 2>&1

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### SSL Certificate Issues

1. Verify Cloudflare SSL mode is "Full (strict)"
2. Check domain is proxied (orange cloud)
3. Wait for Cloudflare certificate propagation (up to 24h)

---

## 🛠️ Maintenance

### View Logs

```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f api-server

# Last 100 lines
docker compose logs --tail=100 api-server
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart api-server

# Full rebuild
docker compose down
docker compose up -d --build
```

### Update Application

```bash
cd /opt/chtq

# Pull latest code
git pull

# Deploy
cd deploy
./scripts/deploy.sh --build
```

### Check Disk Usage

```bash
# Docker disk usage
docker system df

# Clean unused images
docker image prune -a

# Clean everything unused
docker system prune -a --volumes
```

### Monitor Resources

```bash
# Container stats
docker stats

# System resources
htop
df -h
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ SSL/TLS     │ │ DDoS        │ │ Caching     │               │
│  │ Termination │ │ Protection  │ │ (CDN)       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP :80
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VPS                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NGINX (Port 80)                       │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │ api.chtq.ink │ │admin.chtq.ink│ │ cdn.chtq.ink │     │   │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘     │   │
│  └─────────┼────────────────┼────────────────┼─────────────┘   │
│            │                │                │                  │
│            ▼                ▼                ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  API Server  │  │ Admin Panel  │  │  Widget CDN  │          │
│  │   (NestJS)   │  │  (Next.js)   │  │   (NGINX)    │          │
│  │   :3000      │  │   :3001      │  │   :3002      │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  PostgreSQL  │ (Internal only, no public port)              │
│  │   :5432      │                                              │
│  └──────────────┘                                              │
│                                                                 │
│  [Docker Network: chtq-internal]                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review this documentation
- Check Cloudflare status: https://www.cloudflarestatus.com/

---

*Documentation generated for CHTQ SaaS platform deployment*
