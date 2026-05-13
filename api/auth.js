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
      data: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code },
      headers: { 'Accept': 'application/json' }
    });

    const { access_token } = response.data;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <body style="text-align:center;font-family:sans-serif;padding-top:100px;background:#f4f4f4;">
          <h2>Access Granted</h2>
          <p>Finalizing session...</p>
          <script>
            (function() {
              const token = "${access_token}";
              const content = "authorization:github:success:" + JSON.stringify({token: token, provider: 'github'});
              
              if (window.opener) {
                // 1. Try to tell the background window it's successful
                window.opener.postMessage(content, "*");
                
                // 2. FORCED REDIRECT: Command the background window to the dashboard URL
                // Decap CMS automatically detects 'access_token' in the URL hash
                try {
                  window.opener.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
                } catch (e) {
                  console.error("Redirection failed, fallback to manual.");
                }
                
                // 3. Close this popup
                setTimeout(() => { window.close(); }, 800);
              } else {
                // Fallback: Redirect this window if it lost its parent
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