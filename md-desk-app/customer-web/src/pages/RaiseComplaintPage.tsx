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
import { complaintsApi, dashboardApi } from '../api/endpoints';

export default function RaiseComplaintPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('PRODUCT');
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: dashData } = useQuery({
    queryKey: ['customer-summary', 'raise'],
    queryFn: async () => (await dashboardApi.customerSummary()).data,
  });
  const activeProjects = dashData?.activeProjects ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('name', name);
      form.append('phone', phone);
      form.append('city', city);
      const loc =
        projectId && activeProjects.length
          ? activeProjects.find((p) => p.id === projectId)?.name || projectLocation
          : projectLocation;
      form.append('project_location', loc);
      if (projectId) form.append('project_id', projectId);
      form.append('description', description);
      form.append('category', category);
      files.forEach((f) => form.append('photos', f));
      return complaintsApi.create(form);
    },
    onSuccess: () => {
      navigate('/complaints');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (activeProjects.length > 0 && !projectId) {
      setLocalError('Please select the project this complaint relates to.');
      return;
    }
    if (!activeProjects.length && !projectLocation.trim()) {
      setLocalError('Project location is required.');
      return;
    }
    createMutation.mutate();
  };

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
            {activeProjects.length > 0 ? (
              <FormControl fullWidth required>
                <InputLabel id="raise-project-label">Project</InputLabel>
                <Select
                  labelId="raise-project-label"
                  value={projectId}
                  label="Project"
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {activeProjects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the project so your team can route the complaint correctly.</FormHelperText>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label="Project location"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                required
                helperText="No active projects on file — describe the site or location."
              />
            )}
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

          {(localError || createMutation.isError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError
                || (createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Failed to submit'}
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
