import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Paper,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MessageIcon from '@mui/icons-material/Message';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/raise-complaint', label: 'Raise Complaint', icon: <ReportProblemIcon /> },
  { to: '/track', label: 'Track Complaint', icon: <TrackChangesIcon /> },
  { to: '/message-md', label: 'Message MD', icon: <MessageIcon /> },
  { to: '/products', label: 'Products', icon: <InventoryIcon /> },
  { to: '/dealers', label: 'Dealer Locator', icon: <LocationOnIcon /> },
];

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationsApi.list({ limit: 10 })).data,
    enabled: !!notifAnchor,
  });
  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => (await notificationsApi.unreadCount()).data,
  });
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const u = user as { name?: string; email?: string; phone?: string; city?: string } | null;
  const notifications = (notifData?.items || []) as Array<{ id: string; title: string; body?: string | null; readAt?: string | null; createdAt: string }>;
  const unreadCount = countData?.count ?? 0;

  const handleLogout = () => {
    setProfileAnchor(null);
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MD Desk
          </Typography>
          <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <PersonIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Menu anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ px: 2, py: 1.5, minWidth: 220 }}>
          <Typography variant="subtitle2" color="text.secondary">Profile</Typography>
          <Typography variant="body1" fontWeight={600}>{u?.name || '—'}</Typography>
          <Typography variant="body2" color="text.secondary">{u?.email || '—'}</Typography>
          {u?.phone && <Typography variant="body2" color="text.secondary">{u.phone}</Typography>}
          {u?.city && <Typography variant="body2" color="text.secondary">{u.city}</Typography>}
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ sx: { maxHeight: 400, width: 360 } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" component="button" onClick={() => markAllReadMutation.mutate()} sx={{ cursor: 'pointer', border: 0, background: 'none', color: 'primary.main' }}>
              Mark all read
            </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 && <Box sx={{ px: 2, py: 3, textAlign: 'center', color: 'text.secondary' }}>No notifications</Box>}
        {notifications.map((n) => (
          <MenuItem key={n.id} onClick={() => !n.readAt && markReadMutation.mutate(n.id)} sx={{ whiteSpace: 'normal', flexDirection: 'column', alignItems: 'flex-start', bgcolor: n.readAt ? undefined : 'action.hover' }}>
            <Typography variant="body2" fontWeight={600}>{n.title}</Typography>
            {n.body && <Typography variant="caption" color="text.secondary">{n.body}</Typography>}
            <Typography variant="caption" color="text.secondary">{new Date(n.createdAt).toLocaleString()}</Typography>
          </MenuItem>
        ))}
      </Menu>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Toolbar />
        <Box sx={{ width: 260 }} role="presentation">
          <List>
            {nav.map((item) => (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                sx={({ palette }) => ({
                  '&.active': { bgcolor: palette.primary.main, color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                })}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 7 }}>
        <Outlet />
      </Box>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1200,
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: 320,
        }}
      >
        {chatbotOpen ? (
          <Box sx={{ p: 2, position: 'relative' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Chatbot</Typography>
            <Typography variant="body2" color="text.secondary">Coming soon. We’ll add an assistant here to help with complaints and tracking.</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>Placeholder</Typography>
            <IconButton size="small" onClick={() => setChatbotOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="Close">×</IconButton>
          </Box>
        ) : (
          <IconButton onClick={() => setChatbotOpen(true)} sx={{ p: 2 }} title="Chatbot (coming soon)">
            <SmartToyOutlinedIcon sx={{ fontSize: 36 }} />
          </IconButton>
        )}
      </Paper>
    </Box>
  );
}
