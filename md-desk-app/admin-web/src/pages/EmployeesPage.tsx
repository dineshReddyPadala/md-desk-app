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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { employeesApi, type EmployeeDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { validateFilesMaxSize } from '../constants/uploadAccept';
import { downloadBlob } from '../utils/downloadBlob';

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function EmployeesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page + 1, rowsPerPage, search, fromDate, toDate],
    queryFn: async () =>
      (await employeesApi.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      })).data,
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
  const bulkUploadMutation = useMutation({
    mutationFn: (file: File) => employeesApi.bulkUpload(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setBulkFile(null);
      setBulkError(null);
      const msg = res.data.errors?.length
        ? `Created ${res.data.created}. Some rows had errors: ${res.data.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join('; ')}`
        : `Created ${res.data.created} employee(s).`;
      alert(msg);
    },
    onError: (err: unknown) => setBulkError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bulk upload failed'),
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

  const handleDownloadTemplate = async () => {
    try {
      const res = await employeesApi.downloadTemplate();
      downloadBlob(res.data, 'employees_template.xlsx');
    } catch {
      setBulkError('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const res = await employeesApi.export({
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      downloadBlob(res.data, 'employees_export.xlsx');
    } catch {
      setBulkError('Failed to export employees');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Employee Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add and manage employees. An email is sent when a new employee is added.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="text" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setPage(0); }}>
            Clear filters
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
            Download template
          </Button>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
            Excel upload
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const sz = validateFilesMaxSize([f]);
                if (sz) {
                  setBulkError(sz);
                  e.target.value = '';
                  return;
                }
                setBulkError(null);
                setBulkFile(f);
              }}
            />
          </Button>
          {bulkFile && (
            <Button variant="contained" onClick={() => bulkUploadMutation.mutate(bulkFile)} disabled={bulkUploadMutation.isPending}>
              Upload {bulkFile.name}
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add employee
          </Button>
        </Box>
      </Box>
      {bulkError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBulkError(null)}>{bulkError}</Alert>}
      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, email, mobile, designation..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 280, flex: '1 1 280px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
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
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated At</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton height={48} /></TableCell>
                  </TableRow>
                ))
              : items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell>{row.designation || '—'}</TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
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
