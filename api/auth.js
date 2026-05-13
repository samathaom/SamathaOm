const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided");
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
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const { access_token } = response.data;

    // MANDATORY: Force Firefox to treat this as a webpage, not a JSON file
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    const message = JSON.stringify({
      token: access_token,
      provider: 'github'
    });

    // We use a clean HTML wrapper to ensure the script triggers immediately
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Authorizing...</title>
      </head>
      <body>
          <script>
              (function() {
                  const targetContent = "authorization:github:success:${message}";
                  // Send the token back to the main CMS window
                  window.opener.postMessage(targetContent, window.location.origin);
                  
                  // Brief delay to ensure message delivery, then close
                  setTimeout(() => {
                      window.close();
                  }, 200);
              })();
          </script>
          <div style="text-align: center; font-family: sans-serif; margin-top: 50px;">
              <p>Authentication successful! This window will close automatically.</p>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Auth Failed: " + err.message);
  }
};