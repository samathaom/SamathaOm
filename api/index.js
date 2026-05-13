// api/index.js
const { createProxy } = require('@vencax/netlify-cms-github-oauth-provider');

module.exports = createProxy({
  client_id: process.env.OAUTH_CLIENT_ID,
  client_secret: process.env.OAUTH_CLIENT_SECRET,
});