import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Paper, Typography, Chip, Alert, Skeleton } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InboxIcon from '@mui/icons-material/Inbox';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveModeratorIcon from '@mui/icons-material/RemoveModerator';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import { dashboardApi } from '../api/endpoints';
import { useStaffRole } from '../hooks/useStaffRole';
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
  const { isEmployee } = useStaffRole();

  const dashboardQueryOpts = { staleTime: 0, refetchOnMount: 'always' as const };

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', isEmployee],
    queryFn: async () => (await dashboardApi.summary()).data,
    ...dashboardQueryOpts,
  });
  const { data: regionData } = useQuery({
    queryKey: ['dashboard-region', isEmployee],
    queryFn: async () => (await dashboardApi.regionStats()).data,
    ...dashboardQueryOpts,
  });
  const { data: projectComplaintData } = useQuery({
    queryKey: ['dashboard-project-complaints', isEmployee],
    queryFn: async () => (await dashboardApi.projectComplaintStats()).data,
    ...dashboardQueryOpts,
  });
  const { data: statusData } = useQuery({
    queryKey: ['dashboard-status', isEmployee],
    queryFn: async () => (await dashboardApi.statusStats()).data,
    ...dashboardQueryOpts,
  });
  const { data: creationData } = useQuery({
    queryKey: ['dashboard-creation', 7, isEmployee],
    queryFn: async () => (await dashboardApi.creationStats({ days: 7 })).data,
    ...dashboardQueryOpts,
  });

  const regionStats = regionData?.stats || [];
  const projectComplaintStats = projectComplaintData?.stats || [];
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
  const projectComplaintChart = {
    labels: projectComplaintStats.slice(0, 12).map((x) => x.project),
    datasets: [
      {
        label: 'Complaints linked to project',
        data: projectComplaintStats.slice(0, 12).map((x) => x.count),
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

  const dashboardLogo = (
    <Box
      component="img"
      src="/TP-logo-1-1024x164-1.webp"
      alt="TechnoPaints"
      sx={{
        height: { xs: 40, sm: 48 },
        width: 'auto',
        maxWidth: { xs: '100%', sm: 320 },
        objectFit: 'contain',
        objectPosition: 'right center',
        display: 'block',
        flexShrink: 0,
        alignSelf: { xs: 'flex-end', sm: 'center' },
      }}
    />
  );

  if (isLoading || !summary) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
            width: '100%',
          }}
        >
          <Skeleton variant="text" width={200} height={48} />
          {dashboardLogo}
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  type KpiChip = 'none' | 'error' | 'warning' | 'success' | 'default';
  const allKpiCards: Array<{
    label: string;
    value: number;
    icon: ReactNode;
    color: string;
    employeeOk: boolean;
    chip?: KpiChip;
  }> = [
    { label: 'Total Complaints', value: summary.total, icon: <AssignmentIcon />, color: '#0097d7', employeeOk: true },
    { label: 'Total Clients', value: summary.totalClients ?? 0, icon: <PeopleIcon />, color: '#5c6bc0', employeeOk: false },
    { label: 'Ongoing Projects', value: summary.ongoingProjects ?? 0, icon: <FolderIcon />, color: '#26a69a', employeeOk: true },
    { label: 'Received', value: summary.received ?? 0, icon: <InboxIcon />, color: '#0097d7', employeeOk: true },
    { label: 'Under Review', value: summary.underReview ?? 0, icon: <PendingActionsIcon />, color: '#f37336', employeeOk: true },
    { label: 'In Progress', value: summary.inProgress ?? 0, icon: <BuildCircleIcon />, color: '#ffb74d', employeeOk: true },
    { label: 'Resolved', value: summary.resolved, icon: <CheckCircleIcon />, color: '#2e7d32', employeeOk: true },
    {
      label: 'High Priority',
      value: summary.highPriority,
      icon: <WarningAmberIcon />,
      color: '#c62828',
      employeeOk: true,
      chip: 'error',
    },
    {
      label: 'Medium Priority',
      value: summary.mediumPriority ?? 0,
      icon: <RemoveModeratorIcon />,
      color: '#ef6c00',
      employeeOk: true,
      chip: 'warning',
    },
    {
      label: 'Low Priority',
      value: summary.lowPriority ?? 0,
      icon: <LowPriorityIcon />,
      color: '#558b2f',
      employeeOk: true,
      chip: 'success',
    },
  ];
  const kpiCards = isEmployee ? allKpiCards.filter((k) => k.employeeOk) : allKpiCards;

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, sm: 3 },
          flexWrap: 'wrap',
          width: '100%',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of complaints and key metrics
          </Typography>
        </Box>
        {dashboardLogo}
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
        {/* KPI row: isolated grid so cards don’t mix with chart columns */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {kpiCards.map((kpi) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={kpi.label}>
                <Paper
                  sx={{
                    p: 1.5,
                    borderLeft: 3,
                    borderColor: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 72,
                    height: '100%',
                  }}
                >
                  <Box sx={{ minWidth: 0, pr: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" noWrap title={kpi.label}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} component="span">
                      {kpi.chip && kpi.chip !== 'none' ? (
                        <Chip
                          label={kpi.value}
                          color={kpi.chip === 'default' ? 'default' : kpi.chip}
                          size="small"
                          sx={{ height: 22, fontSize: '0.75rem' }}
                        />
                      ) : (
                        kpi.value
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ color: kpi.color, opacity: 0.85, flexShrink: 0, '& .MuiSvgIcon-root': { fontSize: 28 } }}>{kpi.icon}</Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Charts: first row — three equal widgets on lg (activity + donut + 7-day bar) */}
        {summary.activitySummary && (
          <Grid item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 3, height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Activity Summary (Last 7 Days)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Recent complaints and project updates
              </Typography>
              <Grid container spacing={2} sx={{ flex: 1, alignContent: 'center' }}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {summary.activitySummary.complaintsLast7Days}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New complaints
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h4" fontWeight={700} color="secondary">
                      {summary.activitySummary.projectsUpdatedLast7Days}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects updated
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md={6} lg={summary.activitySummary ? 4 : 6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Track distribution by status
            </Typography>
            <Box sx={{ flex: 1, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <Grid item xs={12} md={6} lg={summary.activitySummary ? 4 : 6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints Created (Last 7 Days)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              New complaints per day
            </Typography>
            <Box sx={{ flex: 1, minHeight: 240, mt: 0.5 }}>
              <Bar data={creationChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Bottom row: region + project — equal half width on md+ */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 360, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Region
            </Typography>
            <Box sx={{ flex: 1, minHeight: 280, mt: 1 }}>
              <Bar data={regionChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', minHeight: 360, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Complaints by Project
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {isEmployee
                ? 'Complaints linked to your assigned projects (and legacy client complaints in scope)'
                : 'Complaints with a linked project, plus unlinked complaints from project clients'}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 260, mt: 1 }}>
              <Bar data={projectComplaintChart} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
