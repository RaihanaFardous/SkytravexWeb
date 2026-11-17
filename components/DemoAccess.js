'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';
import { site, whatsappLink } from '@/lib/site';

// Demo starter, modelled on Travilo's "Book your free demo" flow:
// 1. the visitor fills in the form;
// 2. a window opens at once and SkyTravex creates their account on the live
//    booking site (see app/api/demo-access/route.js);
// 3. the window shows their logins with an Open button, and the logins are
//    also emailed to them. The SkyTravex team gets the lead by email.

const FORMSUBMIT = `https://formsubmit.co/ajax/${site.formsubmitId || site.leadsEmail}`;

const countries = [
  ['Bangladesh', '+880'],
  ['United Arab Emirates', '+971'],
  ['Saudi Arabia', '+966'],
  ['Qatar', '+974'],
  ['Oman', '+968'],
  ['Kuwait', '+965'],
  ['Bahrain', '+973'],
  ['United Kingdom', '+44'],
  ['India', '+91'],
  ['Pakistan', '+92'],
  ['Sri Lanka', '+94'],
  ['Nepal', '+977'],
  ['Malaysia', '+60'],
  ['United States', '+1'],
  ['Other', '+'],
];
const dialCodes = [...new Set(countries.map(([, d]) => d).filter((d) => d !== '+'))];

const empty = { name: '', designation: '', company: '', email: '', country: 'Bangladesh', dialCode: '+880', phone: '', message: '' };

const steps = ['Checking your details', `Creating your ${site.demoName} account`, 'Emailing your logins'];

function randomSum() {
  return [1 + Math.floor(Math.random() * 9), 1 + Math.floor(Math.random() * 9)];
}

function phoneError(dial, raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 'Enter your phone number.';
  if (dial === '+880') {
    const n = /^1[3-9]\d{8}$/.test(digits) ? `0${digits}` : digits;
    return /^01[3-9]\d{8}$/.test(n) ? null : 'Enter an 11-digit Bangladesh mobile number, like 01711000000.';
  }
  return digits.length >= 7 && digits.length <= 15 ? null : 'Enter a phone number of 7 to 15 digits.';
}

function CopyField({ label, value, secret }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      setShown(true);
    }
  };
  return (
    <div className="cred">
      <span className="cred-label">{label}</span>
      <code className="cred-value">{shown ? value : '•'.repeat(Math.min(value.length, 14))}</code>
      <span className="cred-actions">
        {secret ? (
          <button type="button" onClick={() => setShown((v) => !v)}>
            {shown ? 'Hide' : 'Show'}
          </button>
        ) : null}
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </span>
    </div>
  );
}

function Window({ stage, step, result, values, emailed, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const first = values.name.split(' ')[0];
  const progress = stage === 'working' ? Math.round(((step + 0.5) / steps.length) * 100) : 100;
  const login = result && result.login;

  return createPortal(
    <div className="launch-overlay" role="dialog" aria-modal="true" aria-label={stage === 'working' ? 'Preparing your demo' : 'Your demo'}>
      <div className="launch demo-window" role="status" aria-live="polite">
        {stage !== 'working' ? (
          <button type="button" className="demo-close" onClick={onClose} aria-label="Close">
            <Icon name="cross" size={16} />
          </button>
        ) : null}

        <div className="launch-sky" aria-hidden="true">
          <span className="launch-runway" />
          <span className="launch-plane" style={{ '--p': progress }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4.5 21.5 12 3 19.5 7.5 12Z" />
            </svg>
          </span>
          <span className="launch-trail" style={{ '--p': progress }} />
        </div>

        {stage === 'working' ? (
          <>
            <h2>
              Preparing your demo. <em>{first ? `Nearly there, ${first}.` : 'Nearly there.'}</em>
            </h2>
            <ol className="lift-steps">
              {steps.map((label, index) => (
                <li key={label} className={index < step ? 'is-done' : index === step ? 'is-active' : undefined}>
                  <span className="launch-check">
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                  {label}
                </li>
              ))}
            </ol>
            <p className="launch-note">This usually takes a few seconds. Keep this window open.</p>
          </>
        ) : null}

        {stage === 'ready' && result.account === 'created' ? (
          <>
            <h2>
              Your demo is ready. <em>Sign in and explore.</em>
            </h2>
            <div className="portal-creds">
              <div className="portal-creds-head">
                <span className="module-icon">
                  <Icon name="globe" size={18} />
                </span>
                <div>
                  <strong>Booking website</strong>
                  <small>{site.demoName}, live on SkyTravex</small>
                </div>
                <span className="pill pill-ok">Ready</span>
              </div>
              <CopyField label="URL" value={login.url.replace(/^https?:\/\//, '')} />
              <CopyField label="Email" value={login.email} />
              <CopyField label="Password" value={login.password} secret />
            </div>
            <ul className="portal-soon">
              <li>
                <Icon name="users" size={16} /> Agent portal <span>Shown on your walkthrough call</span>
              </li>
              <li>
                <Icon name="chart" size={16} /> Admin panel <span>Shown on your walkthrough call</span>
              </li>
            </ul>
            <p className="launch-note">
              {emailed
                ? `We have also sent these logins to ${login.email}. Check your spam folder if it is not in your inbox.`
                : 'Copy your password now. Payments and bookings on the demo site use test connections, so nothing is charged.'}
            </p>
            <div className="demo-window-actions">
              <a href={login.url} className="btn btn-primary chase">
                Open {site.demoName} and sign in
              </a>
            </div>
          </>
        ) : null}

        {stage === 'ready' && result.account === 'exists' ? (
          <>
            <h2>
              Welcome back. <em>You already have an account.</em>
            </h2>
            <p className="launch-note">
              {login.email} is already registered on {site.demoName}. Sign in with your password, or use
              &ldquo;Forgot your password?&rdquo; on the sign-in page to set a new one.
            </p>
            <div className="demo-window-actions">
              <a href={login.url} className="btn btn-primary chase">
                Go to {site.demoName} sign-in
              </a>
            </div>
          </>
        ) : null}

        {stage === 'fallback' ? (
          <>
            <h2>
              Almost there. <em>One step on {site.demoName}.</em>
            </h2>
            <p className="launch-note">
              We could not create your demo account automatically just now. Your details have reached our team.
              Create your account on {site.demoName} with the same email and you can start exploring straight away.
            </p>
            <div className="demo-window-actions">
              <a href={(result && result.signupUrl) || site.demoUrl} className="btn btn-primary chase">
                Create my {site.demoName} account
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export default function DemoAccess() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sum, setSum] = useState([4, 6]);
  const [answer, setAnswer] = useState('');
  const [stage, setStage] = useState('form'); // form | working | ready | fallback
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [emailed, setEmailed] = useState(false);
  const [formError, setFormError] = useState('');
  const fax = useRef(null);

  useEffect(() => {
    setSum(randomSum());
  }, []);

  const set = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === 'country') {
        const match = countries.find(([c]) => c === value);
        if (match && match[1] !== '+') next.dialCode = match[1];
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Enter your name.';
    if (!values.company.trim()) next.company = 'Enter your business name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter an email address like name@agency.com.';
    const pe = phoneError(values.dialCode, values.phone);
    if (pe) next.phone = pe;
    if (Number(answer) !== sum[0] + sum[1]) next.answer = 'Please answer the sum.';
    return next;
  };

  const sendEmails = async (account, login) => {
    const created = account === 'created' && login;
    const payload = {
      _subject: `SkyTravex demo: ${values.company.trim()} (${values.country})`,
      _template: 'table',
      _captcha: 'false',
      name: values.name.trim(),
      email: values.email.trim(),
      Designation: values.designation.trim() || 'Not given',
      Business: values.company.trim(),
      Country: values.country,
      Phone: `${values.dialCode} ${values.phone.trim()}`,
      'Looking to build': values.message.trim() || 'Not given',
      [`${site.demoName} account`]: account === 'created' ? 'Created by the demo form' : account === 'exists' ? 'Already existed' : 'Not created, visitor sent to sign up',
      'Sent from': window.location.href,
    };
    if (created) {
      payload._autoresponse = [
        `Hello ${values.name.trim().split(' ')[0]},`,
        '',
        `Your SkyTravex demo is ready. Sign in to the booking website below:`,
        '',
        `Booking website (${site.demoName}): ${login.url}`,
        `Email: ${login.email}`,
        `Password: ${login.password}`,
        '',
        'The demo site uses test supplier and payment connections, so nothing is charged.',
        'We will contact you to walk you through the agent portal and admin panel.',
        '',
        `SkyTravex by ${site.company}`,
        `${site.phone}  |  ${site.email}`,
      ].join('\n');
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(FORMSUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        keepalive: true,
      });
      const data = await response.json().catch(() => ({}));
      return response.ok && (data.success === true || data.success === 'true');
    } catch (e) {
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (fax.current && fax.current.value) return;
    const next = validate();
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setStage('working');
    setStep(0);
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    await wait(700);
    setStep(1);

    let data = null;
    try {
      const [response] = await Promise.all([
        fetch('/api/demo-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            dialCode: values.dialCode,
            phone: values.phone.trim(),
            fax: fax.current ? fax.current.value : '',
          }),
        }),
        wait(1200),
      ]);
      data = await response.json().catch(() => null);
    } catch (e) {
      data = null;
    }

    // A problem with what the visitor typed: back to the form with the message.
    if (data && !data.ok && data.field) {
      setStage('form');
      setErrors({ [data.field]: data.error });
      return;
    }
    if (data && !data.ok && !data.fallback) {
      setStage('form');
      setFormError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    setStep(2);
    const account = data && data.ok ? data.account : 'failed';
    const [sent] = await Promise.all([sendEmails(account, data && data.login), wait(800)]);
    setEmailed(Boolean(sent && account === 'created'));
    setResult(data && data.ok ? data : { signupUrl: data && data.signupUrl });
    setStep(3);
    await wait(400);
    setStage(data && data.ok ? 'ready' : 'fallback');
  };

  const close = () => {
    setStage('form');
    setResult(null);
    setAnswer('');
    setSum(randomSum());
  };

  const wa = whatsappLink(`Hello, I would like a SkyTravex demo for ${values.company || 'my agency'}.`);

  return (
    <>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="form-intro">
          <h2>Start your live demo</h2>
          <p>One sign-up gives you a live booking site to explore.</p>
        </div>
        <div className="form-row">
          <label>
            <span>Name</span>
            <input type="text" autoComplete="name" value={values.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
            {errors.name ? <em>{errors.name}</em> : null}
          </label>
          <label>
            <span>
              Designation <small>optional</small>
            </span>
            <input type="text" autoComplete="organization-title" value={values.designation} onChange={set('designation')} />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>Business name</span>
            <input type="text" autoComplete="organization" value={values.company} onChange={set('company')} aria-invalid={Boolean(errors.company)} />
            {errors.company ? <em>{errors.company}</em> : null}
          </label>
          <label>
            <span>Business email</span>
            <input type="email" autoComplete="email" value={values.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
            {errors.email ? <em>{errors.email}</em> : null}
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>Country</span>
            <select value={values.country} onChange={set('country')}>
              {countries.map(([c]) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="phone-field">
            <span className="field-label" id="phone-label">
              Phone number
            </span>
            <div className="phone-row">
              <select aria-label="Dial code" value={values.dialCode} onChange={set('dialCode')}>
                {dialCodes.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <input
                type="tel"
                autoComplete="tel-national"
                aria-labelledby="phone-label"
                placeholder={values.dialCode === '+880' ? '01711000000' : 'Mobile number'}
                value={values.phone}
                onChange={set('phone')}
                aria-invalid={Boolean(errors.phone)}
              />
            </div>
            {errors.phone ? <em>{errors.phone}</em> : null}
          </div>
        </div>
        <label>
          <span>
            What are you looking to build? <small>optional</small>
          </span>
          <textarea rows={3} maxLength={1000} value={values.message} onChange={set('message')} placeholder="Your OTA idea, routes you sell, suppliers you use" />
          <small className="char-count">{values.message.length} / 1000</small>
        </label>
        <label className="security">
          <span>Security check</span>
          <span className="security-row">
            <b aria-hidden="true">
              {sum[0]} + {sum[1]} =
            </b>
            <span className="sr-only">
              What is {sum[0]} plus {sum[1]}?
            </span>
            <input type="text" inputMode="numeric" value={answer} onChange={(e) => { setAnswer(e.target.value); setErrors((c) => ({ ...c, answer: undefined })); }} aria-invalid={Boolean(errors.answer)} placeholder="Your answer" />
          </span>
          {errors.answer ? <em>{errors.answer}</em> : null}
        </label>
        <input ref={fax} type="text" name="company_fax" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />

        {formError ? (
          <p className="form-alert" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary chase" disabled={stage === 'working'}>
            Start my live demo
          </button>
          {wa ? (
            <a href={wa} className="btn" target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={16} /> WhatsApp us
            </a>
          ) : null}
        </div>
        <p className="form-note">Your demo logins appear on screen and arrive by email. The demo site uses test payments, so nothing is charged.</p>
      </form>

      {stage !== 'form' ? <Window stage={stage} step={step} result={result} values={values} emailed={emailed} onClose={close} /> : null}
    </>
  );
}
