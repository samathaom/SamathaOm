const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  const { password } = req.body;
  
  // 1. Efficient Security: Hardcode your internal password here
  // Or better: use process.env.ADMIN_PASSWORD in Vercel
  const INTERNAL_PASSWORD = "secret-code-123";

  if (password !== INTERNAL_PASSWORD) {
    return res.status(401).send("Unauthorized: Incorrect Password");
  }

  try {
    const MASTER_TOKEN = process.env.GITHUB_PAT;
    const magicLink = `https://samathaom.vercel.app/admin/#access_token=${MASTER_TOKEN}`;

    await resend.emails.send({
      from: 'CMS Auth <onboarding@resend.dev>',
      to: 'writetosamathaom@gmail.com', // Hardcode your destination email
      subject: '✨ Your CMS Magic Link',
      html: `<h3>Access Requested</h3>
             <p>Click the button below to bypass login and enter the dashboard:</p>
             <a href="${magicLink}" style="display:inline-block; padding:12px 20px; background:#000; color:#fff; text-decoration:none; border-radius:5px;">Enter CMS</a>`
    });

    res.status(200).send("Magic link sent!");
  } catch (error) {
    res.status(500).send("Error sending email.");
  }
};