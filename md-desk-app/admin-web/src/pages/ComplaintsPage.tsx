import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  Button,
  InputLabel,
  FormControl,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { complaintsApi } from '../api/endpoints';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  RECEIVED: 'info',
  UNDER_REVIEW: 'primary',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};
const priorityColors: Record<string, 'error' | 'warning' | 'default'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'default',
};

export default function ComplaintsPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-complaints', page, limit, status, priority, city],
    queryFn: async () =>
      (await complaintsApi.list({ page: page + 1, limit, status: status || undefined, priority: priority || undefined, city: city || undefined })).data,
  });

  const items = (data?.items || []) as Array<{
    id: string;
    complaintId: string;
    status: string;
    priority: string;
    category?: string;
    description: string;
    user?: { name: string; email: string };
    project?: { id: string; name: string } | null;
    createdAt: string;
  }>;

  const { data: detailData } = useQuery({
    queryKey: ['complaint', detailId],
    queryFn: async () => (await complaintsApi.getById(detailId!)).data,
    enabled: !!detailId,
  });
  const complaint = detailData?.complaint as { complaintId: string; status: string; priority: string; category?: string; description: string; projectLocation: string; user?: { name: string; email: string } } | undefined;
  const filteredItems = search.trim()
    ? items.filter(
        (row) =>
          row.complaintId.toLowerCase().includes(search.toLowerCase()) ||
          (row.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (row.user?.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Complaints</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Search, filter, and manage all customer complaints</Typography>
      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
        />
        <TextField size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} sx={{ minWidth: 120 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
            <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Complaint ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton height={48} /></TableCell></TableRow>
                ))
              : filteredItems.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{row.complaintId}</TableCell>
                    <TableCell>{row.user?.name || '—'}<Typography variant="caption" display="block" color="text.secondary">{row.user?.email}</Typography></TableCell>
                    <TableCell>{row.project?.name || '—'}</TableCell>
                    <TableCell>{row.category || '—'}</TableCell>
                    <TableCell><Chip label={row.priority} color={priorityColors[row.priority] || 'default'} size="small" /></TableCell>
                    <TableCell><Chip label={row.status.replace('_', ' ')} color={statusColors[row.status] || 'default'} size="small" /></TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setDetailId(row.id)} sx={{ mr: 1 }}>Quick view</Button>
                      <Button size="small" variant="contained" onClick={() => navigate(`/complaints/${row.id}`)}>Open</Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={search ? filteredItems.length : (data?.total ?? 0)}
          rowsPerPage={limit}
          page={search ? 0 : page}
          onPageChange={(_, p) => !search && setPage(p)}
          onRowsPerPageChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
        />
      </TableContainer>

      <Dialog open={!!detailId} onClose={() => setDetailId(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Complaint details</DialogTitle>
        <DialogContent>
          {complaint ? (
            <Box sx={{ pt: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">ID</Typography>
              <Typography variant="body1" fontFamily="monospace" gutterBottom>{complaint.complaintId}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
              <Typography variant="body1" gutterBottom>{complaint.user?.name} · {complaint.user?.email}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Category · Location</Typography>
              <Typography variant="body1" gutterBottom>{complaint.category ? `${complaint.category} · ` : ''}{complaint.projectLocation}</Typography>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{complaint.description}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={complaint.priority} color={priorityColors[complaint.priority] || 'default'} size="small" />
                <Chip label={complaint.status.replace('_', ' ')} color={statusColors[complaint.status] || 'default'} size="small" />
              </Box>
              <Button fullWidth variant="contained" onClick={() => { setDetailId(null); navigate(`/complaints/${detailId}`); }}>Open full details & update status</Button>
            </Box>
          ) : (
            <Skeleton variant="rectangular" height={200} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
