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
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['dashboard-product'],
    queryFn: async () => (await dashboardApi.productStats()).data,
  });

  const regionStats = regionData?.stats || [];
  const productStats = productData?.stats || [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Region-wise and product-wise complaint analytics
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
                Product-wise Issues
              </Typography>
            </Box>
            {productLoading ? (
              <Skeleton variant="rectangular" height={320} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productStats.length === 0 ? (
                      <TableRow><TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>No data</TableCell></TableRow>
                    ) : (
                      productStats.map((row) => (
                        <TableRow key={row.product} hover>
                          <TableCell>{row.product}</TableCell>
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
