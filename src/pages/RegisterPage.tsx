import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AxiosError } from 'axios'
import { register } from '../api/authApi'

function RegisterPage() {
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      const response = await register({
        firstName,
        lastName,
        email,
        password,
      })

      localStorage.setItem('token', response.token)

      navigate('/courses')
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ??
            'Не вдалося зареєструвати користувача.',
        )
      } else {
        setError('Сталася невідома помилка.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-brand">
          <div className="auth-logo">L</div>

          <h1>LearnAI</h1>

          <p>
            Створіть обліковий запис і почніть роботу з навчальною платформою
          </p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Реєстрація</h2>
            <p>Створіть новий обліковий запис</p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label htmlFor="firstName">
                Ім&apos;я
              </label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                Прізвище
              </label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Пароль
              </label>

              <input
                id="password"
                type="password"
                placeholder="Введіть пароль"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={isLoading}
            >
              {isLoading
                ? 'Створення акаунта...'
                : 'Зареєструватися'}
            </button>
          </form>

          <p className="auth-footer">
            Уже маєте обліковий запис?{' '}
            <Link to="/login">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage