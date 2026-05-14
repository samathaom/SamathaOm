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

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <body style="text-align:center;font-family:sans-serif;padding-top:100px;">
          <h2>Session Synchronized</h2>
          <script>
            (function() {
              const token = "${access_token}";
              const userObj = JSON.stringify({
                token: token,
                backendName: "github",
                preserveExternalStorage: true
              });

              // 1. Force write to localStorage of the main window
              if (window.opener) {
                try {
                  window.opener.localStorage.setItem("decap-cms-user", userObj);
                  window.opener.localStorage.setItem("netlify-cms-user", userObj);
                  
                  // 2. Trigger the refresh on the main window
                  window.opener.location.href = "https://samathaom.vercel.app/admin/#/";
                  
                  // 3. Close this popup
                  setTimeout(() => { window.close(); }, 500);
                } catch (e) {
                  // Fallback: If cross-origin prevents storage access, use the URL hash
                  window.opener.location.href = "https://samathaom.vercel.app/admin/#access_token=" + token;
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