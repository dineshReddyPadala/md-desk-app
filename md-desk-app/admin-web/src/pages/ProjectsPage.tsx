import React, { useState } from 'react';
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
  TextField,
  Typography,
  IconButton,
  Skeleton,
  Alert,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { projectsApi, clientsApi, uploadApi, type ProjectDto, type ClientDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { useStaffRole } from '../hooks/useStaffRole';

const STATUS_OPTIONS: { value: ProjectDto['status']; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ProjectsPage() {
  const { canMutate } = useStaffRole();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<ProjectDto['status']>('PENDING');
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', page + 1, rowsPerPage],
    queryFn: async () => (await projectsApi.list({ page: page + 1, limit: rowsPerPage })).data,
  });
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 1, 500],
    queryFn: async () => (await clientsApi.list({ page: 1, limit: 500 })).data,
    enabled: canMutate,
  });
  const projects = (projectsData?.projects || []) as ProjectDto[];
  const clients = (clientsData?.clients || []) as ClientDto[];
  const totalProjects = projectsData?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: async (overrides?: { documentUrl?: string }) => {
      return projectsApi.create({
        name: name.trim(),
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        documentUrl: overrides?.documentUrl,
        status,
        clientId: clientId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: ProjectDto['status'] }) => projectsApi.updateStatus(id, s),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
  const bulkUploadMutation = useMutation({
    mutationFn: (file: File) => projectsApi.bulkUpload(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setBulkFile(null);
      setBulkError(null);
      const msg = res.data.errors?.length
        ? `Created ${res.data.created}. Some rows had errors: ${res.data.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join('; ')}`
        : `Created ${res.data.created} project(s).`;
      alert(msg);
    },
    onError: (err: unknown) => setBulkError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bulk upload failed'),
  });

  const handleDownloadTemplate = async () => {
    try {
      const res = await projectsApi.downloadTemplate();
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projects_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setBulkError('Failed to download template');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setDocumentFile(null);
    setClientId('');
    setStatus('PENDING');
    setFormError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let documentUrl: string | undefined;
    if (documentFile) {
      try {
        const res = await uploadApi.upload(documentFile);
        documentUrl = res.data.file_url;
      } catch {
        setFormError('File upload failed');
        return;
      }
    }
    createMutation.mutate({ documentUrl });
  };

  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Project Management</Typography>
        {canMutate && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>Download template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              Excel upload
              <input type="file" accept=".xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBulkError(null); setBulkFile(f); } }} />
            </Button>
            {bulkFile && (
              <Button variant="contained" onClick={() => bulkUploadMutation.mutate(bulkFile)} disabled={bulkUploadMutation.isPending}>
                Upload {bulkFile.name}
              </Button>
            )}
            <Button variant="contained" startIcon={showForm ? <ExpandLessIcon /> : <AddIcon />} onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide form' : 'Create project'}
            </Button>
          </Box>
        )}
      </Box>
      {bulkError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBulkError(null)}>{bulkError}</Alert>}

      <Collapse in={canMutate && showForm}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Create project (form below)</Typography>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField fullWidth label="Project Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={2} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
              <TextField type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Assign client</InputLabel>
              <Select value={clientId} label="Assign client" onChange={(e) => setClientId(e.target.value)}>
                <MenuItem value="">— None —</MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>File / Document upload (optional)</Typography>
              <Button component="label" variant="outlined" size="small" startIcon={<UploadFileIcon />}>
                {documentFile ? documentFile.name : 'Choose file'}
                <input type="file" hidden onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as ProjectDto['status'])}>
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(formError || createMutation.isError) && (
              <Alert severity="error">{formError || getBackendErrorMessage(createMutation.error)}</Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button type="button" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createMutation.isPending || !name.trim()}>
                Create project
              </Button>
            </Box>
          </form>
        </Paper>
      </Collapse>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start / End</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><Skeleton height={56} /></TableCell></TableRow>
                ))
              : projects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{p.description ? (p.description.length > 60 ? p.description.slice(0, 60) + '…' : p.description) : '—'}</TableCell>
                    <TableCell>{formatDate(p.startDate)} / {formatDate(p.endDate)}</TableCell>
                    <TableCell>{p.client?.name || '—'}</TableCell>
                    <TableCell>
                      {canMutate ? (
                        <Select
                          size="small"
                          value={p.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: p.id, status: e.target.value as ProjectDto['status'] })}
                          sx={{ minWidth: 140 }}
                          disabled={updateStatusMutation.isPending}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip label={p.status.replace('_', ' ')} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {p.documentUrl ? (
                        <Button size="small" href={p.documentUrl} target="_blank" rel="noopener noreferrer">View</Button>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {canMutate && (
                        <IconButton size="small" color="error" onClick={() => window.confirm('Delete this project?') && deleteMutation.mutate(p.id)}><DeleteIcon /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalProjects}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          showFirstButton
          showLastButton
        />
      </TableContainer>
    </Box>
  );
}
