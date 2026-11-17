'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';
import { site, whatsappLink } from '@/lib/site';
import { solutions } from '@/lib/solutions';

// Emails each request to site.leadsEmail through FormSubmit (formsubmit.co).
// The very first submission sends an activation email to that inbox; click
// the link in it once and every later request is delivered.
const ENDPOINT = `https://formsubmit.co/ajax/${site.formsubmitId || site.leadsEmail}`;

const sizes = ['1 to 5 staff', '6 to 20 staff', '21 to 50 staff', 'More than 50 staff'];
const businessTypes = [...solutions.map((s) => s.name), 'Other'];

const empty = { name: '', email: '', phone: '', company: '', country: '', business: businessTypes[0], size: sizes[0], message: '' };

const copy = {
  demo: {
    subject: 'New SkyTravex live demo request',
    button: 'Start the live demo',
    sending: 'Preparing your demo',
  },
  contact: {
    subject: 'New SkyTravex enquiry',
    button: 'Send message',
    sending: 'Sending',
  },
  partner: {
    subject: 'New SkyTravex partner application',
    button: 'Apply to partner',
    sending: 'Sending',
  },
};

const launchSteps = ['Preparing your demo', 'Loading sample routes and fares', `Opening ${site.demoName}`];
const LAUNCH_MS = 1300;

function Launch({ name }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduce ? 400 : LAUNCH_MS;
    const timers = launchSteps.map((_, index) => window.setTimeout(() => setStep(index + 1), delay * (index + 1)));
    const go = window.setTimeout(() => {
      window.location.href = site.demoUrl;
    }, delay * (launchSteps.length + 1));
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(go);
    };
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const progress = Math.round(Math.min(100, (step / launchSteps.length) * 100));

  // Rendered on <body> so it sits above the header, footer and every section.
  return createPortal(
    <div className="launch-overlay" role="dialog" aria-modal="true" aria-label="Preparing your demo">
    <div className="launch" role="status" aria-live="polite">
      <div className="launch-sky" aria-hidden="true">
        <span className="launch-runway" />
        <span className="launch-plane" style={{ '--p': progress }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4.5 21.5 12 3 19.5 7.5 12Z" />
          </svg>
        </span>
        <span className="launch-trail" style={{ '--p': progress }} />
      </div>
      <h2>
        Thanks{name ? `, ${name.split(' ')[0]}` : ''}. <em>Your demo is taking off.</em>
      </h2>
      <ol className="lift-steps">
        {launchSteps.map((label, index) => (
          <li key={label} className={index < step ? 'is-done' : index === step ? 'is-active' : undefined}>
            <span className="launch-check">
              <Icon name="check" size={12} strokeWidth={2.6} />
            </span>
            {label}
          </li>
        ))}
      </ol>
      <p className="launch-note">
        {site.demoName} is a live customer booking site running on SkyTravex. The agent portal and admin back office are
        shown on a call, and our team will contact you to arrange it.
      </p>
      <a href={site.demoUrl} className="btn btn-primary chase">
        Continue to {site.demoName} now
      </a>
    </div>
    </div>,
    document.body
  );
}

export default function LeadForm({ mode = 'demo' }) {
  const text = copy[mode];
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const honey = useRef(null);

  useEffect(() => {
    const scope = new URLSearchParams(window.location.search).get('scope');
    if (scope) setValues((current) => ({ ...current, message: `Scope we are interested in: ${scope}.` }));
  }, []);

  const set = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter an email address like name@agency.com.';
    if (values.phone.trim() && values.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a phone number with country code, like +880 1711 000000.';
    if (!values.company.trim()) next.company = 'Enter your company name.';
    return next;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (honey.current && honey.current.value) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus(mode === 'demo' ? 'launching' : 'sending');
    const payload = {
      _subject: `${text.subject}: ${values.company}`,
      _template: 'table',
      _captcha: 'false',
      'Request type': mode === 'demo' ? 'Live demo' : mode === 'partner' ? 'Partner programme' : 'Contact',
      name: values.name.trim(),
      email: values.email.trim(),
      Phone: values.phone.trim() || 'Not given',
      Company: values.company.trim(),
      Country: values.country.trim() || 'Not given',
      'Business type': values.business,
      'Team size': values.size,
      Message: values.message.trim() || 'No message',
      'Sent from': window.location.href,
    };

    const send = () =>
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        // Until the inbox owner clicks FormSubmit's activation link, it answers
        // "This form needs Activation". That is not the visitor's fault, so it
        // must never block them.
        const pendingActivation = /activat/i.test(String(data.message || ''));
        if (!response.ok || ((data.success === 'false' || data.success === false) && !pendingActivation)) {
          throw new Error(data.message || 'failed');
        }
      });

    if (mode === 'demo') {
      // The demo never waits on email: the launch window opens at once and the
      // details are sent in the background.
      send().catch(() => {});
      return;
    }

    try {
      await send();
      setStatus('sent');
    } catch (error) {
      setStatus('failed');
    }
  };

  if (status === 'launching') return <Launch name={values.name} />;

  if (status === 'sent') {
    return (
      <div className="form-done" role="status">
        <span className="form-done-icon">
          <Icon name="check" size={26} strokeWidth={2.4} />
        </span>
        <h2>Message sent</h2>
        <p>
          Thanks, {values.name.split(' ')[0]}. We will reply to {values.email} within one working day.
        </p>
        <button type="button" className="btn" onClick={() => { setValues(empty); setStatus('idle'); }}>
          Send another message
        </button>
      </div>
    );
  }

  const wa = whatsappLink(`Hello, I am ${values.name || 'interested'} from ${values.company || 'a travel agency'}. I would like a SkyTravex demo.`);

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <label>
          <span>Your name</span>
          <input type="text" autoComplete="name" value={values.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
          {errors.name ? <em>{errors.name}</em> : null}
        </label>
        <label>
          <span>Work email</span>
          <input type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>
            Phone or WhatsApp <small>optional</small>
          </span>
          <input type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} placeholder="+880 1711 000000" />
          {errors.phone ? <em>{errors.phone}</em> : null}
        </label>
        <label>
          <span>Company</span>
          <input type="text" autoComplete="organization" value={values.company} onChange={set('company')} aria-invalid={Boolean(errors.company)} />
          {errors.company ? <em>{errors.company}</em> : null}
        </label>
      </div>
      <div className="form-row">
        <label>
          <span>
            Country <small>optional</small>
          </span>
          <input type="text" autoComplete="country-name" value={values.country} onChange={set('country')} />
        </label>
        <label>
          <span>Business type</span>
          <select value={values.business} onChange={set('business')}>
            {businessTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Team size</span>
        <select value={values.size} onChange={set('size')}>
          {sizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <label>
        <span>
          {mode === 'demo' ? 'What would you like to see?' : 'Message'} <small>optional</small>
        </span>
        <textarea rows={4} value={values.message} onChange={set('message')} placeholder="Routes you sell, suppliers you use, how many agents you have" />
      </label>
      <input ref={honey} type="text" name="_honey" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />

      {status === 'failed' ? (
        <p className="form-alert" role="alert">
          Your request did not go through. Check your connection and press the button again, or contact us on{' '}
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}{' '}
          or at <a href={`mailto:${site.email}`}>{site.email}</a>.
          {mode === 'demo' ? (
            <>
              {' '}
              You can also <a href={site.demoUrl}>open {site.demoName} directly</a>.
            </>
          ) : null}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary chase" disabled={status === 'sending'} aria-busy={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <span className="spinner" aria-hidden="true" /> {text.sending}
            </>
          ) : (
            text.button
          )}
        </button>
        {wa ? (
          <a href={wa} className="btn" target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={16} /> WhatsApp us
          </a>
        ) : null}
      </div>
      <p className="form-note">
        {mode === 'demo'
          ? `Your details go to the SkyTravex team so we can follow up, then ${site.demoName} opens for you to explore.`
          : 'Your details go to the SkyTravex team and are used only to reply to you.'}
      </p>
    </form>
  );
}
