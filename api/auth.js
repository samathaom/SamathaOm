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
    
    // Encode to Base64 to prevent SyntaxErrors from special characters
    const encodedToken = Buffer.from(access_token).toString('base64');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <body style="text-align:center;font-family:sans-serif;padding-top:50px;">
          <h2>Handshake Complete</h2>
          <p>Finalizing session...</p>
          <script>
            (function() {
              const token = atob("${encodedToken}");
              const payload = { token: token, provider: 'github' };
              const message = "authorization:github:success:" + JSON.stringify(payload);
              
              // 1. Force save the token to LocalStorage in the popup window
              // Sometimes the opener can read from the same origin's localStorage
              localStorage.setItem("decap-cms-user", JSON.stringify({token: token, backendName: "github"}));

              if (window.opener) {
                // 2. Shout the message to the opener
                window.opener.postMessage(message, "*");
                
                // 3. Force the opener to refresh to the dashboard
                // This is the "Aggressive" fix to bypass the stuck login screen
                try {
                  window.opener.location.href = "https://samathaom.vercel.app/admin/#/";
                } catch(e) {
                  console.error("Could not redirect opener directly.");
                }

                setTimeout(() => { window.close(); }, 500);
              } else {
                // 4. Fallback if the popup was orphaned
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