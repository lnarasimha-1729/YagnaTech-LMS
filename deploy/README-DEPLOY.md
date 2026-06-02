# YagnaTech — AWS EC2 Deployment (start to end)

Single EC2 host running 8 Dockerized backend services + Nginx serving the
React/Vite frontend. Database is the existing AWS RDS MySQL (no DB container).

Architecture:
- **Bastion** (gateway, :8000) → routes `/api/v1/<service>` to upstreams.
- **admin-service** (:4000) → admin API + serves `/uploads` images. Browser calls it directly.
- 6 internal services: auth(8001), course(8002), assessment(8003), organisation(8004), college(8005), payment(8006).
- Nginx fronts everything on one domain → one TLS cert, simple CORS.

Files in this `deploy/` folder + repo:
- `backend/docker-compose.prod.yml` — prod overrides (bind ports to localhost).
- `frontend/.env.production` — build-time API URLs.
- `deploy/nginx-yagnatech.conf` — reverse proxy + static hosting.
- `deploy/deploy.sh` — one-shot build/start/publish/reload.

> Secrets: you chose to **keep the existing committed `.env` values**, so the 8
> service `.env` files are used as-is. Only deployment URLs/CORS are overridden
> (via `docker-compose.prod.yml` + `.env.production`). **Rotate secrets later** —
> see "Security" at the bottom; the committed RDS password, JWT secrets and Gmail
> app password are currently public in git.

---

## STEP 0 — AWS: EC2 + RDS networking
1. Launch **Ubuntu 22.04 LTS**, **t3.medium** (4 GB RAM), 30 GB gp3, in the **same region/VPC as RDS (ap-south-1)**.
2. **EC2 Security Group inbound:** `22` (your IP only), `80`, `443`. Nothing else.
3. **RDS Security Group inbound:** MySQL `3306` from the **EC2 security group** only.
4. Allocate + associate an **Elastic IP**; point your domain's **A record** at it.

## STEP 1 — Install prerequisites (run once on EC2)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git jq
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
docker compose version && node -v
```

## STEP 2 — Clone the repo
```bash
git clone <your-repo-url> ~/yagnatech
cd ~/yagnatech
```

## STEP 3 — Set your domain in the build config
Replace the placeholder domain in the two files that get baked at build time:
```bash
cd ~/yagnatech
sed -i 's/app\.yourdomain\.com/YOUR_REAL_DOMAIN/g' frontend/.env.production
# (deploy.sh injects the domain into the Nginx config automatically via DOMAIN=)
```

## STEP 4 — Verify EC2 can reach RDS
```bash
sudo apt install -y mysql-client
mysql -h database-1.cp80esk4cw9b.ap-south-1.rds.amazonaws.com -u admin -p -e "SHOW DATABASES;"
# Expect to see: lucy_devdb, course_db, assessment_db, organization_db, lms_admin
```
If this hangs, fix the RDS security group (STEP 0.3).

## STEP 5 — Deploy (one command)
```bash
cd ~/yagnatech
DOMAIN=YOUR_REAL_DOMAIN bash deploy/deploy.sh
```
This builds + starts all 8 services, builds the frontend, publishes it to
`/var/www/yagnatech`, installs the Nginx config (with your domain), and reloads.

## STEP 6 — Enable HTTPS (once)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_REAL_DOMAIN
```
Certbot rewrites the Nginx config for 443 + auto-renews.

## STEP 7 — Verify end-to-end
```bash
curl -s https://YOUR_REAL_DOMAIN/api/v1/_services/health | jq   # all "healthy": true
docker compose -f backend/docker-compose.yml -f backend/docker-compose.prod.yml ps   # 8 Up
```
In the browser (DevTools → Network):
- **Login** → auth via Bastion returns 200.
- Open an **admin page** → calls to `/admin-api/api/admin/...` return 200.
- An **uploaded image** renders → `/admin-api/uploads/...` returns 200.
- A **college** page → `/api/v1/college/...` returns 200.

---

## Redeploy after code changes
```bash
cd ~/yagnatech && git pull
DOMAIN=YOUR_REAL_DOMAIN bash deploy/deploy.sh
```

## Operate individual services
```bash
cd ~/yagnatech/backend
CF="-f docker-compose.yml -f docker-compose.prod.yml"
docker compose $CF ps
docker compose $CF logs -f auth-service
docker compose $CF restart payment-service
```

---

## Security (do soon — currently insecure by your choice to keep values)
1. **Rotate** the RDS password, all `JWT_*`/`JWT_SECRET`, `INTERNAL_API_SECRET`,
   and the Gmail `SMTP_PASS` — they are committed to git.
   - JWT access secret must stay identical across auth/course/assessment/org/payment
     and admin's `JWT_SECRET`. `INTERNAL_API_SECRET` must match across auth/assessment/admin.
2. Add all `.env` to `.gitignore` and purge them from history (`git filter-repo`).
3. Set `NODE_ENV=production` and `CORS_ORIGIN=https://YOUR_REAL_DOMAIN` in each service `.env`.
4. Restrict the YouTube API key by HTTP referrer (it's public in the JS bundle).
5. Keep RDS private (SG = EC2 SG only) and service ports bound to 127.0.0.1 (already done by prod compose).
