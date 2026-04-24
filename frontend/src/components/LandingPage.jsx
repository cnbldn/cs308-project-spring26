import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const featureCards = [
    { title: t('landing.rareFindTitle'), desc: t('landing.rareFindDesc') },
    { title: t('landing.qualityTitle'), desc: t('landing.qualityDesc') },
    { title: t('landing.newArrivalsTitle'), desc: t('landing.newArrivalsDesc') },
  ];

  return (
    <main
      style={{
        padding: '90px 20px 80px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh',
      }}
    >
      {/* Hero */}
      <div
        style={{
          border: '1px solid #3a3225',
          background: '#161210',
          borderRadius: '6px',
          padding: '50px 30px',
        }}
      >
        <h1
          style={{
            fontSize: '2.4rem',
            marginBottom: '8px',
            color: '#ffd700',
            fontWeight: '700',
            letterSpacing: '1px',
          }}
        >
          Game Vault
        </h1>

        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '0.55rem',
            color: '#6b5c3a',
            letterSpacing: '3px',
            marginBottom: '24px',
          }}
        >
          {t('landing.tagline')}
        </p>

        <p
          style={{
            fontSize: '1.05rem',
            color: '#b5a882',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: '1.7',
          }}
        >
          {t('landing.subtitle')}
        </p>

        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate('/shop')}
            style={{
              padding: '12px 32px',
              fontSize: '0.95rem',
              border: '1px solid #d4a017',
              borderRadius: '4px',
              cursor: 'pointer',
              background: '#2a2215',
              color: '#ffd700',
              fontWeight: '600',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#3a3020'}
            onMouseLeave={e => e.target.style.background = '#2a2215'}
          >
            {t('landing.browseShop')}
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 32px',
              fontSize: '0.95rem',
              border: '1px solid #3a3225',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'transparent',
              color: '#b5a882',
              fontWeight: '600',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#d4a017';
              e.target.style.color = '#ffd700';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#3a3225';
              e.target.style.color = '#b5a882';
            }}
          >
            {t('login.signIn')}
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div
        style={{
          marginTop: '36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {featureCards.map((card) => (
          <div
            key={card.title}
            style={{
              padding: '24px 20px',
              border: '1px solid #2a2215',
              background: '#131110',
              borderRadius: '6px',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#5c4a2a'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2215'}
          >
            <h3
              style={{
                color: '#e8d5a3',
                fontSize: '1.1rem',
                marginBottom: '8px',
                marginTop: 0,
                fontWeight: '600',
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                color: '#8a7d62',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

export default LandingPage;
