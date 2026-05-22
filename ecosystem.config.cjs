module.exports = {
  apps: [
    {
      name: "editory",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
      },
    },
  ],
};
