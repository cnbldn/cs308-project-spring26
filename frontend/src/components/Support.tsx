import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Support.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  from: 'user' | 'support';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
  lastMessageAt: string;
  messages: ChatMessage[];
}

// ─── Mock conversations (content intentionally not translated) ────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    subject: 'Order not received',
    status: 'open',
    lastMessageAt: '2026-06-07',
    messages: [
      {
        from: 'user',
        text: "I placed an order 2 weeks ago and it still hasn't arrived.",
        time: 'Jun 6, 10:00',
      },
      {
        from: 'support',
        text: "Hi! Sorry to hear that. Could you share your order ID so I can look into this for you?",
        time: 'Jun 6, 11:30',
      },
      {
        from: 'user',
        text: "The order ID is #A3F7B2. I'm getting worried it might be lost.",
        time: 'Jun 7, 09:00',
      },
      {
        from: 'support',
        text: "Thank you! I can see your order is in transit and should arrive by tomorrow. We apologise for the delay!",
        time: 'Jun 7, 14:30',
      },
    ],
  },
  {
    id: '2',
    subject: 'Wrong item received',
    status: 'resolved',
    lastMessageAt: '2026-06-03',
    messages: [
      {
        from: 'user',
        text: "I received a different game than what I ordered. I ordered Elden Ring but got FIFA.",
        time: 'Jun 1, 16:00',
      },
      {
        from: 'support',
        text: "We're sorry about the mix-up! We'll ship the correct item immediately and arrange a free return label for the wrong one.",
        time: 'Jun 2, 09:00',
      },
      {
        from: 'user',
        text: "The correct game arrived today. Thank you for sorting this out quickly!",
        time: 'Jun 3, 08:00',
      },
      {
        from: 'support',
        text: "Glad it arrived safely! I've marked this ticket as resolved. Enjoy the game!",
        time: 'Jun 3, 09:00',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lastMessage = (convo: Conversation) =>
  convo.messages[convo.messages.length - 1]?.text ?? '';

// ─── Component ────────────────────────────────────────────────────────────────

const Support: React.FC = () => {
  const { t } = useTranslation();

  // Derived data (uses t(), so defined inside component)
  const contactMethods = [
    { icon: '✉️', label: t('support.contactEmail'), value: t('support.contactEmailValue') },
    { icon: '💬', label: t('support.contactChat'), value: t('support.contactChatValue') },
    { icon: '📦', label: t('support.contactOrders'), value: t('support.contactOrdersValue') },
  ];

  const faqItems = [
    { question: t('support.faq1Question'), answer: t('support.faq1Answer') },
    { question: t('support.faq2Question'), answer: t('support.faq2Answer') },
    { question: t('support.faq3Question'), answer: t('support.faq3Answer') },
    { question: t('support.faq4Question'), answer: t('support.faq4Answer') },
    { question: t('support.faq5Question'), answer: t('support.faq5Answer') },
  ];

  // Page tab
  const [activeTab, setActiveTab] = useState<'help' | 'chats'>('help');

  // Help Center state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [chatInput, setChatInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatForm, setNewChatForm] = useState({ subject: '', message: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages]);

  // ── Help Center handlers ───────────────────────────────────────────────────

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleFormChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSubmitted(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = String(Date.now());
    const now = new Date().toLocaleString('en-GB', { day: 'short', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newConvo: Conversation = {
      id,
      subject: form.subject,
      status: 'open',
      lastMessageAt: new Date().toISOString().slice(0, 10),
      messages: [
        { from: 'user', text: form.message, time: now },
        {
          from: 'support',
          text: "Thanks for reaching out! Our support team will review your message and get back to you shortly.",
          time: now,
        },
      ],
    };
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(id);
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveTab('chats');
    }, 1500);
  };

  const isFormValid = form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim();

  // ── Chat handlers ──────────────────────────────────────────────────────────

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text || !activeConvo) return;
    const time = new Date().toLocaleString('en-GB', { day: 'short', month: 'short', hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { from: 'user', text, time };
    const autoReply: ChatMessage = {
      from: 'support',
      text: "Thanks for your message! A support agent will follow up with you as soon as possible.",
      time,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, status: 'open', lastMessageAt: new Date().toISOString().slice(0, 10), messages: [...c.messages, userMsg, autoReply] }
          : c
      )
    );
    setChatInput('');
  };

  const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartNewChat = () => {
    const { subject, message } = newChatForm;
    if (!subject.trim() || !message.trim()) return;
    const id = String(Date.now());
    const time = new Date().toLocaleString('en-GB', { day: 'short', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newConvo: Conversation = {
      id,
      subject: subject.trim(),
      status: 'open',
      lastMessageAt: new Date().toISOString().slice(0, 10),
      messages: [
        { from: 'user', text: message.trim(), time },
        {
          from: 'support',
          text: "Thanks for contacting support! We'll look into this and get back to you shortly.",
          time,
        },
      ],
    };
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(id);
    setNewChatForm({ subject: '', message: '' });
    setShowNewChat(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('support.title')}</h1>
        <p className={styles.subtitle}>{t('support.subtitle')}</p>
      </header>

      {/* Page tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'help' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('help')}
        >
          {t('support.tabHelp')}
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'chats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          {t('support.tabChats')}
        </button>
      </div>

      {/* ── Help Center ─────────────────────────────────────────────────────── */}
      {activeTab === 'help' && (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('support.contactTitle')}</h3>
            <div className={styles.contactGrid}>
              {contactMethods.map((method) => (
                <div key={method.label} className={styles.contactCard}>
                  <div className={styles.contactIcon}>{method.icon}</div>
                  <p className={styles.contactLabel}>{method.label}</p>
                  {method.value.split('\n').map((line, idx) => (
                    <p key={idx} className={styles.contactValue}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('support.faqTitle')}</h3>
            <div className={styles.faqList}>
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className={styles.faqItem}>
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>
                      <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}>+</span>
                    </button>
                    {isOpen && <p className={styles.faqAnswer}>{item.answer}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('support.formTitle')}</h3>
            <form className={styles.form} onSubmit={handleFormSubmit}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{t('support.formName')}</label>
                  <input
                    type="text"
                    placeholder={t('support.formNamePlaceholder')}
                    value={form.name}
                    onChange={handleFormChange('name')}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t('support.formEmail')}</label>
                  <input
                    type="email"
                    placeholder={t('support.formEmailPlaceholder')}
                    value={form.email}
                    onChange={handleFormChange('email')}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>{t('support.formSubject')}</label>
                <input
                  type="text"
                  placeholder={t('support.formSubjectPlaceholder')}
                  value={form.subject}
                  onChange={handleFormChange('subject')}
                />
              </div>
              <div className={styles.field}>
                <label>{t('support.formMessage')}</label>
                <textarea
                  placeholder={t('support.formMessagePlaceholder')}
                  value={form.message}
                  onChange={handleFormChange('message')}
                />
              </div>
              <button type="submit" className={styles.submitButton} disabled={!isFormValid}>
                {t('support.formSend')}
              </button>
              {submitted && (
                <p className={styles.successNote}>{t('support.formSent')}</p>
              )}
            </form>
          </section>
        </>
      )}

      {/* ── My Chats ────────────────────────────────────────────────────────── */}
      {activeTab === 'chats' && (
        <div className={styles.chatLayout}>
          {/* Sidebar */}
          <aside className={styles.chatSidebar}>
            <div className={styles.chatSidebarHeader}>
              <p className={styles.chatSidebarTitle}>{t('support.chatsTitle')}</p>
              <button
                className={styles.newChatButton}
                onClick={() => setShowNewChat(true)}
              >
                {t('support.newChatButton')}
              </button>
            </div>

            <div className={styles.ticketList}>
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={`${styles.ticketItem} ${convo.id === activeId ? styles.ticketItemActive : ''}`}
                  onClick={() => { setActiveId(convo.id); setShowNewChat(false); }}
                >
                  <div className={styles.ticketItemHeader}>
                    <span className={styles.ticketSubject}>{convo.subject}</span>
                    <span className={styles.ticketDate}>{convo.lastMessageAt}</span>
                  </div>
                  <p className={styles.ticketPreview}>{lastMessage(convo)}</p>
                  <span className={`${styles.statusBadge} ${convo.status === 'open' ? styles.statusOpen : styles.statusResolved}`}>
                    {convo.status === 'open' ? t('support.statusOpen') : t('support.statusResolved')}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat panel */}
          <div className={styles.chatPanel}>
            {showNewChat ? (
              <>
                <div className={styles.chatPanelHeader}>
                  <h4 className={styles.chatPanelTitle}>{t('support.newChatTitle')}</h4>
                </div>
                <div className={styles.newChatForm}>
                  <div className={styles.newChatField}>
                    <label>{t('support.newChatSubjectLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('support.newChatSubjectPlaceholder')}
                      value={newChatForm.subject}
                      onChange={(e) => setNewChatForm((p) => ({ ...p, subject: e.target.value }))}
                    />
                  </div>
                  <div className={styles.newChatField}>
                    <label>{t('support.newChatMessageLabel')}</label>
                    <textarea
                      placeholder={t('support.newChatMessagePlaceholder')}
                      value={newChatForm.message}
                      onChange={(e) => setNewChatForm((p) => ({ ...p, message: e.target.value }))}
                    />
                  </div>
                  <div className={styles.newChatActions}>
                    <button className={styles.cancelButton} onClick={() => setShowNewChat(false)}>
                      {t('support.cancel')}
                    </button>
                    <button
                      className={styles.startButton}
                      disabled={!newChatForm.subject.trim() || !newChatForm.message.trim()}
                      onClick={handleStartNewChat}
                    >
                      {t('support.startChat')}
                    </button>
                  </div>
                </div>
              </>
            ) : activeConvo ? (
              <>
                <div className={styles.chatPanelHeader}>
                  <h4 className={styles.chatPanelTitle}>{activeConvo.subject}</h4>
                  <span className={`${styles.statusBadge} ${activeConvo.status === 'open' ? styles.statusOpen : styles.statusResolved}`}>
                    {activeConvo.status === 'open' ? t('support.statusOpen') : t('support.statusResolved')}
                  </span>
                </div>

                <div className={styles.chatMessages}>
                  {activeConvo.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`${styles.messageRow} ${msg.from === 'user' ? styles.messageRowUser : styles.messageRowSupport}`}
                    >
                      <span className={styles.messageSender}>
                        {msg.from === 'user' ? t('support.senderYou') : t('support.senderSupport')}
                      </span>
                      <div className={`${styles.messageBubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleSupport}`}>
                        {msg.text}
                      </div>
                      <span className={styles.messageTime}>{msg.time}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.chatInputBar}>
                  {activeConvo.status === 'resolved' ? (
                    <p className={styles.resolvedNote}>{t('support.resolvedNote')}</p>
                  ) : (
                    <>
                      <textarea
                        className={styles.chatInput}
                        placeholder={t('support.chatInputPlaceholder')}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleChatInputKeyDown}
                        rows={1}
                      />
                      <button
                        className={styles.sendButton}
                        onClick={handleSend}
                        disabled={!chatInput.trim()}
                      >
                        Send
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyChat}>{t('support.emptyChat')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
