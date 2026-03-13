import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert, InputAdornment } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(emailOrPhone.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    }
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
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
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
              sx={{ mb: 2 }}
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ py: 1.5 }}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
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
