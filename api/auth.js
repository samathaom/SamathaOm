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
          <h2>Step-by-Step Synchronization...</h2>
          <script>
            // We use an async IIFE to force sequential execution
            (async function() {
              const token = "${access_token}";
              const userKey = "decap-cms-user";
              const userObj = JSON.stringify({
                token: token,
                backendName: "github",
                preserveExternalStorage: true
              });

              if (window.opener) {
                try {
                  console.log("Step 1: Purging old state...");
                  window.opener.localStorage.removeItem(userKey);
                  window.opener.localStorage.removeItem("netlify-cms-user");
                  
                  // Artificial delay to ensure the browser disk I/O completes
                  await new Promise(r => setTimeout(r, 200));

                  console.log("Step 2: Injecting fresh token...");
                  window.opener.localStorage.setItem(userKey, userObj);
                  
                  // Verify the write happened before moving forward
                  const verification = window.opener.localStorage.getItem(userKey);
                  if (verification) {
                    console.log("Step 3: Verification success. Refreshing main window.");
                    await new Promise(r => setTimeout(r, 300));
                    window.opener.location.href = "https://samathaom.vercel.app/admin/#/";
                    
                    // Final safety delay before closing the source window
                    setTimeout(() => { window.close(); }, 500);
                  }
                } catch (e) {
                  console.log("Storage blocked. Using URL Hash fallback.");
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