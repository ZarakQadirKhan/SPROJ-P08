import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as login_api } from "../../services/authService";
import { useLanguage } from "../../contexts/LanguageContext";

function Login() {
  const navigate = useNavigate();
  const { t, language, setLanguage, direction } = useLanguage();
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [error_text, set_error_text] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [show_password, set_show_password] = useState(false);

  async function handle_submit(e) {
    e.preventDefault();
    set_error_text("");
    set_is_loading(true);
    try {
      await login_api({ email, password });
      // Get user role from localStorage to determine redirect
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          const role = user?.role;
          if (role === 'farmer') {
            navigate("/farmer-dashboard");
          } else if (role === 'admin') {
            navigate("/admin-dashboard");
          } else if (role === 'inspector') {
            navigate("/inspector-dashboard");
          } else {
            navigate("/dashboard");
          }
        } catch {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err && err.message ? err.message : t.login.loginFailed;
      set_error_text(message);
    } finally {
      set_is_loading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFDF7] flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1B1B1B]">Welcome back</h1>
            <p className="mt-2 text-[15px] text-[#6B7280]">Sign in to your AgriQual account</p>
          </div>

          {error_text && (
            <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] px-4 py-3 rounded-lg text-sm">
              {error_text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handle_submit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1B1B1B] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => set_email(e.target.value)}
                disabled={is_loading}
                className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent transition-all duration-150 disabled:bg-gray-50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1B1B1B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show_password ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => set_password(e.target.value)}
                  disabled={is_loading}
                  className="w-full px-3 py-2.5 pr-10 border border-[#D1D5DB] rounded-lg text-[#1B1B1B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent transition-all duration-150 disabled:bg-gray-50"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => set_show_password(!show_password)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1B1B1B] transition-colors"
                >
                  {show_password ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-[#2D6A4F] hover:text-[#52B788] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={is_loading}
              className="w-full bg-[#F4A261] text-white rounded-lg px-5 py-2.5 font-medium transition-all duration-150 hover:bg-[#e89451] active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              {is_loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0E7DD]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#FAFDF7] text-[#6B7280]">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-transparent text-[#2D6A4F] border border-[#2D6A4F] rounded-lg px-5 py-2.5 font-medium transition-all duration-150 hover:bg-[#F3F7F0] active:scale-[0.98] flex items-center justify-center gap-2"
              disabled={is_loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2D6A4F] hover:text-[#52B788] font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:flex-1 bg-[#2D6A4F] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F] to-[#1a4d35] opacity-90"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="max-w-md text-white space-y-6">
            <h2 className="text-[28px] font-semibold leading-tight">Monitor crop health with confidence</h2>
            <p className="text-[#B8E0D2] leading-relaxed text-[15px]">
              AgriQual helps wheat farmers in Pakistan detect diseases early, get actionable recommendations, and improve yields through AI-powered analysis.
            </p>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#52B788] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Instant disease detection from field images</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#52B788] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Weather-based farming recommendations</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#52B788] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Track diagnosis history and field reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
