import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0097d7', light: '#4db8e8', dark: '#0069a3' },
    secondary: { main: '#f37336', light: '#ff9f5c', dark: '#c75a1f' },
    error: { main: '#c62828' },
    warning: { main: '#f37336' },
    success: { main: '#2e7d32' },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' as const },
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});
