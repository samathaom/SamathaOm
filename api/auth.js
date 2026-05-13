const axios = require('axios');

module.exports = async (req, res) => {
  // 1. Grab the temporary code GitHub sent to your browser
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // 2. Exchange that code for a real Access Token
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code: code,
      },
      headers: {
        'Content-Type': 'application/json', // Critical!
        'Accept': 'application/json'        // Tells GitHub to return JSON, not a 404 string
      }
    });

    const content = response.data;

    // 3. Send the result back to Decap CMS in the format it expects
    if (content.error) {
      res.status(400).send(`<html><body><script>
        window.opener.postMessage("authorization:github:error:${content.error}", "*");
      </script></body></html>`);
    } else {
      res.status(200).send(`<html><body><script>
        window.opener.postMessage("authorization:github:success:${JSON.stringify(content)}", "*");
      </script></body></html>`);
    }
  } catch (err) {
    console.error('OAuth Error:', err.response?.data || err.message);
    res.status(500).send(`Auth Failed: ${err.message}`);
  }
};