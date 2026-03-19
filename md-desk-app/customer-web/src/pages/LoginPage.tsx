import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert, InputAdornment, Tabs, Tab } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PinOutlinedIcon from '@mui/icons-material/PinOutlined';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/endpoints';

type LoginTab = 'password' | 'otp';

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('password');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithOtp, isLoading } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(emailOrPhone.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    }
  };

  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    setSendingOtp(true);
    try {
      await authApi.sendLoginOtp(otpEmail.trim());
      setOtpSent(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithOtp(otpEmail.trim(), otp);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  const switchTab = (t: LoginTab) => {
    setTab(t);
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0097d7 0%, #0080b8 50%, #f37336 100%)',
        p: 2,
        position: 'relative',
      }}
    >
      <Box component="img" src="/TP-logo-1-1024x164-1.webp" alt="Techno Paints" sx={{ position: 'absolute', top: 24, right: 24, height: 48, width: 'auto', objectFit: 'contain' }} />
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, maxWidth: 900 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.95)',
            borderRadius: 3,
            maxWidth: 360,
          }}
        >
          <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
            MD Desk
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to raise complaints, track status, and message MD Desk.
          </Typography>
          <Tabs value={tab} onChange={(_, v) => switchTab(v as LoginTab)} sx={{ mb: 2 }} variant="fullWidth">
            <Tab label="Password" value="password" />
            <Tab label="Email OTP" value="otp" />
          </Tabs>
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          {tab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                label="Email or phone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="e.g. you@example.com or 9876543210"
                sx={{ mb: 2 }}
                required
                autoComplete="username"
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1 }}
                required
                InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
              />
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Typography component={Link} to="/forgot-password" variant="body2" color="primary.main">
                  Forgot password?
                </Typography>
              </Box>
              <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ py: 1.5 }}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          )}

          {tab === 'otp' && (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendLoginOtp}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="you@example.com"
                    sx={{ mb: 2 }}
                    required
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={sendingOtp} sx={{ py: 1.5 }}>
                    {sendingOtp ? 'Sending…' : 'Send OTP to email'}
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1.5 }} color="text.secondary">
                    Phone OTP (SMS) coming soon.
                  </Typography>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={otpEmail}
                    disabled
                    sx={{ mb: 2 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
                  />
                  <TextField
                    fullWidth
                    label="OTP (6 digits)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter code from email"
                    sx={{ mb: 2 }}
                    required
                    inputProps={{ maxLength: 6 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PinOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ py: 1.5 }}>
                    {isLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </Button>
                  <Button fullWidth variant="text" size="small" sx={{ mt: 1 }} onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}>
                    Use a different email
                  </Button>
                </form>
              )}
            </>
          )}

          <Typography sx={{ mt: 2 }} component={Link} to="/register" color="primary.main" fontWeight={500}>
            Don&apos;t have an account? Register
          </Typography>
        </Paper>
        <Box sx={{ color: 'white', maxWidth: 380 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Raise & Track Complaints
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Submit product or service complaints with photos, get a unique complaint ID, and track resolution status in real time.
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
            Message MD Desk
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Send suggestions or feedback directly to the management team and view all replies in one place.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
