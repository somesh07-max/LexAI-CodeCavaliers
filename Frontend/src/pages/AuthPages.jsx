import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiMessage } from '../api/client';
import { brandAssets } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import '../auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Marathi', 'Bengali', 'Tamil', 'Kannada'];

function AuthLayout({ variant, children }) {
  const signup = variant === 'signup';
  const features = signup
    ? ['Learn naturally across seven Indian languages.', 'Personalize sessions for your college and branch.', 'Turn any topic into focused practice.']
    : ['Continue every multilingual learning conversation.', 'Create focused quizzes from the topics you study.', 'Keep your learning space personal and secure.'];

  return (
    <main className="lx-auth-shell">
      <section className="lx-auth-panel" aria-label="About LexAi">
        <div className="lx-auth-panel__grain" aria-hidden="true" />
        <svg className="lx-auth-panel__arc" viewBox="0 0 700 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <path d="M-70 320 Q350 45 770 320" fill="none" stroke="#B89B5E" strokeWidth="1.5" opacity=".52" />
          <path d="M-70 360 Q350 135 770 360" fill="none" stroke="#C9A6A0" strokeWidth="1" opacity=".38" />
        </svg>
        <div className="lx-auth-panel__content">
          <Link className="lx-auth-brand" to="/login" aria-label="LexAi login">
            <img src={brandAssets.wordmark} alt="LexAi" />
          </Link>
          <div className="lx-auth-panel__copy">
            <span className="lx-auth-kicker">YOUR MULTILINGUAL AI TUTOR</span>
            <h1>{signup ? 'Begin your learning journey.' : 'Welcome back to your learning space.'}</h1>
            <p>{signup ? 'Create an account tailored to your course, campus, and preferred language.' : 'Pick up where you left off and keep learning in the language that works for you.'}</p>
            <ul className="lx-features">
              {features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
            </ul>
          </div>
        </div>
      </section>
      <section className="lx-form-panel">
        <div className={`lx-form-card ${signup ? 'lx-form-card--signup' : ''}`}>{children}</div>
      </section>
    </main>
  );
}

function PasswordInput({ id, label, value, onChange, error, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="lx-field">
      <label className="lx-label" htmlFor={id}>{label}</label>
      <div className={`lx-input-wrap${error ? ' lx-input-wrap--error' : ''}`}>
        <input id={id} className="lx-input" type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} placeholder="At least 8 characters" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="button" className="lx-toggle-visibility" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="lx-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return <button className="lx-submit" type="submit" disabled={loading}>{loading ? <span className="lx-submit__loading" aria-label="Please wait"><i /><i /><i /></span> : children}</button>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { api, authenticate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      authenticate(data.accessToken, data.user, { remember: rememberMe });
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(apiMessage(error, 'Unable to log in. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout variant="login">
      <header className="lx-form-header"><span className="lx-auth-kicker">WELCOME BACK</span><h2>Log in to LexAi</h2><p>Enter your details to continue learning.</p></header>
      <form className="lx-form" onSubmit={submit} noValidate>
        {formError && <div className="lx-form-error" role="alert">{formError}</div>}
        <div className="lx-field">
          <label className="lx-label" htmlFor="login-email">Email</label>
          <div className={`lx-input-wrap${errors.email ? ' lx-input-wrap--error' : ''}`}><input id="login-email" className="lx-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} /></div>
          {errors.email && <p className="lx-error" id="login-email-error">{errors.email}</p>}
        </div>
        <PasswordInput id="login-password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} />
        <label className="lx-checkbox"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span className="lx-checkbox__box" aria-hidden="true" /><span>Remember me on this device</span></label>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
      <p className="lx-auth-switch">New to LexAi? <Link to="/signup">Create an account</Link></p>
    </AuthLayout>
  );
}

const initialSignup = { name: '', email: '', college: '', branch: '', year: '', semester: '', preferredLanguage: 'English', password: '', confirmPassword: '' };

export function SignupPage() {
  const navigate = useNavigate();
  const { api, authenticate } = useAuth();
  const [form, setForm] = useState(initialSignup);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const wrapClass = (key) => `lx-input-wrap${errors[key] ? ' lx-input-wrap--error' : ''}`;

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.college.trim()) next.college = 'College is required';
    if (!form.branch.trim()) next.branch = 'Branch is required';
    if (!form.year) next.year = 'Select your year';
    if (!form.semester) next.semester = 'Select your semester';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) next.terms = 'Please accept the terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...values } = form;
      void _confirmPassword;
      const payload = { ...values, name: values.name.trim(), email: values.email.trim(), college: values.college.trim(), branch: values.branch.trim(), year: Number(values.year), semester: Number(values.semester) };
      const { data } = await api.post('/auth/signup', payload);
      authenticate(data.accessToken, data.newUser);
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(apiMessage(error, 'Unable to create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout variant="signup">
      <header className="lx-form-header"><span className="lx-auth-kicker">GET STARTED</span><h2>Create your account</h2><p>A few details help LexAi tailor your learning space.</p></header>
      <form className="lx-form lx-form--signup" onSubmit={submit} noValidate>
        {formError && <div className="lx-form-error" role="alert">{formError}</div>}
        <div className="lx-field"><label className="lx-label" htmlFor="signup-name">Full name</label><div className={wrapClass('name')}><input id="signup-name" className="lx-input" value={form.name} onChange={update('name')} autoComplete="name" placeholder="Your full name" /></div>{errors.name && <p className="lx-error">{errors.name}</p>}</div>
        <div className="lx-field"><label className="lx-label" htmlFor="signup-email">Email</label><div className={wrapClass('email')}><input id="signup-email" className="lx-input" type="email" value={form.email} onChange={update('email')} autoComplete="email" placeholder="you@example.com" /></div>{errors.email && <p className="lx-error">{errors.email}</p>}</div>
        <div className="lx-field-row">
          <div className="lx-field"><label className="lx-label" htmlFor="signup-college">College</label><div className={wrapClass('college')}><input id="signup-college" className="lx-input" value={form.college} onChange={update('college')} placeholder="College name" /></div>{errors.college && <p className="lx-error">{errors.college}</p>}</div>
          <div className="lx-field"><label className="lx-label" htmlFor="signup-branch">Branch</label><div className={wrapClass('branch')}><input id="signup-branch" className="lx-input" value={form.branch} onChange={update('branch')} placeholder="e.g. Computer Science" /></div>{errors.branch && <p className="lx-error">{errors.branch}</p>}</div>
        </div>
        <div className="lx-field-row">
          <div className="lx-field"><label className="lx-label" htmlFor="signup-year">Year</label><div className={wrapClass('year')}><select id="signup-year" className="lx-input" value={form.year} onChange={update('year')}><option value="">Select year</option>{[1, 2, 3, 4].map((item) => <option key={item} value={item}>Year {item}</option>)}</select></div>{errors.year && <p className="lx-error">{errors.year}</p>}</div>
          <div className="lx-field"><label className="lx-label" htmlFor="signup-semester">Semester</label><div className={wrapClass('semester')}><select id="signup-semester" className="lx-input" value={form.semester} onChange={update('semester')}><option value="">Select semester</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <option key={item} value={item}>Semester {item}</option>)}</select></div>{errors.semester && <p className="lx-error">{errors.semester}</p>}</div>
        </div>
        <div className="lx-field"><label className="lx-label" htmlFor="signup-language">Preferred language</label><div className="lx-input-wrap"><select id="signup-language" className="lx-input" value={form.preferredLanguage} onChange={update('preferredLanguage')}>{LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></div></div>
        <div className="lx-field-row"><PasswordInput id="signup-password" label="Password" value={form.password} onChange={update('password')} error={errors.password} autoComplete="new-password" /><PasswordInput id="signup-confirm-password" label="Confirm password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" /></div>
        <div><label className="lx-checkbox"><input type="checkbox" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} /><span className="lx-checkbox__box" aria-hidden="true" /><span>I agree to the Terms and Privacy Policy</span></label>{errors.terms && <p className="lx-error lx-terms-error">{errors.terms}</p>}</div>
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="lx-auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
