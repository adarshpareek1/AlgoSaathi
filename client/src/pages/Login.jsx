import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser, googleLoginUser } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Brand from '../components/Brand';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(formData);
      login(data.user, data.token);
      navigate('/workspace');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const data = await googleLoginUser(credentialResponse.credential);
      login(data.user, data.token);
      navigate('/workspace');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <Brand className="pointer-events-none" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-slate-400 text-center mb-8">Sign in to continue coding</p>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            theme="filled_black"
            shape="pill"
            width="100%"
          />
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email" type="email" icon={Mail} required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
          />
          <Input
            label="Password" type="password" icon={Lock} required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="********"
          />
          <Button variant="primary" className="w-full" isLoading={loading}>Sign In</Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account? <Link to="/signup" className="text-blue-400">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;