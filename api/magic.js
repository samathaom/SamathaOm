const { Resend } = require('resend');

module.exports = async (req, res) => {
  // 1. SET CORS HEADERS IMMEDIATELY
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle Preflight Request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { password } = req.body;
  const INTERNAL_PASSWORD = process.env.ADMIN_PASSWORD; // Ensure this is set in Vercel
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const GITHUB_PAT = process.env.GITHUB_PAT;

  // 2. Validate Environment Variables
  if (!RESEND_KEY || !GITHUB_PAT || !INTERNAL_PASSWORD) {
    console.error("Missing Environment Variables");
    return res.status(500).send("Server Configuration Error: Missing Keys.");
  }

  if (password !== INTERNAL_PASSWORD) {
    return res.status(401).send("Unauthorized: Incorrect Password");
  }

  try {
    const resend = new Resend(RESEND_KEY);
    const magicLink = `https://samathaom.vercel.app/admin/#access_token=${GITHUB_PAT}`;

    // Note: Resend Free Tier requires sending to your OWN verified email
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this default for Resend Free Tier testing
      to: 'writetosamathaom@gmail.com', // Must match your Resend dashboard email
      subject: '✨ Your CMS Magic Link',
      html: `<p>Access granted. Click below:</p><a href="${magicLink}">Enter Dashboard</a>`
    });

    if (error) {
      console.error(error);
      return res.status(400).json(error);
    }

    res.status(200).send("Magic link sent!");
  } catch (err) {
    console.error("Critical Error:", err);
    res.status(500).send("System Error: " + err.message);
  }
};