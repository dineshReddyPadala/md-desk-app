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
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import {
  projectsApi,
  clientsApi,
  uploadApi,
  employeesApi,
  type ProjectDto,
  type ClientDto,
  type EmployeeDto,
} from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { useStaffRole } from '../hooks/useStaffRole';
import { ACCEPT_FULL_MEDIA, validateFilesFullMedia, validateFilesMaxSize } from '../constants/uploadAccept';
import { downloadBlob } from '../utils/downloadBlob';

const STATUS_OPTIONS: { value: ProjectDto['status']; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

function parseProjectDocumentUrls(documentUrl?: string | null) {
  return String(documentUrl || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinProjectDocumentUrls(urls: string[]) {
  return urls.map((item) => item.trim()).filter(Boolean).join('\n');
}

export default function ProjectsPage() {
  const { canMutate } = useStaffRole();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [clientId, setClientId] = useState('');
  const [filterClientId, setFilterClientId] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ProjectDto['status']>('PENDING');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState<ProjectDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectDto['status']>('PENDING');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [editDocumentFiles, setEditDocumentFiles] = useState<File[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', page + 1, rowsPerPage, filterStatus, filterClientId, filterFromDate, filterToDate],
    queryFn: async () => (await projectsApi.list({
      page: page + 1,
      limit: rowsPerPage,
      status: filterStatus || undefined,
      clientId: filterClientId || undefined,
      fromDate: filterFromDate || undefined,
      toDate: filterToDate || undefined,
    })).data,
  });
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 1, 500],
    queryFn: async () => (await clientsApi.list({ page: 1, limit: 500 })).data,
    enabled: canMutate,
  });
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 300],
    queryFn: async () => (await employeesApi.list({ page: 1, limit: 300 })).data,
    enabled: canMutate,
  });
  const projects = (projectsData?.projects || []) as ProjectDto[];
  const clients = (clientsData?.clients || []) as ClientDto[];
  const employees = (employeesData?.items || []) as EmployeeDto[];
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
        assigneeIds: assigneeIds.length ? assigneeIds : undefined,
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
  const updateProjectMutation = useMutation({
    mutationFn: async (opts: { documentUrl?: string }) => {
      if (!editDialog) throw new Error('No project');
      return projectsApi.update(editDialog.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        startDate: editStartDate || undefined,
        endDate: editEndDate || undefined,
        clientId: editClientId || undefined,
        status: editStatus,
        assigneeIds: editAssigneeIds,
        ...(opts.documentUrl != null ? { documentUrl: opts.documentUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditDialog(null);
      setEditDocumentFiles([]);
      setEditError(null);
    },
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
      downloadBlob(res.data, 'projects_template.xlsx');
    } catch {
      setBulkError('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const res = await projectsApi.export({
        status: filterStatus || undefined,
        clientId: filterClientId || undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      });
      downloadBlob(res.data, 'projects_export.xlsx');
    } catch {
      setBulkError('Failed to export projects');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setDocumentFiles([]);
    setClientId('');
    setAssigneeIds([]);
    setStatus('PENDING');
    setFormError(null);
    setShowForm(false);
  };

  const openEditDialog = (p: ProjectDto) => {
    setEditDialog(p);
    setEditName(p.name);
    setEditDescription(p.description ?? '');
    setEditStartDate(p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '');
    setEditEndDate(p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '');
    setEditClientId(p.clientId ?? '');
    setEditStatus(p.status);
    setEditAssigneeIds(p.assignees?.map((a) => a.employee.id) ?? []);
    setEditDocumentFiles([]);
    setEditError(null);
  };

  const handleSaveEditProject = async () => {
    setEditError(null);
    if (!editName.trim()) {
      setEditError('Project name is required');
      return;
    }
    let documentUrl: string | undefined;
    if (editDocumentFiles.length) {
      try {
        const res = await uploadApi.uploadMultiple(editDocumentFiles, { scope: 'media' });
        documentUrl = joinProjectDocumentUrls(res.data.files.map((file) => file.file_url));
      } catch {
        setEditError('File upload failed');
        return;
      }
    }
    updateProjectMutation.mutate({ documentUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let documentUrl: string | undefined;
    if (documentFiles.length) {
      try {
        const res = await uploadApi.uploadMultiple(documentFiles, { scope: 'media' });
        documentUrl = joinProjectDocumentUrls(res.data.files.map((file) => file.file_url));
      } catch {
        setFormError('File upload failed');
        return;
      }
    }
    createMutation.mutate({ documentUrl });
  };

  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const employeeOptionsSelected = (ids: string[]) => employees.filter((e) => ids.includes(e.id));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Project Management</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {canMutate && (
            <>
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
            <Button variant="contained" startIcon={showForm ? <ExpandLessIcon /> : <AddIcon />} onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide form' : 'Create project'}
            </Button>
            </>
          )}
        </Box>
      </Box>
      {bulkError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBulkError(null)}>{bulkError}</Alert>}
      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {canMutate && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Client</InputLabel>
            <Select value={filterClientId} label="Client" onChange={(e) => { setFilterClientId(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          size="small"
          label="From date"
          type="date"
          value={filterFromDate}
          onChange={(e) => { setFilterFromDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={filterToDate}
          onChange={(e) => { setFilterToDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <Button onClick={() => { setFilterStatus(''); setFilterClientId(''); setFilterFromDate(''); setFilterToDate(''); setPage(0); }}>
          Clear filters
        </Button>
      </Paper>

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
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(e) => `${e.name} (${e.email})`}
              value={employeeOptionsSelected(assigneeIds)}
              onChange={(_, v) => setAssigneeIds(v.map((x) => x.id))}
              renderInput={(params) => <TextField {...params} label="Assign employees (dashboard & complaints)" placeholder="Search" />}
              disableCloseOnSelect
            />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Files / Documents (optional) — PDF, Office, images, video, audio, ZIP
              </Typography>
              <Button component="label" variant="outlined" size="small" startIcon={<UploadFileIcon />}>
                {documentFiles.length ? `${documentFiles.length} file(s) selected` : 'Choose files'}
                <input
                  type="file"
                  accept={ACCEPT_FULL_MEDIA}
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) {
                      const err = validateFilesFullMedia(files);
                      if (err) {
                        setFormError(err);
                        e.target.value = '';
                        setDocumentFiles([]);
                        return;
                      }
                    }
                    setFormError(null);
                    setDocumentFiles(files);
                  }}
                />
              </Button>
              {!!documentFiles.length && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {documentFiles.map((file) => file.name).join(', ')}
                </Typography>
              )}
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

      <Dialog open={!!editDialog} onClose={() => !updateProjectMutation.isPending && setEditDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit project{editDialog ? ` — ${editDialog.name}` : ''}</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth label="Project name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <TextField fullWidth label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} multiline rows={2} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField type="date" label="Start date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
            <TextField type="date" label="End date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Client</InputLabel>
            <Select value={editClientId} label="Client" onChange={(e) => setEditClientId(e.target.value)}>
              <MenuItem value="">— None —</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value as ProjectDto['status'])}>
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            options={employees}
            getOptionLabel={(e) => `${e.name} (${e.email})`}
            value={employeeOptionsSelected(editAssigneeIds)}
            onChange={(_, v) => setEditAssigneeIds(v.map((x) => x.id))}
            renderInput={(params) => <TextField {...params} label="Assigned employees" placeholder="Search" />}
            disableCloseOnSelect
          />
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>Documents</Typography>
            {!editDocumentFiles.length && parseProjectDocumentUrls(editDialog?.documentUrl).length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {parseProjectDocumentUrls(editDialog?.documentUrl).map((url, index) => (
                  <Button key={url} size="small" href={url} target="_blank" rel="noopener noreferrer">
                    {`Current file ${index + 1}`}
                  </Button>
                ))}
              </Box>
            )}
            <Button component="label" variant="outlined" size="small" startIcon={<UploadFileIcon />}>
              {editDocumentFiles.length ? `Replace with ${editDocumentFiles.length} file(s)` : 'Replace documents'}
              <input
                type="file"
                accept={ACCEPT_FULL_MEDIA}
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) {
                    const err = validateFilesFullMedia(files);
                    if (err) {
                      setEditError(err);
                      e.target.value = '';
                      setEditDocumentFiles([]);
                      return;
                    }
                  }
                  setEditError(null);
                  setEditDocumentFiles(files);
                }}
              />
            </Button>
            {!!editDocumentFiles.length && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {editDocumentFiles.map((file) => file.name).join(', ')}
              </Typography>
            )}
          </Box>
          {(editError || updateProjectMutation.isError) && (
            <Alert severity="error">{editError || getBackendErrorMessage(updateProjectMutation.error)}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)} disabled={updateProjectMutation.isPending}>Cancel</Button>
          <Button variant="contained" disabled={updateProjectMutation.isPending || !editName.trim()} onClick={() => void handleSaveEditProject()}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start / End</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Team</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
              {canMutate && <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={canMutate ? 8 : 7}><Skeleton height={56} /></TableCell></TableRow>
                ))
              : projects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{p.description ? (p.description.length > 60 ? p.description.slice(0, 60) + '…' : p.description) : '—'}</TableCell>
                    <TableCell>{formatDate(p.startDate)} / {formatDate(p.endDate)}</TableCell>
                    <TableCell>{p.client?.name || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      {p.assignees?.length
                        ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {p.assignees.slice(0, 3).map((a) => (
                              <Chip key={a.employee.id} label={a.employee.name} size="small" variant="outlined" />
                            ))}
                            {p.assignees.length > 3 && <Chip label={`+${p.assignees.length - 3}`} size="small" />}
                          </Box>
                          )
                        : '—'}
                    </TableCell>
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
                      {parseProjectDocumentUrls(p.documentUrl).length ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {parseProjectDocumentUrls(p.documentUrl).slice(0, 2).map((url, index) => (
                            <Button key={url} size="small" href={url} target="_blank" rel="noopener noreferrer">
                              {`View ${index + 1}`}
                            </Button>
                          ))}
                          {parseProjectDocumentUrls(p.documentUrl).length > 2 && (
                            <Chip label={`+${parseProjectDocumentUrls(p.documentUrl).length - 2} more`} size="small" />
                          )}
                        </Box>
                      ) : '—'}
                    </TableCell>
                    {canMutate && (
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                          <IconButton size="small" color="primary" onClick={() => openEditDialog(p)} title="Edit project">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => window.confirm('Delete this project?') && deleteMutation.mutate(p.id)}><DeleteIcon /></IconButton>
                        </Box>
                      </TableCell>
                    )}
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
