import { Link } from 'react-router-dom';

export const brandAssets = {
  logo: '/brand/lexai-logo.png',
  wordmark: '/brand/lexai-wordmark.png',
  mark: '/brand/lexai-mark-monochrome.png',
};

const paths = {
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrow: <><path d="m9 18 6-6-6-6" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  translate: <><path d="M4 5h7M7.5 3v2M5 9c2-1 4-3 5-6M5 5c1 3 3 5 6 6M13 21l4-9 4 9M14.5 18h5" /></>,
  quiz: <><path d="M9 11h6M9 15h4M8 3h8l4 4v14H4V3Z" /><path d="M16 3v5h4" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M15 4h5v16h-5" /></>,
  bridge: <><path d="M3 17c3-8 15-8 18 0M6 17v3M18 17v3M12 11v9" /></>,
  chevron: <><path d="m6 9 6 6 6-6" /></>,
  retry: <><path d="M20 6v5h-5M4 18v-5h5" /><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
};

export function Icon({ name, size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Brand({ compact = false }) {
  return <Link to="/app" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="LexAi home"><img src={compact ? brandAssets.mark : brandAssets.wordmark} alt="LexAi" /></Link>;
}

export function PulseLoader({ label = 'Loading…', compact = false }) {
  return <span className={`pulse-loader ${compact ? 'pulse-loader--compact' : ''}`}><span className="pulse-loader__dot" /><span>{label}</span></span>;
}

export function LoadingScreen({ label }) {
  return <main className="loading-screen"><img className="loading-screen__logo" src={brandAssets.logo} alt="LexAi" /><PulseLoader label={label} /></main>;
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return <div className="error-banner" role="alert"><span>{message}</span>{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss"><Icon name="close" size={16} /></button>}</div>;
}

export function EmptyState({ title, copy, actionLabel, onAction, small = false }) {
  return <div className={`empty-state ${small ? 'empty-state--small' : ''}`}><div className="empty-state__arc" aria-hidden="true" /><span className="empty-state__brand-mark"><img src={brandAssets.mark} alt="" /></span><h3>{title}</h3>{copy && <p>{copy}</p>}{actionLabel && <button type="button" className="button button--outline" onClick={onAction}><Icon name="plus" size={17} />{actionLabel}</button>}</div>;
}
