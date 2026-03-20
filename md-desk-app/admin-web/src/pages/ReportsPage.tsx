import { useQuery } from '@tanstack/react-query';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Skeleton } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import CategoryIcon from '@mui/icons-material/Category';
import { dashboardApi } from '../api/endpoints';

export default function ReportsPage() {
  const { data: regionData, isLoading: regionLoading } = useQuery({
    queryKey: ['dashboard-region'],
    queryFn: async () => (await dashboardApi.regionStats()).data,
  });
  const { data: projectComplaintData, isLoading: projectComplaintLoading } = useQuery({
    queryKey: ['dashboard-project-complaints'],
    queryFn: async () => (await dashboardApi.projectComplaintStats()).data,
  });

  const regionStats = regionData?.stats || [];
  const projectComplaintStats = projectComplaintData?.stats || [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Region-wise and project-linked complaint analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PublicIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Region-wise Complaints
              </Typography>
            </Box>
            {regionLoading ? (
              <Skeleton variant="rectangular" height={320} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regionStats.length === 0 ? (
                      <TableRow><TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>No data</TableCell></TableRow>
                    ) : (
                      regionStats.map((row) => (
                        <TableRow key={row.city} hover>
                          <TableCell>{row.city}</TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CategoryIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Complaints by project (client)
              </Typography>
            </Box>
            {projectComplaintLoading ? (
              <Skeleton variant="rectangular" height={320} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Complaints</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectComplaintStats.length === 0 ? (
                      <TableRow><TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>No data</TableCell></TableRow>
                    ) : (
                      projectComplaintStats.map((row) => (
                        <TableRow key={row.projectId} hover>
                          <TableCell>{row.project}</TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
