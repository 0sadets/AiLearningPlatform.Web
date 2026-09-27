function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-brand">
          <div className="auth-logo">L</div>

          <h1>LearnAI</h1>

          <p>
            Навчальна платформа для викладачів та студентів
          </p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Вхід</h2>
            <p>Увійдіть у свій обліковий запис</p>
          </div>

          <form className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="example@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>

              <input
                id="password"
                type="password"
                placeholder="Введіть пароль"
              />
            </div>

            <button type="submit" className="primary-button">
              Увійти
            </button>
          </form>

          <p className="auth-footer">
            Ще немає облікового запису?{' '}
            <a href="#">Зареєструватися</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage