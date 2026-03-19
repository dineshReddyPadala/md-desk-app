import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, Paper, Typography, Alert, InputAdornment } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { authApi } from '../api/endpoints';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
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
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'rgba(255,255,255,0.95)',
          borderRadius: 3,
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            If an account exists with this email, you will receive a reset link shortly. Check your inbox and spam folder.
          </Alert>
        )}
        {!success ? (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5 }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        ) : null}
        <Typography sx={{ mt: 2 }} component={Link} to="/login" color="primary.main" fontWeight={500} display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <ArrowBackIcon fontSize="small" /> Back to Sign In
        </Typography>
      </Paper>
    </Box>
  );
}
