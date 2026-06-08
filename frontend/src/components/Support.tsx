import React, { useState } from 'react';
import styles from './Support.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

const CONTACT_METHODS = [
  {
    icon: '✉️',
    label: 'Email Support',
    value: 'support@gamevault.example\nWe reply within 24 hours.',
  },
  {
    icon: '💬',
    label: 'Live Chat',
    value: 'Available on weekdays\n9:00 AM – 6:00 PM (GMT+3)',
  },
  {
    icon: '📦',
    label: 'Order Help',
    value: 'Track, cancel, or return\norders from your Account page.',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How can I track my order?',
    answer:
      'Once your order ships, you can view its current status from the "Orders" section of your account. Each order shows whether it is processing, in transit, delivered, or cancelled.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'You can request a return for eligible items from your order history within 30 days of delivery. Once a sales manager approves the request, your refund will be processed to your original payment method.',
  },
  {
    question: 'How do I change my account information?',
    answer:
      'Go to your Account page to update your name, email, delivery address, or tax ID, and to change your password at any time.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'Checkout currently uses a simulated card payment flow for demonstration purposes. No real charges are made.',
  },
  {
    question: 'I forgot my password. What should I do?',
    answer:
      'Use the "Forgot Password?" link on the login page to reset your password, or reach out to our support team for help.',
  },
];

const Support: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const isFormValid =
    form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Support</h1>
        <p className={styles.subtitle}>
          Need a hand with an order, your account, or anything else? Browse the FAQ below or send us a message.
        </p>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Get in Touch</h3>
        <div className={styles.contactGrid}>
          {CONTACT_METHODS.map((method) => (
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
        <h3 className={styles.sectionTitle}>Frequently Asked Questions</h3>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={item.question} className={styles.faqItem}>
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
        <h3 className={styles.sectionTitle}>Send Us a Message</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange('name')}
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Subject</label>
            <input
              type="text"
              placeholder="What can we help you with?"
              value={form.subject}
              onChange={handleChange('subject')}
            />
          </div>

          <div className={styles.field}>
            <label>Message</label>
            <textarea
              placeholder="Describe your issue or question..."
              value={form.message}
              onChange={handleChange('message')}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={!isFormValid}>
            Send Message
          </button>

          {submitted && (
            <p className={styles.successNote}>
              Thanks for reaching out! Our support team will get back to you soon.
            </p>
          )}
        </form>
      </section>
    </div>
  );
};

export default Support;
