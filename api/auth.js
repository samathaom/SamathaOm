const axios = require('axios');

module.exports = async (req, res) => {
  // Use .trim() to prevent hidden space errors in Environment Variables
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID?.trim();
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET?.trim();
  const REDIRECT_URI = "https://samathaom.vercel.app/api/auth";
  
  const { code } = req.query;

  // STAGE 1: Start the OAuth Flow
  // If no code is present, the user just clicked "Login"
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=${REDIRECT_URI}`;
    return res.redirect(githubAuthUrl);
  }

  // STAGE 2: Complete the Handshake
  // Exchange the temporary 'code' for a permanent 'access_token'
  try {
    const response = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const { access_token } = response.data;

    if (!access_token) {
      throw new Error("GitHub did not return an access token.");
    }

    // STAGE 3: The "Bridge" Back to the Admin Dashboard
    // We send a robust HTML/JS package that forces the message through
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    const messagePayload = JSON.stringify({
      token: access_token,
      provider: 'github'
    });

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorizing...</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2>Authentication Successful!</h2>
          <p>Finalizing your session...</p>
          
          <script>
            (function() {
              const message = "authorization:github:success:${messagePayload}";
              const targetOrigin = "https://samathaom.vercel.app";

              // 1. Primary Method: PostMessage to the Opener
              const attemptSend = () => {
                if (window.opener) {
                  window.opener.postMessage(message, "*");
                  console.log("Token sent to opener.");
                }
              };

              // Try immediately and repeat every 500ms
              attemptSend();
              const interval = setInterval(attemptSend, 500);

              // 2. Secondary Method: Auto-close after 2 seconds
              setTimeout(() => {
                clearInterval(interval);
                if (window.opener) {
                  window.close();
                } else {
                  // 3. Fallback: If the opener is lost, redirect the popup itself
                  console.log("Opener lost. Redirecting...");
                  window.location.href = "/admin/#access_token=" + "${access_token}";
                }
              }, 2500);
            })();
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(500).send("Handshake Failed: " + err.message);
  }
};