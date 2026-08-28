import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Brand, EmptyState, ErrorBanner, Icon, PulseLoader, brandAssets } from '../components/UI';

const languageOptions = ['English', 'Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

const relativeTime = (date) => {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const dayLabel = (date) => {
  const value = new Date(date); const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (value.toDateString() === today.toDateString()) return 'Today';
  if (value.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return value.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: value.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

function NewConversation({ onClose, onCreate, defaultLanguage }) {
  const [form, setForm] = useState({ title: '', subject: '', language: defaultLanguage || 'English' });
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try { await onCreate(form); onClose(); } catch (err) { setError(apiMessage(err)); } finally { setLoading(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-conversation-title"><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button><span className="kicker">NEW LEARNING PATH</span><h2 id="new-conversation-title">Start a conversation</h2><p>Give your tutor a little context before you begin.</p><form onSubmit={submit}><ErrorBanner message={error} /><div className="field"><label htmlFor="conversation-title">Title</label><div className="input-wrap"><input id="conversation-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Thermodynamics revision" /></div></div><div className="field"><label htmlFor="conversation-subject">Subject</label><div className="input-wrap"><input id="conversation-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="e.g. Mechanical Engineering" /></div></div><div className="field"><label htmlFor="conversation-language">Language</label><div className="input-wrap"><select id="conversation-language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>{languageOptions.map((item) => <option key={item}>{item}</option>)}</select></div></div><button className="button button--primary button--full" disabled={loading}>{loading ? <PulseLoader label="Opening the path…" compact /> : 'Create conversation'}</button></form></section></div>;
}

function ConversationRow({ item, active, editing, onSelect, onEdit, onRename, onDelete }) {
  const [title, setTitle] = useState(item.title);
  return <div className={`conversation-row ${active ? 'active' : ''}`}><button className="conversation-main" onClick={onSelect}>{editing ? <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') onRename(title); if (e.key === 'Escape') onEdit(null); }} onBlur={() => onRename(title)} /> : <><strong>{item.title}</strong><span><i>{item.subject}</i><time>{relativeTime(item.updatedAt)}</time></span></>}</button>{!editing && <span className="conversation-actions"><button onClick={() => onEdit(item._id)} aria-label={`Rename ${item.title}`}><Icon name="edit" size={15} /></button><button onClick={onDelete} aria-label={`Delete ${item.title}`}><Icon name="trash" size={15} /></button></span>}</div>;
}

function Sidebar({ open, conversations, activeId, user, loading, onClose, onNew, onSelect, onRename, onDelete, onLogout }) {
  const [editing, setEditing] = useState(null);
  return <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}><div className="sidebar__top"><Brand /><button className="icon-button mobile-only" onClick={onClose} aria-label="Close navigation"><Icon name="close" /></button></div><button className="button button--outline button--full new-chat" onClick={onNew}><Icon name="plus" size={17} />New conversation</button><div className="sidebar-label"><span>YOUR CONVERSATIONS</span><small>{conversations.length.toString().padStart(2, '0')}</small></div><div className="conversation-list">{loading ? <PulseLoader label="Finding your notes…" compact /> : conversations.length ? conversations.map((item) => <ConversationRow key={item._id} item={item} active={activeId === item._id} editing={editing === item._id} onSelect={() => { onSelect(item); onClose(); }} onEdit={setEditing} onRename={async (title) => { if (title.trim() && title.trim() !== item.title) await onRename(item._id, title.trim()); setEditing(null); }} onDelete={() => onDelete(item)} />) : <EmptyState small title="No conversations yet" copy="Ask your first question." actionLabel="Start one" onAction={onNew} />}</div><div className="sidebar-profile"><div className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'L'}</div><div><strong>{user?.name || 'Learner'}</strong><span>{[user?.college, user?.branch].filter(Boolean).join(' · ') || 'LexAi learner'}</span></div><button className="icon-button" onClick={onLogout} aria-label="Log out"><Icon name="logout" size={18} /></button></div></aside>;
}

function TranslationPicker({ message, cache, onTranslate }) {
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(''); const [error, setError] = useState('');
  async function select(language) { setLoading(language); setError(''); try { await onTranslate(message, language); setOpen(false); } catch (err) { setError(apiMessage(err)); } finally { setLoading(''); } }
  const translated = Object.entries(cache || {});
  return <div className="translate-control"><button className="translate-button" onClick={() => setOpen((value) => !value)}><Icon name="translate" size={15} />Translate</button>{open && <div className="language-menu">{languageOptions.map((language) => <button key={language} onClick={() => select(language)} disabled={Boolean(loading)}>{loading === language ? 'Translating…' : language}</button>)}</div>}{error && <small className="inline-api-error">{error}</small>}{translated.map(([language, content]) => <div className="translation" key={language}><span>{language}</span><p>{content}</p></div>)}</div>;
}

function MessageBubble({ message, translationCache, onTranslate, onRetry }) {
  if (message.kind === 'typing') return <div className="message-row ai"><div className="ai-avatar"><img src={brandAssets.mark} alt="" /></div><div className="message-bubble typing"><PulseLoader label="Tutor is thinking…" compact /></div></div>;
  const student = message.sender === 'student';
  return <div className={`message-row ${student ? 'student' : 'ai'}`}>{!student && <div className="ai-avatar"><img src={brandAssets.mark} alt="" /></div>}<div className={`message-bubble ${message.failed ? 'failed' : ''}`}><p>{message.content}</p><time>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending'}</time>{message.failed && <button className="retry-message" onClick={() => onRetry(message)}><Icon name="retry" size={15} />Couldn’t reach the tutor — tap to retry</button>}{!student && !message.failed && <TranslationPicker message={message} cache={translationCache} onTranslate={onTranslate} />}</div></div>;
}

function MessageThread({ messages, loading, translations, onTranslate, onRetry }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);
  if (loading) return <div className="thread thread--center"><PulseLoader label="Opening this conversation…" /></div>;
  let lastDay = '';
  return <div className="thread">{messages.map((message) => { const label = dayLabel(message.createdAt || new Date()); const divider = label !== lastDay; lastDay = label; return <div key={message._id}>{divider && <div className="day-divider"><span>{label}</span></div>}<MessageBubble message={message} translationCache={translations[message._id]} onTranslate={onTranslate} onRetry={onRetry} /></div>; })}<div ref={bottomRef} /></div>;
}

function Composer({ disabled, onSend }) {
  const [content, setContent] = useState('');
  const submit = () => { const value = content.trim(); if (!value || disabled) return; setContent(''); onSend(value); };
  return <div className="composer-wrap"><div className="composer"><textarea rows="1" value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Ask in any language…" maxLength={5000} disabled={disabled} /><span>{content.length}/5000</span><button onClick={submit} disabled={disabled || !content.trim()} aria-label="Send message"><Icon name="send" size={19} /></button></div><small>Enter to send · Shift + Enter for a new line</small></div>;
}

function QuizRunner({ quiz, onClose }) {
  const [index, setIndex] = useState(0); const [answers, setAnswers] = useState({});
  const question = quiz.questions[index]; const selected = answers[index]; const answered = selected !== undefined;
  if (!question) return <EmptyState title="This quiz has no questions" actionLabel="Close" onAction={onClose} />;
  const done = index === quiz.questions.length - 1;
  return <div className="quiz-runner"><div className="quiz-progress"><span style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} /></div><div className="quiz-meta"><span>{quiz.subject}</span><span>{index + 1} / {quiz.questions.length}</span></div><h3>{question.questionText}</h3><div className="quiz-options">{question.options.map((option, optionIndex) => { const isCorrect = answered && option === question.correctAnswer; const isWrong = answered && optionIndex === selected && !isCorrect; return <button key={option} className={`${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} disabled={answered} onClick={() => setAnswers({ ...answers, [index]: optionIndex })}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>; })}</div>{answered && <div className="explanation"><span>{question.options[selected] === question.correctAnswer ? 'That’s right' : 'Keep building'}</span><p>{question.explanation}</p></div>}{answered && <button className="button button--primary" onClick={() => done ? onClose() : setIndex(index + 1)}>{done ? 'Finish quiz' : 'Next question'}<Icon name="arrow" size={17} /></button>}</div>;
}

function QuizDrawer({ open, onClose }) {
  const { api } = useAuth(); const [tab, setTab] = useState('create');
  const [form, setForm] = useState({ subject: '', topic: '', language: 'English', numberOfQuestions: 5 });
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [quiz, setQuiz] = useState(null);
  const [past, setPast] = useState([]); const [pastLoading, setPastLoading] = useState(false);
  const loadPast = useCallback(async () => { setPastLoading(true); setError(''); try { const { data } = await api.get('/quiz'); setPast(data.quizzes || []); } catch (err) { if (err.response?.status === 404 && apiMessage(err) === 'No quizzes found') setPast([]); else setError(apiMessage(err)); } finally { setPastLoading(false); } }, [api]);
  useEffect(() => { if (open && tab === 'past') loadPast(); }, [open, tab, loadPast]);
  async function generate(event) { event.preventDefault(); setLoading(true); setError(''); try { const { data } = await api.post('/quiz', { ...form, numberOfQuestions: Number(form.numberOfQuestions) }); setQuiz(data.quiz); } catch (err) { setError(apiMessage(err)); } finally { setLoading(false); } }
  async function openQuiz(id) { setLoading(true); try { const { data } = await api.get(`/quiz/${id}`); setQuiz(data.quiz); } catch (err) { setError(apiMessage(err)); } finally { setLoading(false); } }
  async function deleteQuiz(id) { if (!window.confirm('Delete this quiz?')) return; try { await api.delete(`/quiz/${id}`); setPast((items) => items.filter((item) => item._id !== id)); } catch (err) { setError(apiMessage(err)); } }
  return <><div className={`drawer-scrim ${open ? 'open' : ''}`} onClick={onClose} /><aside className={`quiz-drawer ${open ? 'open' : ''}`} aria-hidden={!open}><div className="drawer-head"><div><span className="kicker">KNOWLEDGE CHECK</span><h2>Quiz studio</h2></div><button className="icon-button" onClick={onClose} aria-label="Close quiz"><Icon name="close" /></button></div>{quiz ? <QuizRunner quiz={quiz} onClose={() => { setQuiz(null); setTab('past'); }} /> : <><div className="drawer-tabs"><button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}><Icon name="quiz" size={16} />New quiz</button><button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}><Icon name="history" size={16} />Past quizzes</button></div><ErrorBanner message={error} onDismiss={() => setError('')} />{tab === 'create' ? <form className="quiz-form" onSubmit={generate}><p>Turn any topic into a focused, one-question-at-a-time practice session.</p><div className="field"><label>Subject</label><div className="input-wrap"><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="e.g. Data Structures" /></div></div><div className="field"><label>Topic</label><div className="input-wrap"><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required placeholder="e.g. Binary trees" /></div></div><div className="field-pair"><div className="field"><label>Language</label><div className="input-wrap"><select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>{languageOptions.map((item) => <option key={item}>{item}</option>)}</select></div></div><div className="field"><label>Questions</label><div className="stepper"><button type="button" onClick={() => setForm({ ...form, numberOfQuestions: Math.max(1, form.numberOfQuestions - 1) })}>−</button><strong>{form.numberOfQuestions}</strong><button type="button" onClick={() => setForm({ ...form, numberOfQuestions: Math.min(20, form.numberOfQuestions + 1) })}>+</button></div></div></div><button className="button button--primary button--full" disabled={loading}>{loading ? <PulseLoader label="Generating your quiz…" compact /> : 'Generate quiz'}</button></form> : <div className="past-quizzes">{pastLoading ? <PulseLoader label="Opening your quiz shelf…" /> : past.length ? past.map((item) => <article key={item._id}><button className="past-quiz-main" onClick={() => openQuiz(item._id)}><span className="kicker">{item.subject}</span><strong>{item.topic}</strong><small>{item.numberOfQuestions} questions · {item.language}</small></button><button className="icon-button" onClick={() => deleteQuiz(item._id)} aria-label="Delete quiz"><Icon name="trash" size={17} /></button></article>) : <EmptyState title="No quizzes yet" copy="Create one from a topic you want to master." actionLabel="Create a quiz" onAction={() => setTab('create')} />}</div>}</>}</aside></>;
}

export default function AssistantPage() {
  const { user, logout, api } = useAuth();
  const [conversations, setConversations] = useState([]); const [active, setActive] = useState(null); const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true); const [loadingMessages, setLoadingMessages] = useState(false);
  const [newOpen, setNewOpen] = useState(false); const [quizOpen, setQuizOpen] = useState(false); const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(''); const [sending, setSending] = useState(false); const [translations, setTranslations] = useState({});

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true); setError('');
    try { const { data } = await api.get('/conversations'); setConversations(data.conversations || []); }
    catch (err) { if (err.response?.status === 404 && apiMessage(err) === 'No conversations found') setConversations([]); else setError(apiMessage(err)); }
    finally { setLoadingConversations(false); }
  }, [api]);
  useEffect(() => { loadConversations(); }, [loadConversations]);

  async function selectConversation(conversation) { setActive(conversation); setMessages([]); setTranslations({}); setLoadingMessages(true); setError(''); try { const { data } = await api.get(`/messages/${conversation._id}`); setMessages(data.messages || []); } catch (err) { setError(apiMessage(err)); } finally { setLoadingMessages(false); } }
  async function createConversation(form) { const { data } = await api.post('/conversations', form); const next = data.conversation; setConversations((items) => [next, ...items]); await selectConversation(next); }
  async function renameConversation(id, title) { try { const { data } = await api.patch(`/conversations/${id}`, { title }); setConversations((items) => items.map((item) => item._id === id ? data.conversation : item)); if (active?._id === id) setActive(data.conversation); } catch (err) { setError(apiMessage(err)); } }
  async function patchActive(patch) { if (!active) return; try { const { data } = await api.patch(`/conversations/${active._id}`, patch); setActive(data.conversation); setConversations((items) => items.map((item) => item._id === active._id ? data.conversation : item)); } catch (err) { setError(apiMessage(err)); } }
  async function deleteConversation(item) { if (!window.confirm(`Delete “${item.title}” and its conversation history?`)) return; try { await api.delete(`/conversations/${item._id}`); setConversations((items) => items.filter((value) => value._id !== item._id)); if (active?._id === item._id) { setActive(null); setMessages([]); } } catch (err) { setError(apiMessage(err)); } }

  async function sendMessage(content, retryId = null) {
    if (!active || sending) return; setSending(true);
    const studentId = retryId || `temp-${Date.now()}`; const typingId = `typing-${Date.now()}`;
    if (retryId) setMessages((items) => items.map((item) => item._id === retryId ? { ...item, failed: false } : item).concat({ _id: typingId, kind: 'typing', sender: 'ai', createdAt: new Date().toISOString() }));
    else setMessages((items) => [...items, { _id: studentId, sender: 'student', content, createdAt: new Date().toISOString(), optimistic: true }, { _id: typingId, kind: 'typing', sender: 'ai', createdAt: new Date().toISOString() }]);
    try {
      const { data } = await api.post(`/messages/${active._id}`, { content });
      setMessages((items) => items.flatMap((item) => item._id === studentId ? [data.studentMessage] : item._id === typingId ? [data.aiMessage] : [item]));
      setConversations((items) => items.map((item) => item._id === active._id ? { ...item, updatedAt: new Date().toISOString() } : item));
    } catch (err) {
      setMessages((items) => items.filter((item) => item._id !== typingId).map((item) => item._id === studentId ? { ...item, failed: true, optimistic: false } : item));
      if (err.response?.status !== 502) setError(apiMessage(err));
    } finally { setSending(false); }
  }

  async function translate(message, language) {
    if (translations[message._id]?.[language]) return;
    const { data } = await api.post(`/messages/${message._id}/translate`, { language });
    setTranslations((current) => ({ ...current, [message._id]: { ...current[message._id], [language]: data.translated } }));
  }

  const activeLanguage = useMemo(() => active?.language || user?.preferredLanguage || 'English', [active, user]);
  return <main className="app-shell"><Sidebar open={sidebarOpen} conversations={conversations} activeId={active?._id} user={user} loading={loadingConversations} onClose={() => setSidebarOpen(false)} onNew={() => setNewOpen(true)} onSelect={selectConversation} onRename={renameConversation} onDelete={deleteConversation} onLogout={logout} /><section className="workspace"><header className="workspace-header"><button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>{active ? <div className="conversation-heading"><div><input aria-label="Conversation title" value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })} onBlur={() => patchActive({ title: active.title })} /><span><i>{active.subject}</i><select aria-label="Conversation language" value={activeLanguage} onChange={(e) => patchActive({ language: e.target.value })}>{languageOptions.map((item) => <option key={item}>{item}</option>)}</select></span></div></div> : <div className="conversation-heading"><span className="kicker">MULTILINGUAL AI TUTOR</span><h1>Your learning space</h1></div>}<button className="quiz-trigger" onClick={() => setQuizOpen(true)}><Icon name="quiz" size={18} /><span>Quiz studio</span></button></header><ErrorBanner message={error} onDismiss={() => setError('')} />{active ? <><MessageThread messages={messages} loading={loadingMessages} translations={translations} onTranslate={translate} onRetry={(message) => sendMessage(message.content, message._id)} /><Composer disabled={sending} onSend={sendMessage} /></> : <div className="workspace-empty"><EmptyState title="Where should we begin?" copy="Create a conversation, choose a subject and language, then ask your tutor anything." actionLabel="New conversation" onAction={() => setNewOpen(true)} /></div>}</section>{sidebarOpen && <button className="sidebar-scrim mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}{newOpen && <NewConversation onClose={() => setNewOpen(false)} onCreate={createConversation} defaultLanguage={user?.preferredLanguage} />}<QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} /></main>;
}
