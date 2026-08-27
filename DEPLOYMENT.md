# PM2 Development and Production

## Development

```bash
npm install
cp .env.development.local.example .env.development.local
# set MongoDB URI
npm run seed
npm run pm2:dev
pm2 status
pm2 logs civilworks-dev
```

The development process uses PM2 watch mode. It ignores `.next`, `node_modules`, `.git`, and logs.

## Production

```bash
npm install
cp .env.production.local.example .env.production.local
# set production MongoDB URI
npm run seed
npm run pm2:prod
pm2 status
pm2 logs civilworks-prod
```

`pm2:prod` performs a production Next.js build first and then starts the production process under PM2.

## Server reboot persistence

On the host, configure PM2 startup once:

```bash
pm2 startup
pm2 save
```

PM2's official documentation recommends `pm2 startup` plus `pm2 save` to restore managed processes after reboot.
