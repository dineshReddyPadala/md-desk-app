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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MessageIcon from '@mui/icons-material/Message';
import BarChartIcon from '@mui/icons-material/BarChart';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints';
import { useSocket } from '../socket/useSocket';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/complaints', label: 'Complaints', icon: <ReportProblemIcon /> },
  { to: '/messages', label: 'Messages', icon: <MessageIcon /> },
  { to: '/reports', label: 'Reports', icon: <BarChartIcon /> },
  { to: '/projects', label: 'Project Management', icon: <FolderIcon /> },
  { to: '/products', label: 'Products', icon: <InventoryIcon /> },
  { to: '/dealers', label: 'Dealers', icon: <StorefrontIcon /> },
  { to: '/clients', label: 'Client Management', icon: <PeopleIcon /> },
];

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const queryClient = useQueryClient();

  useSocket(token);

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

  const u = user as { name?: string; email?: string; phone?: string; city?: string; company?: string; role?: string } | null;
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
            MD Desk Admin
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
          {u?.role && <Typography variant="caption" color="text.secondary" display="block">Role: {u.role}</Typography>}
          {u?.company && <Typography variant="body2" color="text.secondary">{u.company}</Typography>}
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
    </Box>
  );
}
