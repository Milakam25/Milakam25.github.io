# Contact form setup

The existing form uses Formspree's POST endpoint with `Accept: application/json`.
It sends in the page without opening an email application. The email contact link
remains available separately.

## Create your form

1. Sign up at https://formspree.io/ and verify your email.
2. Create a form in the dashboard and select `mila425250@gmail.com` as its recipient.
3. Complete any recipient verification requested by Formspree.
4. Copy its endpoint, such as `https://formspree.io/f/abcdefgh`.
   The last part is your form ID. This public endpoint is not a private API key.
5. Enable the spam filtering options available in your Formspree dashboard.
   The form already includes Formspree's `_gotcha` honeypot. If you enable a CAPTCHA
   that requires a frontend widget, complete that integration before enforcing it.

## Configure locally

Use Node.js 22 or newer. Copy `.env.example` to `.env` and enter either:

```dotenv
FORMSPREE_FORM_ID=abcdefgh
```

or:

```dotenv
FORMSPREE_ENDPOINT=https://formspree.io/f/abcdefgh
```

Generate the browser configuration:

```sh
node tools/build-contact-config.mjs
```

The generator reads `.env` and environment variables; environment variables take
precedence, and a full endpoint takes precedence over an ID. It writes only the
public endpoint to `assets/js/contact-config.js`. Never put a private Formspree
API key in these settings. `.env` is ignored by Git.

## GitHub Pages deployment

1. In the repository's **Settings > Secrets and variables > Actions > Variables**,
   add a repository variable named `FORMSPREE_FORM_ID` with your ID, or
   `FORMSPREE_ENDPOINT` with the full endpoint. You only need one.
2. In **Settings > Pages > Source**, select **GitHub Actions**.
3. Push the changes to `main`, or run **Deploy portfolio** from the Actions tab.

The workflow generates the configuration before deploying only the public site
files. It stops with a clear error if configuration is missing or invalid.
The checked-in empty configuration shows an unavailable message on submission
until you configure it; it never pretends a message was sent.

## Test delivery

Serve the site over HTTP locally (for example `python3 -m http.server 4173`) or use
the deployed GitHub Pages URL. Avoid `file://` for delivery testing because origin
restrictions can affect requests.

1. Try empty fields and an invalid email; the browser should block submission.
2. Submit a unique test message with a real reply email. The button shows
   `Sending...` and is disabled until the request finishes.
3. Confirm the success message appears and fields clear. Check the submission
   in the Formspree dashboard and the recipient inbox, including spam/junk.
4. Check Reply in the delivered notification uses the visitor's email.
5. In browser developer tools, switch Network to Offline and try again. Expect
   a clear error, preserved fields, and an enabled retry button.
6. Repeat at a mobile width; the form remains visible and usable.

Run the automated mocked-request checks with:

```sh
node --test tools/contact.test.mjs
```

These checks don't send real messages. Real delivery requires a verified Formspree
account, configured endpoint, and a successful inbox test.
