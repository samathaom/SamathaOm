const axios = require('axios');

module.exports = async (req, res) => {
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID?.trim();
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET?.trim();
  const { code } = req.query;

  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=https://samathaom.vercel.app/api/auth`;
    return res.redirect(githubAuthUrl);
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code
      },
      headers: { 'Accept': 'application/json' }
    });

    const { access_token } = response.data;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorizing...</title></head>
        <body style="text-align:center;font-family:sans-serif;padding-top:100px;background:#f4f4f4;">
          <h2>Access Granted</h2>
          <p>Finalizing synchronization...</p>
          <script>
            (function() {
              const token = "${access_token}";
              const payload = { token: token, provider: 'github' };
              const message = "authorization:github:success:" + JSON.stringify(payload);
              
              // THE ARCHITECT'S "HAMMER" STRATEGY
              // 1. Try standard postMessage
              if (window.opener) {
                window.opener.postMessage(message, "*");
                
                // 2. Try to FORCE the opener to redirect to the authenticated URL
                // This bypasses the need for the listener to "hear" the message
                try {
                  window.opener.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
                  setTimeout(() => { window.close(); }, 500);
                } catch (e) {
                  // 3. Fallback: If opener is blocked, turn popup into the dashboard
                  window.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
                }
              } else {
                window.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Auth Failed: " + err.message);
  }
};