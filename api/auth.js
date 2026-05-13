const axios = require('axios');

module.exports = async (req, res) => {
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID?.trim();
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET?.trim();
  const { code } = req.query;

  // 1. Initial Authorization Request
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=https://samathaom.vercel.app/api/auth`;
    return res.redirect(githubAuthUrl);
  }

  try {
    // 2. Exchange Code for Access Token
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

    if (!access_token) {
      return res.status(400).send("No access token received from GitHub.");
    }

    // 3. The Automated "Hammer" Redirect
    // This sends the user back to the admin page with the token in the URL.
    // Decap CMS will see this hash and automatically log in.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Success</title></head>
        <body style="text-align:center;font-family:sans-serif;padding-top:100px;">
          <h2>Authentication Successful!</h2>
          <p>Redirecting you to the dashboard...</p>
          <script>
            (function() {
              const token = "${access_token}";
              const authUrl = "https://samathaom.vercel.app/admin/#access_token=" + token;
              
              // Attempt to update the background tab first
              if (window.opener) {
                try {
                  window.opener.location.href = authUrl;
                  setTimeout(() => { window.close(); }, 500);
                } catch (e) {
                  // If background tab is blocked, redirect this window instead
                  window.location.href = authUrl;
                }
              } else {
                window.location.href = authUrl;
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Auth Failed: " + err.message);
  }
};