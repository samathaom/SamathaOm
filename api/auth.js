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
       return res.status(400).send("GitHub Error: No token received.");
    }

    // 3. The "Ironclad" Client-Side Script
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Success</title></head>
        <body style="text-align:center;font-family:sans-serif;padding-top:100px;background:#f4f4f4;">
          <h2>Authentication Successful</h2>
          <p>Redirecting to your dashboard... if stuck, <a href="/admin/#access_token=${access_token}">click here</a>.</p>
          <script>
            (function() {
              const token = "${access_token}";
              const authUrl = "https://samathaom.vercel.app/admin/#access_token=" + token;
              const payload = { token: token, provider: 'github' };
              const message = "authorization:github:success:" + JSON.stringify(payload);
              
              // PRIMARY: Attempt standard postMessage
              if (window.opener) {
                window.opener.postMessage(message, "*");
                
                // SECONDARY: Force the background tab to refresh into the dashboard
                try {
                  window.opener.location.href = authUrl;
                  setTimeout(() => { window.close(); }, 1000);
                } catch (e) {
                  // TERTIARY: If background access is blocked, redirect this window
                  window.location.replace(authUrl);
                }
              } else {
                // FALLBACK: If orphaned, redirect current window
                window.location.replace(authUrl);
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Auth Failure: " + err.message);
  }
};