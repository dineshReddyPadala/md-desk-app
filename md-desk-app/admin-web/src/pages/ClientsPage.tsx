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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { clientsApi, type ClientDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { validateFilesMaxSize } from '../constants/uploadAccept';
import { downloadBlob } from '../utils/downloadBlob';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-() ]{7,20}$/;

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDto | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page + 1, rowsPerPage, search, companyFilter, fromDate, toDate],
    queryFn: async () => (await clientsApi.list({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
      company: companyFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })).data,
  });
  const clients = (data?.clients || []) as ClientDto[];
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: () =>
      clientsApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim(),
        company: company.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      resetAndClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: () =>
      editing
        ? clientsApi.update(editing.id, {
            name: name.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            company: company.trim() || undefined,
          })
        : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      resetAndClose();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
  const bulkUploadMutation = useMutation({
    mutationFn: (file: File) => clientsApi.bulkUpload(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setBulkFile(null);
      setBulkError(null);
      const msg = res.data.errors?.length
        ? `Created ${res.data.created}. Some rows had errors: ${res.data.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join('; ')}`
        : `Created ${res.data.created} client(s).`;
      alert(msg);
    },
    onError: (err: unknown) => setBulkError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bulk upload failed'),
  });

  const resetAndClose = () => {
    setOpen(false);
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
  };

  const handleOpenEdit = (c: ClientDto) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setCompany(c.company || '');
    setOpen(true);
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setOpen(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await clientsApi.downloadTemplate();
      downloadBlob(res.data, 'clients_template.xlsx');
    } catch {
      setBulkError('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const res = await clientsApi.export({
        search: search || undefined,
        company: companyFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      downloadBlob(res.data, 'clients_export.xlsx');
    } catch {
      setBulkError('Failed to export clients');
    }
  };

  const doSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  const emailError = trimmedEmail ? !emailPattern.test(trimmedEmail) : false;
  const phoneError = trimmedPhone ? !phonePattern.test(trimmedPhone) : false;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Client Management</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add client</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Export Excel</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>Download template</Button>
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
        </Box>
      </Box>
      {bulkError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBulkError(null)}>{bulkError}</Alert>}
      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
        />
        <TextField
          size="small"
          label="Company"
          value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 180 }}
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
        <Button onClick={() => { setSearch(''); setCompanyFilter(''); setFromDate(''); setToDate(''); setPage(0); }}>
          Clear filters
        </Button>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated At</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><Skeleton height={56} /></TableCell></TableRow>
                ))
              : clients.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.phone || '—'}</TableCell>
                    <TableCell>{c.email || '—'}</TableCell>
                    <TableCell>{c.company || '—'}</TableCell>
                    <TableCell>{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(c.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(c)}><EditIcon /></IconButton>
                      <IconButton size="small" color="error" onClick={() => window.confirm('Delete this client?') && deleteMutation.mutate(c.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          showFirstButton
          showLastButton
        />
      </TableContainer>

      <Dialog open={open} onClose={resetAndClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>{editing ? 'Edit Client' : 'Add Client'}</DialogTitle>
        <DialogContent>
          <form onSubmit={doSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={phoneError}
              helperText={phoneError ? 'Enter a valid phone number.' : 'Optional'}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              helperText={emailError ? 'Enter a valid email address.' : undefined}
              required
            />
            <TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            {mutationError && (
              <Alert severity="error">{getBackendErrorMessage(mutationError)}</Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={resetAndClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending || updateMutation.isPending || !name.trim() || !trimmedEmail || emailError || phoneError}
              >
                {editing ? 'Update' : 'Create'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
