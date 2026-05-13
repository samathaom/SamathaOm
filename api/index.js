const axios = require('axios');

module.exports = async (req, res) => {
  const { code, state } = req.query;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }, {
      headers: {
        Accept: 'application/json',
      },
    });

    const { access_token, error } = response.data;

    if (error) {
      res.status(400).send(`<html><body><script>window.opener.postMessage("authorization:github:error:${error}", "*");</script></body></html>`);
    } else {
      res.status(200).send(`<html><body><script>window.opener.postMessage("authorization:github:success:{"token":"${access_token}","provider":"github"}", "*");</script></body></html>`);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};