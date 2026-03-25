import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { complaintsApi } from '../api/endpoints';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  RECEIVED: 'info',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-complaints', page + 1, limit, status, fromDate, toDate],
    queryFn: async () =>
      (await complaintsApi.myList({
        page: page + 1,
        limit,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })).data,
  });

  const items = (data?.items || []) as Array<{
    id: string;
    complaintId: string;
    status: string;
    priority: string;
    category?: string;
    description: string;
    createdAt: string;
  }>;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Complaints
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your complaints and raise a new one.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/raise-complaint"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ flexShrink: 0 }}
        >
          New complaint
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
            <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="From date"
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <Button variant="text" onClick={() => { setStatus(''); setFromDate(''); setToDate(''); setPage(0); }}>
          Clear filters
        </Button>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Complaint ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton height={48} /></TableCell>
                  </TableRow>
                ))
              : items.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No complaints yet.</Typography>
                      <Button component={Link} to="/raise-complaint" variant="outlined" sx={{ mt: 2 }}>
                        Raise a complaint
                      </Button>
                    </TableCell>
                  </TableRow>
                )
                : items.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{row.complaintId}</TableCell>
                      <TableCell>{row.category || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status.replace('_', ' ')}
                          color={statusColors[row.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/track?complaintId=${encodeURIComponent(row.complaintId)}`)}
                        >
                          Track
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
        {totalPages > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={total}
            rowsPerPage={limit}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
          />
        )}
      </TableContainer>
    </Box>
  );
}
