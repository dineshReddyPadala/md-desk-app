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
import { productsApi, uploadApi, type ProductDto } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { useStaffRole } from '../hooks/useStaffRole';

export default function ProductsPage() {
  const { canMutate } = useStaffRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await productsApi.list()).data,
  });
  const products = (data?.products || []) as ProductDto[];

  const createMutation = useMutation({
    mutationFn: (overrides?: { imageUrl?: string }) =>
      productsApi.create({ name, description: description || undefined, imageUrl: (overrides?.imageUrl ?? imageUrl) || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetAndClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (overrides?: { imageUrl?: string }) =>
      editing ? productsApi.update(editing.id, { name, description: description || undefined, imageUrl: (overrides?.imageUrl ?? imageUrl) || undefined }) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetAndClose();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const resetAndClose = () => {
    setOpen(false);
    setEditing(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setOpen(true);
  };

  const handleOpenEdit = (p: ProductDto) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setImageFile(null);
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl('');
  };

  const doSubmit = async () => {
    let url = imageUrl;
    if (imageFile) {
      try {
        const res = await uploadApi.upload(imageFile);
        url = res.data.file_url;
      } catch {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Products</Typography>
        {canMutate && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Product</Button>}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              {canMutate && <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={canMutate ? 4 : 3}><Skeleton height={56} /></TableCell></TableRow>
                ))
              : products.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      {p.imageUrl ? (
                        <Box component="img" src={p.imageUrl} alt="" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }} />
                      ) : (
                        <Box sx={{ width: 48, height: 48, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon sx={{ color: 'grey.500' }} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.description || '—'}</TableCell>
                    {canMutate && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenEdit(p)}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => window.confirm('Delete this product?') && deleteMutation.mutate(p.id)}><DeleteIcon /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={canMutate && open} onClose={resetAndClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}
          >
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={2} />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>Image (optional)</Typography>
              <Button component="label" variant="outlined" size="small" sx={{ mr: 2 }}>
                {imageFile ? imageFile.name : 'Choose image'}
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </Button>
              {imageUrl && !imageFile && <Typography variant="caption" display="block" sx={{ mt: 1 }}>Current image set</Typography>}
              {!imageUrl && !imageFile && <Typography variant="caption" display="block" sx={{ mt: 1 }}>No image — placeholder will be shown in list</Typography>}
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
