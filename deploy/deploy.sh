#!/usr/bin/env bash
# YagnaTech one-shot (re)deploy for a single EC2 host.
# Run from the repo root on the EC2 instance:  bash deploy/deploy.sh
#
# Prereqs (install once, see deploy/README-DEPLOY.md STEP 1):
#   docker + docker compose plugin, nginx, node 18, the repo cloned.
# Idempotent: safe to re-run after `git pull` to ship new code.
set -euo pipefail

# ---- config ----
DOMAIN="${DOMAIN:-app.yourdomain.com}"      # override: DOMAIN=lms.example.com bash deploy/deploy.sh
WEBROOT="/var/www/yagnatech"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Repo root: $REPO_ROOT"
echo "==> Domain:    $DOMAIN"

# ---- 1. backend: build + start all 8 services ----
echo "==> Building & starting backend (8 services)..."
cd "$REPO_ROOT/backend"
export BASTION_ALLOWED_ORIGINS="https://$DOMAIN"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Waiting for Bastion health..."
for i in $(seq 1 30); do
  if curl -fs http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "    Bastion is up."
    break
  fi
  sleep 2
done
echo "==> Service health:"
curl -fs http://127.0.0.1:8000/api/v1/_services/health || echo "(health endpoint not ready yet)"
echo

# ---- 2. frontend: build static bundle + publish ----
echo "==> Building frontend..."
cd "$REPO_ROOT/frontend"
npm ci
npm run build
sudo mkdir -p "$WEBROOT"
sudo rm -rf "${WEBROOT:?}/"*
sudo cp -r dist/* "$WEBROOT/"
echo "    Published to $WEBROOT"

# ---- 3. nginx ----
echo "==> Installing Nginx site config..."
sudo cp "$REPO_ROOT/deploy/nginx-yagnatech.conf" /etc/nginx/sites-available/yagnatech
# inject the real domain
sudo sed -i "s/app\.yourdomain\.com/$DOMAIN/g" /etc/nginx/sites-available/yagnatech
sudo ln -sf /etc/nginx/sites-available/yagnatech /etc/nginx/sites-enabled/yagnatech
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo
echo "==> Done."
echo "    HTTP:  http://$DOMAIN"
echo "    For HTTPS run once: sudo certbot --nginx -d $DOMAIN"
echo "    Verify: curl -s https://$DOMAIN/api/v1/_services/health | jq"
