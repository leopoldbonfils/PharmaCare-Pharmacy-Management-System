import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaHospital, FaLock, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request'); // 'request' or 'reset'
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetData, setResetData] = useState({
    token: token || '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update token when URL changes
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setResetData(prev => ({ ...prev, token: urlToken }));
      setStep('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        // Extract token from message (format: "Password reset token generated. Token: {token}")
        const message = response.data.message || '';
        const tokenMatch = message.match(/Token:\s*([^\s]+)/);
        
        if (tokenMatch && tokenMatch[1]) {
          // Redirect to reset page with token
          navigate(`/forgot-password?token=${encodeURIComponent(tokenMatch[1])}`);
        } else {
          toast.success('Password reset link has been sent to your email');
          setStep('sent');
        }
      } else {
        toast.error(response.data.message || 'Error sending reset link');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast.error(error.response?.data?.message || 'Error sending reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetData.newPassword || !resetData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (resetData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/reset-password', {
        token: resetData.token,
        newPassword: resetData.newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.data.message || 'Error resetting password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Error resetting password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Link to="/" className="flex justify-center items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <FaHospital className="text-white text-2xl" />
            </div>
            <span className="text-3xl font-bold text-gray-900">PharmaCare</span>
          </Link>

          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-green-600 text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and click on the link to reset your password.
              </p>
              <Button onClick={() => navigate('/login')} variant="primary">
                Back to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Link to="/" className="flex justify-center items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <FaHospital className="text-white text-2xl" />
            </div>
            <span className="text-3xl font-bold text-gray-900">PharmaCare</span>
          </Link>

          <Card title="Reset Password" subtitle="Enter your new password">
            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                label="New Password"
                type="password"
                name="newPassword"
                value={resetData.newPassword}
                onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                required
                placeholder="Enter new password"
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                required
                placeholder="Confirm new password"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Password Requirements:</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>At least 6 characters long</li>
                  <li>Contains at least one uppercase letter</li>
                  <li>Contains at least one number</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  icon={<FaLock />}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <Link
                  to="/login"
                  className="text-center text-sm text-gray-600 hover:text-primary-600"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Link to="/" className="flex justify-center items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <FaHospital className="text-white text-2xl" />
          </div>
          <span className="text-3xl font-bold text-gray-900">PharmaCare</span>
        </Link>

        <Card title="Forgot Password" subtitle="Enter your email to receive a password reset link">
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                We'll send you a link to reset your password. Please check your email inbox.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={loading}
                icon={<FaEnvelope />}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link
                to="/login"
                className="text-center text-sm text-gray-600 hover:text-primary-600"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
