import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  return (
    <main
      style={{
        padding: '70px 20px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '42px', marginBottom: '18px' }}>
        Welcome to Our Store
      </h1>

      <p
        style={{
          fontSize: '18px',
          color: '#444',
          maxWidth: '650px',
          margin: '0 auto',
          lineHeight: '1.5',
        }}
      >
        This is the landing page of our e-commerce project. Users can browse
        products, check categories, and access the platform in a simple way.
      </p>

      <div
        style={{
          marginTop: '28px',
          display: 'flex',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => navigate('/shop')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: '#2d6cdf',
            color: 'white',
          }}
        >
          Shop Now
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: 'white',
          }}
        >
          Login
        </button>
      </div>

      <div
        style={{
          marginTop: '55px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h3>Simple Design</h3>
          <p>A clean interface for users to explore the website easily.</p>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h3>Product Access</h3>
          <p>Users can view products, categories, and current offers here.</p>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h3>User Friendly</h3>
          <p>The page is designed to be simple, clear, and easy to use.</p>
        </div>
      </div>
    </main>
  );
}
export default LandingPage;