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

    // Set the header so the browser doesn't just show raw text
    res.setHeader('Content-Type', 'text/html');

    // This script sends the message and then tries to close itself
    const responseScript = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          (function() {
            const message = "authorization:github:success:${JSON.stringify({
              token: content.access_token,
              provider: 'github'
            })}";
            
            // Send the token to the CMS window
            window.opener.postMessage(message, window.location.origin);
            
            // Give it a millisecond to send, then close the popup
            setTimeout(() => { window.close(); }, 100);
          })();
        </script>
        <p>Authorizing... you can close this window if it doesn't close automatically.</p>
      </body>
      </html>
    `;

    res.status(200).send(responseScript);

  } catch (err) {
    console.error(err);
    res.status(500).send(`Auth Failed: ${err.message}`);
  }
};