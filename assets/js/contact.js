(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('contact-status');
  const fields = ['name', 'email', 'message'].map((name) => form.elements.namedItem(name));
  let sending = false;

  const showStatus = (message, state) => {
    status.textContent = message;
    status.dataset.state = state;
  };

  fields.forEach((field) => field.addEventListener('input', () => field.setCustomValidity('')));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    fields.forEach((field) => {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : 'Please complete this field.');
    });
    if (!form.reportValidity()) return;

    const endpoint = window.PORTFOLIO_CONFIG?.formspreeEndpoint || '';
    if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
      showStatus('The contact form is temporarily unavailable. Please contact me using the email link.', 'error');
      return;
    }

    sending = true;
    button.disabled = true;
    button.textContent = 'Sending...';
    form.setAttribute('aria-busy', 'true');
    showStatus('', 'sending');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        showStatus(response.status === 429
          ? 'Too many messages have been submitted. Please wait a few minutes and try again.'
          : 'Your message could not be sent. Please try again or use the email link.', 'error');
        return;
      }
      form.reset();
      showStatus('Your message has been sent successfully!', 'success');
    } catch (error) {
      showStatus(error.name === 'AbortError'
        ? 'The request timed out. Delivery could not be confirmed. Please check your connection before trying again.'
        : 'Unable to send your message. Please check your connection and try again.', 'error');
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = 'Send Message';
      form.removeAttribute('aria-busy');
    }
  });
})();
