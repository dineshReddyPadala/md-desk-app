import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert, InputAdornment } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PinOutlinedIcon from '@mui/icons-material/PinOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/endpoints';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setSendingOtp(true);
    try {
      await authApi.sendOtp(email.trim());
      setOtpSent(true);
      setStep(2);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP from your email');
      return;
    }
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        otp,
        password,
        confirmPassword,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0097d7 0%, #0080b8 50%, #f37336 100%)', p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, maxWidth: 920 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 3, maxWidth: 420 }}>
          <PersonAddIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>Create account</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {step === 1 ? 'Enter your details and we’ll send a verification code to your email.' : 'Enter the OTP from your email and set your password.'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} required />
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} required InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} sx={{ mb: 2 }} placeholder="Optional" InputProps={{ startAdornment: <InputAdornment position="start"><BusinessOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={sendingOtp} sx={{ py: 1.5 }}>{sendingOtp ? 'Sending…' : 'Send OTP'}</Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister}>
              <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} required />
              <TextField fullWidth label="Email" type="email" value={email} disabled sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><BusinessOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="OTP (6 digits)" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter code from email" sx={{ mb: 2 }} required inputProps={{ maxLength: 6 }} InputProps={{ startAdornment: <InputAdornment position="start"><PinOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} required inputProps={{ minLength: 6 }} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 2 }} required inputProps={{ minLength: 6 }} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ py: 1.5 }}>{isLoading ? 'Creating account…' : 'Register'}</Button>
              <Button fullWidth variant="text" size="small" sx={{ mt: 1 }} onClick={() => { setStep(1); setOtp(''); setError(''); }}>Change email</Button>
            </form>
          )}

          <Typography sx={{ mt: 2 }} component={Link} to="/login" color="primary.main" fontWeight={500}>Already have an account? Sign In</Typography>
        </Paper>
        <Box sx={{ color: 'white', maxWidth: 380 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Why register?</Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>Get a single place to raise complaints, track them with your unique ID, and communicate with MD Desk. All replies from the admin team are visible in your message history.</Typography>
        </Box>
      </Box>
    </Box>
  );
}
