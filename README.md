# Portfolio

My portfolio site with a contact form, email delivery, and admin reply

## Overview

Static frontend served by Express. Visitors can send me a message through the contact form, and I can reply from a simple admin page. 

## Features

- Contact form that sends real emails
- Server-side validation and input sanitization
- HTML emails with plain text fallback via Resend
- Admin reply interface at `/reply` behind JWT auth
- Confirmation banner on successful form submission
- Basic in-memory rate limiting



## Setup

Create a `.env` in the project root:

```
RESEND_API=rs_XXXXXXXXXXXXXXXXXXXX
RECEIVING_EMAIL=you@example.com
ADMIN_PASS=some-strong-password
JWT_SECRET=some-long-secret
PORT=3000
WEBHOOK_SECRET=your-secret
```

`PORT` defaults to 3000 if you leave it out.

## Running locally

```bash
npm install
node server.js
```

Visit `http://localhost:3000` and submit the contact form to test it end to end.

## Contact flow

The form posts to `/send-message`. The server validates the fields, sanitizes input, and sends an email to `RECEIVING_EMAIL` via Resend. On success, the visitor gets redirected to `/?sent=true` which shows a confirmation notif

## Admin reply 

Go to `/login` and enter your `ADMIN_PASS` to get a JWT cookie. `/reply` serves the compose UI where you can send emails to one or more recipients, separated by commas or semicolons.

## Notes

- Rate limiting is in-memory, so it resets on restart. 

## Files

```
server.js          main server and email handlers
public/index.html  portfolio and contact form
public/script.js   confirmation banner logic
public/send.html   admin compose UI
public/style.css   styles
```

## Contributing

PRs welcome. If you're touching anything email-related, add tests and keep secrets out of version control.

## License

MIT
```
