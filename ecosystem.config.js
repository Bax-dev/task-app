module.exports = {
  apps: [
    {
      name: 'taskflow',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/ec2-user/task-app',
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
