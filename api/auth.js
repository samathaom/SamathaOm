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
              const message = "authorization:github:success:${JSON.stringify({
                token: access_token, 
                provider: 'github'
              })}";
              
              const sendToken = () => {
                if (window.opener) {
                  // Send message to ANY origin to ensure it hits the admin tab
                  window.opener.postMessage(message, "*");
                  console.log("Token sent.");
                }
              };

              // Send immediately
              sendToken();

              // Send again every 500ms in case the admin tab was still loading
              const interval = setInterval(sendToken, 500);

              // Auto-close after 3 seconds if it hasn't already
              setTimeout(() => {
                clearInterval(interval);
                window.close();
              }, 3000);
            })();
          </script>
          <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
            <p><strong>Authentication Successful!</strong></p>
            <p>You can close this window now and check your Admin tab.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Handshake Error: " + err.message);
  }
};