import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert, InputAdornment } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
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
            MD Desk Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to manage complaints, messages, and view analytics.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: 'action.active' }} /></InputAdornment> }}
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
        </Paper>
        <Box sx={{ color: 'white', maxWidth: 380 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Complaint Management
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Review and resolve customer complaints, update status, and track high-priority issues from a single dashboard.
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
            Messages & Reports
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            Reply to customer messages and analyze region-wise and product-wise complaint trends.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
