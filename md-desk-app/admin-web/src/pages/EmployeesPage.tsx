import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
  IconButton,
  Skeleton,
  Alert,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { employeesApi, type EmployeeDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';

export default function EmployeesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page + 1, rowsPerPage, search],
    queryFn: async () =>
      (await employeesApi.list({ page: page + 1, limit: rowsPerPage, search: search || undefined })).data,
  });
  const items = (data?.items || []) as EmployeeDto[];
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: () =>
      employeesApi.create({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        designation: designation.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      resetAndClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: () =>
      editing
        ? employeesApi.update(editing.id, {
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            designation: designation.trim() || undefined,
          })
        : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      resetAndClose();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const resetAndClose = () => {
    setOpen(false);
    setEditing(null);
    setName('');
    setEmail('');
    setMobile('');
    setDesignation('');
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setMobile('');
    setDesignation('');
    setOpen(true);
  };

  const handleOpenEdit = (e: EmployeeDto) => {
    setEditing(e);
    setName(e.name);
    setEmail(e.email);
    setMobile(e.mobile);
    setDesignation(e.designation || '');
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const error = createMutation.error || updateMutation.error;
  const errorMessage = error ? getBackendErrorMessage(error) : '';

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Employee Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Add and manage employees. An email is sent when a new employee is added.
      </Typography>

      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, email, mobile, designation…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add employee
        </Button>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
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
              : items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell>{row.designation || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => window.confirm('Delete this employee?') && deleteMutation.mutate(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
        />
      </TableContainer>

      <Dialog open={open} onClose={resetAndClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required fullWidth />
            <TextField label="Designation (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)} fullWidth />
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={resetAndClose}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={!name.trim() || !email.trim() || !mobile.trim() || createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Add'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
