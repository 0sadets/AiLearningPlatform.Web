import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { login } from "../api/authApi";
import { Link } from "react-router-dom";
function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedReturnUrl = searchParams.get("returnUrl");
  const returnUrl =
    requestedReturnUrl?.startsWith("/") &&
    !requestedReturnUrl.startsWith("//") &&
    !requestedReturnUrl.startsWith("/\\")
      ? requestedReturnUrl
      : "/courses";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      localStorage.setItem("token", response.token);

      navigate(returnUrl, { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.message ?? "Неправильний email або пароль.",
        );
      } else {
        setError("Сталася невідома помилка.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-brand">
          <div className="auth-logo">L</div>

          <h1>LearnAI</h1>

          <p>Навчальна платформа для викладачів та студентів</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Вхід</h2>
            <p>Увійдіть у свій обліковий запис</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>

              <input
                id="password"
                type="password"
                placeholder="Введіть пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="primary-button"
              disabled={isLoading}
            >
              {isLoading ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <p className="auth-footer">
            Ще немає облікового запису?{" "}
            <Link to={`/register?returnUrl=${encodeURIComponent(returnUrl)}`}>Зареєструватися</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
