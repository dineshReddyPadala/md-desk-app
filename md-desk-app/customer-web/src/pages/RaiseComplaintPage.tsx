import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Alert,
  FormHelperText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { complaintsApi } from '../api/endpoints';

export default function RaiseComplaintPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('PRODUCT');
  const [files, setFiles] = useState<File[]>([]);
  const [successId, setSuccessId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('name', name);
      form.append('phone', phone);
      form.append('city', city);
      form.append('project_location', projectLocation);
      form.append('description', description);
      form.append('category', category);
      files.forEach((f) => form.append('photos', f));
      return complaintsApi.create(form);
    },
    onSuccess: (res) => {
      setSuccessId(res.data.complaint_id);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  if (successId) {
    return (
      <Paper sx={{ p: 4, maxWidth: 500, borderRadius: 2 }} elevation={0} variant="outlined">
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>Complaint submitted</Typography>
          <Typography sx={{ mt: 2 }}>Your complaint ID: <strong>{successId}</strong></Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Use this ID to track your complaint.</Typography>
          <Button variant="contained" size="large" sx={{ mt: 3 }} onClick={() => { setSuccessId(null); navigate('/track'); }}>
            Track Complaint
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Raise Complaint</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Submit product or service issues. You will receive a unique ID to track status.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2 }} variant="outlined">
        <form onSubmit={handleSubmit}>
          <Typography variant="subtitle1" fontWeight={600} color="primary.main" gutterBottom>Your details</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} sx={{ gridColumn: { sm: '1 / -1' } }} />
          </Box>

          <Typography variant="subtitle1" fontWeight={600} color="primary.main" gutterBottom>Complaint details</Typography>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <TextField fullWidth label="Project location" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} required />
            <TextField fullWidth multiline rows={4} label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the issue in detail…" />
            <FormControl fullWidth required>
              <InputLabel id="raise-category-label">Category</InputLabel>
              <Select
                labelId="raise-category-label"
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="PRODUCT">Product</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
                <MenuItem value="DELIVERY">Delivery</MenuItem>
                <MenuItem value="TECHNICAL">Technical</MenuItem>
              </Select>
              <FormHelperText>Select the category that best describes your complaint</FormHelperText>
            </FormControl>
          </Box>

          <Typography variant="subtitle1" fontWeight={600} color="primary.main" gutterBottom>Attachments</Typography>
          <Box sx={{ mb: 3 }}>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mr: 2 }}>
              Choose files
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" multiple hidden onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
            </Button>
            {files.length > 0 && <Typography variant="body2" color="text.secondary">{files.length} file(s) selected</Typography>}
            <FormHelperText>JPG, PNG or PDF. Optional.</FormHelperText>
          </Box>

          {createMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit'}
            </Alert>
          )}
          <Button type="submit" variant="contained" size="large" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit Complaint'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
