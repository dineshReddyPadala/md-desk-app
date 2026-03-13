import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Paper, Typography, Chip, Alert, Skeleton } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InboxIcon from '@mui/icons-material/Inbox';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { dashboardApi } from '../api/endpoints';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
    x: { grid: { display: false } },
  },
};

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await dashboardApi.summary()).data,
  });
  const { data: regionData } = useQuery({
    queryKey: ['dashboard-region'],
    queryFn: async () => (await dashboardApi.regionStats()).data,
  });
  const { data: productData } = useQuery({
    queryKey: ['dashboard-product'],
    queryFn: async () => (await dashboardApi.productStats()).data,
  });
  const { data: statusData } = useQuery({
    queryKey: ['dashboard-status'],
    queryFn: async () => (await dashboardApi.statusStats()).data,
  });
  const { data: creationData } = useQuery({
    queryKey: ['dashboard-creation', 7],
    queryFn: async () => (await dashboardApi.creationStats({ days: 7 })).data,
  });

  const regionStats = regionData?.stats || [];
  const productStats = productData?.stats || [];
  const statusStats = statusData?.stats || [];
  const creationStats = creationData?.stats || [];
  const regionChart = {
    labels: regionStats.slice(0, 8).map((x) => x.city),
    datasets: [
      {
        label: 'Complaints',
        data: regionStats.slice(0, 8).map((x) => x.count),
        backgroundColor: 'rgba(0, 151, 215, 0.75)',
        borderRadius: 6,
      },
    ],
  };
  const productChart = {
    labels: productStats.slice(0, 8).map((x) => x.product),
    datasets: [
      {
        label: 'Complaints',
        data: productStats.slice(0, 8).map((x) => x.count),
        backgroundColor: 'rgba(46, 125, 50, 0.75)',
        borderRadius: 6,
      },
    ],
  };

  const donutColors = ['#0097d7', '#f37336', '#ffb74d', '#2e7d32'];
  const donutChart = {
    labels: statusStats.map((x) => x.label),
    datasets: [
      {
        data: statusStats.map((x) => x.count),
        backgroundColor: donutColors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      },
    ],
  };

  const creationChart = {
    labels: creationStats.map((x) => x.date.slice(5)),
    datasets: [
      {
        label: 'Created',
        data: creationStats.map((x) => x.count),
        backgroundColor: 'rgba(0, 151, 215, 0.75)',
        borderRadius: 6,
      },
    ],
  };

  if (isLoading || !summary) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={48} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const kpiCards = [
    { label: 'Total', value: summary.total, icon: <AssignmentIcon />, color: '#0097d7' },
    { label: 'Received', value: summary.received ?? 0, icon: <InboxIcon />, color: '#0097d7' },
    { label: 'Under Review', value: summary.underReview ?? 0, icon: <PendingActionsIcon />, color: '#f37336' },
    { label: 'In Progress', value: summary.inProgress ?? 0, icon: <BuildCircleIcon />, color: '#ffb74d' },
    { label: 'Resolved', value: summary.resolved, icon: <CheckCircleIcon />, color: '#2e7d32' },
    { label: 'High Priority', value: summary.highPriority, icon: <WarningAmberIcon />, color: '#c62828' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of complaints and key metrics
        </Typography>
      </Box>

      {summary.highPriority > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
        >
          {summary.highPriority} high priority complaint(s) need attention. Review them in the Complaints section.
        </Alert>
      )}

      <Grid container spacing={2}>
        {kpiCards.map((kpi) => (
          <Grid item xs={6} sm={4} md={2} key={kpi.label}>
            <Paper
              sx={{
                p: 1.5,
                borderLeft: 3,
                borderColor: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 56,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500} display="block">
                  {kpi.label}
                </Typography>
                <Typography variant="h6" fontWeight={700} component="span">
                  {kpi.label === 'High Priority' ? (
                    <Chip label={kpi.value} color="error" size="small" sx={{ height: 22, fontSize: '0.75rem' }} />
                  ) : (
                    kpi.value
                  )}
                </Typography>
              </Box>
              <Box sx={{ color: kpi.color, opacity: 0.85, '& .MuiSvgIcon-root': { fontSize: 28 } }}>{kpi.icon}</Box>
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: 340 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Track distribution by status</Typography>
            <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={donutChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)' } },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: 340 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints Created (Last 7 Days)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>New complaints per day</Typography>
            <Box sx={{ height: 240, mt: 1 }}>
              <Bar data={creationChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Region
            </Typography>
            <Box sx={{ height: 280, mt: 1 }}>
              <Bar data={regionChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 360 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Product
            </Typography>
            <Box sx={{ height: 280, mt: 1 }}>
              <Bar data={productChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
