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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { dealersApi, uploadApi, type DealerDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { useStaffRole } from '../hooks/useStaffRole';
import { ACCEPT_IMAGES_ONLY, validateFilesImageOnly, validateFilesMaxSize } from '../constants/uploadAccept';
import { downloadBlob } from '../utils/downloadBlob';

export default function DealersPage() {
  const { canMutate } = useStaffRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealerDto | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileError, setImageFileError] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dealers', search, cityFilter],
    queryFn: async () => (await dealersApi.list({ search: search || undefined, city: cityFilter || undefined })).data,
  });
  const dealers = (data?.dealers || []) as DealerDto[];

  const createMutation = useMutation({
    mutationFn: (overrides?: { imageUrl?: string }) =>
      dealersApi.create({ name, city: city || undefined, phone: phone || undefined, imageUrl: (overrides?.imageUrl ?? imageUrl) || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      resetAndClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (overrides?: { imageUrl?: string }) =>
      editing ? dealersApi.update(editing.id, { name, city: city || undefined, phone: phone || undefined, imageUrl: (overrides?.imageUrl ?? imageUrl) || undefined }) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      resetAndClose();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dealers'] }),
  });
  const bulkUploadMutation = useMutation({
    mutationFn: (file: File) => dealersApi.bulkUpload(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      setBulkFile(null);
      setBulkError(null);
      const msg = res.data.errors?.length
        ? `Created ${res.data.created}. Some rows had errors: ${res.data.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`).join('; ')}`
        : `Created ${res.data.created} dealer(s).`;
      alert(msg);
    },
    onError: (err: unknown) => setBulkError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bulk upload failed'),
  });

  const handleDownloadTemplate = async () => {
    try {
      const res = await dealersApi.downloadTemplate();
      downloadBlob(res.data, 'dealers_template.xlsx');
    } catch {
      setBulkError('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const res = await dealersApi.export({ search: search || undefined, city: cityFilter || undefined });
      downloadBlob(res.data, 'dealers_export.xlsx');
    } catch {
      setBulkError('Failed to export dealers');
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setEditing(null);
    setName('');
    setCity('');
    setPhone('');
    setImageUrl('');
    setImageFile(null);
    setImageFileError(null);
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setCity('');
    setPhone('');
    setImageUrl('');
    setImageFile(null);
    setImageFileError(null);
    setOpen(true);
  };

  const handleOpenEdit = (d: DealerDto) => {
    setEditing(d);
    setName(d.name);
    setCity(d.city || '');
    setPhone(d.phone || '');
    setImageUrl(d.imageUrl || '');
    setImageFile(null);
    setImageFileError(null);
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFilesImageOnly([file]);
    setImageFileError(err);
    if (err) {
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImageUrl('');
  };

  const doSubmit = async () => {
    let url = imageUrl;
    if (imageFile) {
      try {
        const res = await uploadApi.upload(imageFile, { scope: 'image' });
        url = res.data.file_url;
      } catch (err: unknown) {
        setImageFileError(getBackendErrorMessage(err));
        return;
      }
    }
    if (editing) {
      updateMutation.mutate({ imageUrl: url || undefined });
    } else {
      createMutation.mutate({ imageUrl: url || undefined });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Dealers</Typography>
        {canMutate && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Export Excel</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>Download template</Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              Bulk upload (Excel)
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Dealer</Button>
          </Box>
        )}
      </Box>
      {bulkError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBulkError(null)}>{bulkError}</Alert>}
      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, city, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
        />
        <TextField
          size="small"
          label="City"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <Button onClick={() => { setSearch(''); setCityFilter(''); }}>
          Clear filters
        </Button>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              {canMutate && <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={canMutate ? 5 : 4}><Skeleton height={56} /></TableCell></TableRow>
                ))
              : dealers.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      {d.imageUrl ? (
                        <Box component="img" src={d.imageUrl} alt="" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }} />
                      ) : (
                        <Box sx={{ width: 48, height: 48, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon sx={{ color: 'grey.500' }} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.city || '—'}</TableCell>
                    <TableCell>{d.phone || '—'}</TableCell>
                    {canMutate && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenEdit(d)}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => window.confirm('Delete this dealer?') && deleteMutation.mutate(d.id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={canMutate && open} onClose={resetAndClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>{editing ? 'Edit Dealer' : 'Add Dealer'}</DialogTitle>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}
          >
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>Image (optional) — JPEG, PNG, GIF, WebP, SVG only</Typography>
              <Button component="label" variant="outlined" size="small" sx={{ mr: 2 }}>
                {imageFile ? imageFile.name : 'Choose image'}
                <input type="file" accept={ACCEPT_IMAGES_ONLY} hidden onChange={handleImageChange} />
              </Button>
              {imageUrl && !imageFile && <Typography variant="caption" display="block" sx={{ mt: 1 }}>Current image set</Typography>}
              {!imageUrl && !imageFile && <Typography variant="caption" display="block" sx={{ mt: 1 }}>No image — placeholder will be shown in list</Typography>}
              {imageFileError && <Alert severity="error" sx={{ mt: 1 }}>{imageFileError}</Alert>}
            </Box>
            {(createMutation.isError || updateMutation.isError) && (
              <Alert severity="error">
                {getBackendErrorMessage(createMutation.error || updateMutation.error)}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={resetAndClose}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
