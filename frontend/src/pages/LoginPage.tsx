import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button, Input, Card } from '@/components/common';
import toast from 'react-hot-toast';
import { SparklesIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float delay-200" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl animate-float delay-400" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo and Branding */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow animate-float">
                <SparklesIcon className="h-12 w-12 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-primary blur-2xl opacity-50" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold gradient-text mb-2">VeriDoc</h1>
          <p className="text-lg text-gray-400 font-medium mb-1">
            by <span className="gradient-text-secondary">VionixCosmic</span>
          </p>
          <p className="text-sm text-gray-500">Intelligent Document Verification</p>
        </div>

        {/* Login Card */}
        <div className="glass-card animate-slide-up">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400">Sign in to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="pl-4"
                  />
                </div>

                <div className="relative group">
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="pl-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded" />
                  Remember me
                </label>
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              <Button 
                type="submit" 
                className="w-full group" 
                isLoading={isLoading}
                variant="primary"
              >
                <LockClosedIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="px-8 pb-8">
            <div className="glass rounded-xl p-4 flex items-center space-x-3 group hover:bg-white/10 transition-all duration-300">
              <div className="p-2 rounded-lg bg-success-500/20">
                <ShieldCheckIcon className="h-5 w-5 text-success-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Secure Authentication</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Your data is encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 animate-fade-in delay-300">
          <p>© 2024 VionixCosmic. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};