const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code: code,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const content = response.data;

    // The "Magic" Script: This sends the token back to the CMS window
    const responseScript = `
      <script>
        (function() {
          function recieve() {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({
                token: content.access_token,
                provider: 'github'
              })}',
              window.location.origin
            );
          }
          recieve();
        })();
      </script>
    `;

    res.status(200).send(responseScript);

  } catch (err) {
    res.status(500).send(`Auth Failed: ${err.message}`);
  }
};