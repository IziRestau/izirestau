# Workflow: Déploiement

## Environnements

| Environnement | Frontend | Backend | Database |
|---------------|----------|---------|----------|
| **Development** | localhost:3000 | localhost:4000 | Neon (dev branch) |
| **Preview** | Vercel Preview | Railway Preview | Neon (preview branch) |
| **Production** | Vercel | Railway | Neon (main) |

---

## Configuration des Services

### Vercel (Frontend)

#### Variables d'environnement
```bash
NEXT_PUBLIC_API_URL=https://api.iziresto.com
NEXT_PUBLIC_SOCKET_URL=https://api.iziresto.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXTAUTH_URL=https://iziresto.com
NEXTAUTH_SECRET=<generated-secret>
```

#### vercel.json
```json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Railway (Backend)

#### Variables d'environnement
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYTECH_API_KEY=...
PAYTECH_SECRET_KEY=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=iziresto
R2_ENDPOINT=https://...
R2_PUBLIC_URL=https://cdn.iziresto.com
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@iziresto.com
FRONTEND_URL=https://iziresto.com
```

#### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm turbo build --filter=api"
  },
  "deploy": {
    "startCommand": "pnpm --filter api start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Neon (Database)

#### Branches
- `main` - Production
- `dev` - Développement
- `preview/*` - Preview deployments

#### Connexion
```bash
# Production
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/iziresto?sslmode=require

# Development (avec pooling)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/iziresto?sslmode=require
```

### Cloudflare (DNS + R2)

#### DNS Records
```
A     iziresto.com          → Vercel IP
CNAME www                   → cname.vercel-dns.com
CNAME api                   → railway-app.com
CNAME *.iziresto.com        → cname.vercel-dns.com (wildcard pour subdomains)
```

#### R2 Bucket
- Bucket: `iziresto`
- Public URL: `https://cdn.iziresto.com`
- CORS configuré pour `iziresto.com`

---

## Processus de Déploiement

### Déploiement Automatique (CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel déploie automatiquement les PR

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel et Railway déploient automatiquement sur push main
```

### Déploiement Manuel

#### 1. Vérifications pré-déploiement
```bash
# S'assurer que tout est à jour
git pull origin main

# Vérifier les tests
pnpm test

# Vérifier le build
pnpm build

# Vérifier les migrations en attente
pnpm --filter @iziresto/database prisma migrate status
```

#### 2. Migrations Database
```bash
# Appliquer les migrations en production
DATABASE_URL=<prod-url> pnpm --filter @iziresto/database prisma migrate deploy
```

#### 3. Déployer
```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway up
```

---

## Rollback

### Frontend (Vercel)
1. Aller sur Vercel Dashboard
2. Deployments → Sélectionner un déploiement précédent
3. "Promote to Production"

### Backend (Railway)
1. Aller sur Railway Dashboard
2. Deployments → Sélectionner un déploiement précédent
3. "Rollback"

### Database
```bash
# Voir l'historique des migrations
pnpm --filter @iziresto/database prisma migrate status

# Rollback manuel (créer une migration inverse)
pnpm --filter @iziresto/database prisma migrate dev --name rollback_xxx
```

---

## Monitoring

### Logs
```bash
# Railway logs
railway logs

# Vercel logs
vercel logs
```

### Sentry (Errors)
- Dashboard: https://sentry.io/organizations/iziresto
- Alertes configurées pour erreurs critiques

### Uptime
- Utiliser UptimeRobot ou Better Uptime
- Endpoints à monitorer:
  - `https://iziresto.com` (Frontend)
  - `https://api.iziresto.com/health` (Backend)

---

## Checklist Déploiement

### Avant
- [ ] Tests passent localement
- [ ] Build réussit
- [ ] Migrations testées sur preview
- [ ] Variables d'environnement à jour
- [ ] Backup database si migration risquée

### Pendant
- [ ] Surveiller les logs
- [ ] Vérifier le health check
- [ ] Tester les fonctionnalités critiques

### Après
- [ ] Vérifier Sentry pour nouvelles erreurs
- [ ] Tester le flow utilisateur principal
- [ ] Vérifier les webhooks (Stripe)
- [ ] Monitorer les performances

---

## Secrets & Sécurité

### Rotation des secrets
- JWT_SECRET: Tous les 6 mois
- API Keys: Selon les recommandations du provider
- Database passwords: Tous les 3 mois

### Accès
- Production: Accès limité aux admins
- Secrets: Jamais dans le code, toujours en variables d'environnement
- Logs: Ne jamais logger de données sensibles

### Backup
- Database: Backup automatique Neon (point-in-time recovery)
- R2: Versionning activé
- Configs: Documentées dans ce repo
