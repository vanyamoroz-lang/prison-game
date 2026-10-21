export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#2b1d14', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Добро пожаловать в игру</h1>
        <p>Чтобы начать, войдите через GitHub</p>
        <a 
          href="/auth/github" 
          style={{ display: 'inline-block', padding: '10px 20px', background: '#ffc21a', color: '#000', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', marginTop: '20px' }}
        >
          Войти через GitHub
        </a>
      </div>
    </div>
  );
}