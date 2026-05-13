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
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      headers: { 'Accept': 'application/json' }
    });

    const { access_token } = response.data;
    const encodedToken = Buffer.from(access_token).toString('base64');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <body style="text-align:center;font-family:sans-serif;padding-top:50px;background:#f4f4f4;">
          <h2>Handshake Complete</h2>
          <p>Finalizing session... if you aren't redirected, <a href="/admin/#access_token=${access_token}">click here</a>.</p>
          <script>
            (function() {
              const token = atob("${encodedToken}");
              const payload = { token: token, provider: 'github' };
              const message = "authorization:github:success:" + JSON.stringify(payload);
              
              // 1. Attempt to update the main window's localStorage directly if possible
              try {
                if (window.opener) {
                   window.opener.localStorage.setItem("decap-cms-user", JSON.stringify({token: token, backendName: "github"}));
                }
              } catch(e) { console.log("Direct storage access blocked."); }

              // 2. Shout to the opener
              if (window.opener) {
                window.opener.postMessage(message, "*");
                // Force the main window to refresh to the dashboard
                setTimeout(() => {
                  try { window.opener.location.reload(); } catch(e) {}
                  window.close();
                }, 1500);
              } else {
                // 3. FALLBACK: Turn this popup into the dashboard itself
                window.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Auth Error: " + err.message);
  }
};