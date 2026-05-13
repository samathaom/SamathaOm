const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;

  // STEP 1: If there's no code, the user is just starting the login.
  // Redirect them to GitHub's authorization page.
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&scope=repo&redirect_uri=https://samathaom.vercel.app/api/auth`;
    return res.redirect(githubAuthUrl);
  }

  // STEP 2: If there IS a code, GitHub sent them back here.
  // Exchange the code for a token.
  try {
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
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
    res.status(500).send("Auth Failed: " + err.message);
  }
};