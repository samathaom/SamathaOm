const axios = require('axios');

module.exports = async (req, res) => {
  // Use .trim() to ensure no accidental spaces break the handshake
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID?.trim();
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET?.trim();
  const REDIRECT_URI = "https://samathaom.vercel.app/api/auth";

  const { code } = req.query;

  // STEP 1: If no code, redirect user to GitHub Authorize
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=${REDIRECT_URI}`;
    return res.redirect(githubAuthUrl);
  }

  // STEP 2: Handle the callback from GitHub
  try {
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      headers: { 'Accept': 'application/json' }
    });

    const { access_token } = response.data;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <script>
        window.opener.postMessage(
          "authorization:github:success:${JSON.stringify({token: access_token, provider: 'github'})}",
          window.location.origin
        );
        window.close();
      </script>
    `);
  } catch (err) {
    res.status(500).send("Handshake Failed: " + err.message);
  }
};