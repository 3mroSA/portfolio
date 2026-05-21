require('dotenv').config();

const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { ok } = require('assert');
const e = require('express');

const app = express();
app.use(cookieParser());
const port = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API);
const crypto = require('crypto');

const processedEvents = new Set();

app.use(express.json({ limit: '10kb', verify: (req, res, buf) => { req.rawBody = buf } }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// simple rate limit
const store = new Map();
const windowMs = 10 * 60 * 1000;
const maxHits = 6;

function cleanStore() {
  const now = Date.now();
  for (const [key, hit] of store.entries()) {
    if (now - hit.firstAt > windowMs) {
      store.delete(key);
    }
  }
}

function limit(req, res, next) {
  const ip = req.ip || 'anon';
  const now = Date.now();
  const hit = store.get(ip);

  if (!hit || now - hit.firstAt > windowMs) {
    store.set(ip, { count: 1, firstAt: now });
  } else {
    hit.count += 1;
    if (hit.count > maxHits) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  }

  cleanStore();
  next();
}

function cleanTxt(txt, max = 1000) {
  if (typeof txt !== 'string') return '';
  return txt.trim().replace(/\s+/g, ' ').slice(0, max);
}

function escapeHtml(txt) {
  return String(txt)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function okEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

app.post('/send-message', limit, async (req, res) => {
  const name = cleanTxt(req.body.name, 80);
  const email = cleanTxt(req.body.email, 254).toLowerCase();
  const message = cleanTxt(req.body.message, 1200);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!okEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
if (email == "contact@3mro.xyz" || email == process.env.RECEIVING_EMAIL) {
  return res.status(400).json({ error: 'Invalid email' });
}

  try {
    console.log('Sending email...');

    const result = await resend.emails.send({
      from: 'Portfolio <contact@3mro.xyz>',
      to: process.env.RECEIVING_EMAIL,
      subject: `New message from ${name}`,
      reply_to: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: system-ui, sans-serif; color: #111; line-height: 1.5;">
          <h2 style="margin: 0 0 0.75rem; font-size: 20px;">New message from ${escapeHtml(name)}</h2>
          <p style="margin: 0 0 1rem; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #1a73e8; text-decoration: none;">${escapeHtml(email)}</a></p>
          <div style="padding: 16px; background: #f7f9fc; border: 1px solid #dde3eb; border-radius: 12px;">
            <p style="margin: 0 0 0.5rem; font-weight: 600; color: #222;">Message</p>
            <p style="margin: 0; white-space: pre-wrap; color: #333;">${escapeHtml(message)}</p>
          </div>
        </div>


        Email: ${escapeHtml(email)}
      Reply at <a href="3mro.xyz/reply?to=${encodeURIComponent(email)}&subject=${encodeURIComponent('Reply to your message')}" style="color: #1a73e8; text-decoration: none;">${escapeHtml(email)}</a>
      `,
     
    });

    console.log('Email sent:', result);
    res.redirect('/?sent=true');
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});



app.post('/send', limit, async (req, res) => {
  const to = cleanTxt(req.body.to, 5000);
  const subject = cleanTxt(req.body.subject, 200);
  const message = cleanTxt(req.body.message, 5000);

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const recipients = to
    .split(/[;,]+/)
    .map((addr) => addr.trim().toLowerCase())
    .filter((addr) => addr && okEmail(addr));

  if (!recipients.length) {
    return res.status(400).json({ error: 'No valid recipient email addresses' });
  }

const htmlMessage = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; line-height: 1.6;">

    <div style="margin-bottom: 14px;">
      <div style="font-size: 13px; color: #666;">Subject</div>
      <div style="font-size: 18px; font-weight: 600;">
        ${escapeHtml(subject)}
      </div>
    </div>

    <div style="padding-top: 16px; border-top: 1px solid #eee;">
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">Message</div>
      <div style="white-space: pre-wrap;">
        ${escapeHtml(message)}
      </div>
    </div>

  </div>
`;

  try {
    console.log('Sending email to:', recipients);
    const result = await resend.emails.send({
      from: 'Omar <contact@3mro.xyz>',
      to: recipients,
      subject,
      text: `${subject}\n\n${message}\n\nSent by Omar`,
      html: htmlMessage,
    });

    console.log('Email sent:', result);
    return res.redirect('/reply?sent=true');
  } catch (err) {
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
})





app.post('/login', limit , async(req, res) => {
  const password = req.body.password;
  
  if (password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 3600000 });
    res.redirect('/reply');
  } else {
    res.redirect('/login'); 
  }
  
  
});

app.post("/webhook", limit, async (req, res) => {
  try {
    if (!req.rawBody) return res.status(400).json({ error: 'Raw body required' });

    const sigHeader = req.get('resend-signature') || req.get('x-resend-signature') || req.get('signature');
    if (!sigHeader) return res.status(401).json({ error: 'Missing signature' });

    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error('no webhook secret');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const sigBuf = Buffer.from(String(sigHeader));
    const expectedBuf = Buffer.from(String(expected));
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventId = event && (event.id || (event.data && event.data.id));
    if (eventId) {
      if (processedEvents.has(eventId)) return res.json({ ignored: true });
      processedEvents.add(eventId);
    }

    if (event.type === "email.received") {
      const email = event.data || {};

      await resend.emails.send({
        from: "contact@3mro.xyz",
        to: process.env.RECEIVING_EMAIL,
        subject: `Forwarded: ${escapeHtml(email.subject || "No subject")}`,
        html: `
          <h2>New Email Received</h2>
          <p><strong>From:</strong> ${escapeHtml(email.from || 'Unknown')}</p>
          <p><strong>Subject:</strong> ${escapeHtml(email.subject || 'No subject')}</p>
          <hr />
          <pre>${escapeHtml(email.text || "No content")}</pre>
        `
      });

      return res.json({ success: true });
    }

    return res.json({ ignored: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// serving


app.get('/reply', (req, res) => {
  const token = req.cookies.token;
  if (!token){
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isAdmin) {
      res.sendFile(path.join(__dirname, 'public', 'send.html'));
    } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  } catch (err) {
    res.status(401).json({ success: false, error: 'Unknown error' });
  }
});



app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
