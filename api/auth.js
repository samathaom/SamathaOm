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
              // Decode the token safely in the browser
              const token = atob("${encodedToken}");
              const payload = { token: token, provider: 'github' };
              const message = "authorization:github:success:" + JSON.stringify(payload);
              
              // TRY 1: PostMessage to opener (Standard flow)
              if (window.opener) {
                window.opener.postMessage(message, "*");
                setTimeout(() => { window.close(); }, 1000);
              } 
              
              // TRY 2: URL Hash Fallback (If opener is blocked/closed)
              setTimeout(() => {
                window.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
              }, 2000);
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Auth Error: " + err.message);
  }
};