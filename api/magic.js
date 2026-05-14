const { Resend } = require('resend');

module.exports = async (req, res) => {
  // 1. Force headers to prevent CORS issues
  res.setHeader('Content-Type', 'application/json');

  try {
    const { password } = req.body;
    
    // 2. Debug: Check if variables exist (without exposing them)
    if (!process.env.ADMIN_PASSWORD || !process.env.RESEND_API_KEY || !process.env.GITHUB_PAT) {
      return res.status(500).json({ 
        error: "Server Configuration Error", 
        details: "One or more Environment Variables are missing in Vercel." 
      });
    }

    // 3. Strict Password Check
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // 4. Send Email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const magicLink = `https://samathaom.vercel.app/admin/#access_token=${process.env.GITHUB_PAT}`;

    // Correct syntax for v6.x
        const { data, error } = await resend.emails.send({
        from: 'CMS Auth <onboarding@resend.dev>',
        to: 'writetosamathaom@gmail.com',
        subject: '✨ Your CMS Magic Link',
        html: `<p>Access granted. <a href="${magicLink}">Enter Dashboard</a></p>`
        });

    if (error) {
      return res.status(400).json({ error: "Resend Error", details: error });
    }

    return res.status(200).json({ message: "Magic link sent!" });

  } catch (err) {
    // This catches the "Function Invocation Failed" and gives us a reason
    return res.status(500).json({ error: "Internal Crash", details: err.message });
  }
};