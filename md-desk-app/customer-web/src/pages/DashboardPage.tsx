import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Grid, Card, CardContent, Button, Paper, Chip, Skeleton } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MessageIcon from '@mui/icons-material/Message';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { dashboardApi } from '../api/endpoints';

const statusLabels: Record<string, string> = {
  RECEIVED: 'Received',
  UNDER_REVIEW: 'Under Review',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};
const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  RECEIVED: 'info',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => (await dashboardApi.customerSummary()).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const activeProjects = summary?.activeProjects ?? [];
  const complaintStats = summary?.complaintStats ?? { RECEIVED: 0, UNDER_REVIEW: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  const totalComplaints = complaintStats.RECEIVED + complaintStats.UNDER_REVIEW + complaintStats.IN_PROGRESS + complaintStats.RESOLVED;

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 3 },
          flexWrap: 'wrap',
        }}
      >
        <Box
          component="img"
          src="/TP-logo-1-1024x164-1.webp"
          alt="TechnoPaints"
          sx={{
            height: { xs: 40, sm: 48 },
            width: 'auto',
            maxWidth: { xs: '100%', sm: 320 },
            objectFit: 'contain',
            objectPosition: 'left center',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 1,
            boxSizing: 'border-box',
            display: 'block',
            mb: { xs: 2, sm: 0 },
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Overview of your projects, complaints, and messages</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Active Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Active Projects
            </Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={120} />
            ) : activeProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No active projects assigned to you.</Typography>
            ) : (
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {activeProjects.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Typography variant="body2">
                      <strong>{p.name}</strong> · <Chip label={p.status.replace('_', ' ')} size="small" sx={{ verticalAlign: 'middle' }} />
                    </Typography>
                  </li>
                ))}
                {activeProjects.length > 5 && (
                  <Typography variant="body2" color="text.secondary">+{activeProjects.length - 5} more</Typography>
                )}
              </Box>
            )}
            <Button component={Link} to="/complaints" variant="outlined" size="small" sx={{ mt: 2 }}>View complaints</Button>
          </Paper>
        </Grid>

        {/* Complaint Status - KPIs & Donut-style summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaint Status
            </Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={140} />
            ) : (
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {(['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => (
                  <Grid item xs={6} key={status}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{statusLabels[status]}</Typography>
                      <Chip label={complaintStats[status]} color={statusColors[status]} size="small" />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
            <Typography variant="body2" color="text.secondary">Total: {totalComplaints} complaint(s)</Typography>
            <Button component={Link} to="/complaints" variant="contained" size="small" sx={{ mt: 2 }}>My complaints</Button>
          </Paper>
        </Grid>

        {/* Messages (Chat) */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <MessageIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Messages</Typography>
              <Typography variant="body2" color="textSecondary">Chat and messages with support</Typography>
              <Button component={Link} to="/message-md" variant="contained" sx={{ mt: 2 }}>Open messages</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <ReportProblemIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Raise Complaint</Typography>
              <Typography variant="body2" color="textSecondary">Submit a new complaint</Typography>
              <Button component={Link} to="/complaints" variant="contained" sx={{ mt: 2 }}>Complaints</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <TrackChangesIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Track Complaint</Typography>
              <Typography variant="body2" color="textSecondary">Check status with your complaint ID</Typography>
              <Button component={Link} to="/track" variant="contained" sx={{ mt: 2 }}>Track</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <InventoryIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Products</Typography>
              <Typography variant="body2" color="textSecondary">Product information</Typography>
              <Button component={Link} to="/products" variant="contained" sx={{ mt: 2 }}>Products</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <LocationOnIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Dealer Locator</Typography>
              <Typography variant="body2" color="textSecondary">Find dealers by city</Typography>
              <Button component={Link} to="/dealers" variant="contained" sx={{ mt: 2 }}>Dealer Locator</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
