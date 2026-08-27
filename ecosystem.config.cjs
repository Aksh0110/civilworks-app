const path = require('path');

module.exports = {
  apps: [
    {
      name: 'civilworks-dev',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      interpreter: 'node',
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'civilworks-prod',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      interpreter: 'node',
      cwd: __dirname,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
