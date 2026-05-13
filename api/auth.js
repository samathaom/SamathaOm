const axios = require('axios');

module.exports = async (req, res) => {
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID?.trim();
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET?.trim();
  const { code } = req.query;

  // 1. If no code, start the flow
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=https://samathaom.vercel.app/api/auth`;
    return res.redirect(githubAuthUrl);
  }

  try {
    // 2. Exchange code for token
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

    // 3. Force HTML response so the script actually runs
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // This script is the "Bridge" back to Decap CMS
     res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorizing...</title></head>
        <body>
          <script>
            (function() {
              // The exact string Decap CMS listens for
              const message = "authorization:github:success:${JSON.stringify({
                token: access_token, 
                provider: 'github'
              })}";
              
              // We use "*" to bypass origin mismatches during the final handshake
              if (window.opener) {
                window.opener.postMessage(message, "*");
                console.log("Token sent to opener.");
                
                // Give the main window a moment to process before closing
                setTimeout(() => { window.close(); }, 1000);
              } else {
                document.body.innerHTML = "Configuration Error: No opener window found.";
              }
            })();
          </script>
          <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
            <p>Authentication Successful!</p>
            <p>Closing this window and redirecting you to the dashboard...</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Handshake Error: " + err.message);
  }
};