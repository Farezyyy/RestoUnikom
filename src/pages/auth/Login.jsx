import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.id);

      if (data.role === 'ADMIN' || data.role === 'KASIR') navigate('/admin');
      else if (data.role === 'WAITER' || data.role === 'PELAYAN') navigate('/waiter');
      else if (data.role === 'CHEF' || data.role === 'KOKI') navigate('/chef');
      else if (data.role === 'OWNER' || data.role === 'PEMILIK') navigate('/owner');
      else setError('Invalid role assigned');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 font-sans selection:bg-gray-900 selection:text-white">
      {/* Left side: Hero Image Panel */}
      <div className="relative w-full lg:w-2/3 min-h-[480px] lg:min-h-[calc(100vh-2.5rem)] rounded-[24px] overflow-hidden flex flex-col justify-between p-8 sm:p-12 text-white shadow-xl">
        {/* Background image matching reference */}
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D%3D"
          alt="Scenic Mountain Road"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35 z-0" />

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Center Headline */}
        <div className="relative z-10 my-auto py-10">
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] tracking-tight text-white max-w-xl drop-shadow-sm">
            Resto Unikom<br /><span className="text-4xl font-normal text-gray-300">Where eating is being told as a story</span>
          </h2>
        </div>
      </div>

      {/* Right side: Form Panel */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white rounded-[24px] shadow-sm">
        <div className="w-full max-w-[400px] mx-auto flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-gray-900 tracking-tight leading-tight">
              Welcome Back
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-gray-500 font-normal">
              Enter your email and password to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email input */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all bg-white"
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center space-x-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black h-4 w-4 accent-black"
                />
                <span className="text-xs sm:text-sm text-gray-600">Remember me</span>
              </label>
              <div className="text-xs sm:text-sm text-gray-600">
                Forgot password?{' '}
                <button
                  type="button"
                  onClick={() => alert('Please contact system administrator to reset password.')}
                  className="font-bold text-gray-900 hover:underline"
                >
                  Change now
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-100 text-xs sm:text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] hover:bg-black text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Sign Up prompt */}
            <div className="text-center text-xs sm:text-sm text-gray-600 pt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => alert('Account registration is managed by system administrator.')}
                className="font-bold text-gray-900 hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Or continue with email divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-4 text-xs text-gray-400 font-normal">
              Or continue with email
            </span>
          </div>

          {/* Social Sign-in Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => alert('Google Sign-in is not configured yet.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-all bg-white shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Facebook Sign-in is not configured yet.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-all bg-white shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
