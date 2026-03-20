import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  Alert,
} from '@mui/material';
import { complaintsApi } from '../api/endpoints';
import { useStaffRole } from '../hooks/useStaffRole';

export default function ComplaintDetailPage() {
  const { canUpdateComplaint } = useStaffRole();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => (await complaintsApi.getById(id!)).data,
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (payload: { status: string; priority?: string }) => complaintsApi.updateStatus(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
    },
  });

  const complaint = data?.complaint as {
    id: string;
    complaintId: string;
    status: string;
    priority: string;
    category?: string;
    productUsed: string;
    projectLocation: string;
    description: string;
    name?: string;
    phone?: string;
    city?: string;
    user?: { name: string; email: string; phone?: string; city?: string };
    media?: Array<{ fileUrl: string; fileType: string }>;
    adminResponses?: unknown[];
    createdAt: string;
    updatedAt: string;
  } | undefined;

  if (!id || isLoading) return <Typography>Loading...</Typography>;
  if (!complaint) return <Typography>Complaint not found</Typography>;

  const user = complaint.user || {};
  const displayName = complaint.name || user.name;
  const displayPhone = complaint.phone || user.phone;
  const displayCity = complaint.city || user.city;

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate('/complaints')}>
        ← Back
      </Button>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {complaint.complaintId}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary">Customer</Typography>
            <Typography>{displayName || '-'} ({user.email || '-'})</Typography>
            <Typography variant="body2">{displayPhone} · {displayCity}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary">Category / Product / Location</Typography>
            <Typography>{complaint.category ? `${complaint.category} · ` : ''}{complaint.productUsed} · {complaint.projectLocation}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography color="textSecondary">Description</Typography>
            <Typography>{complaint.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Chip label={complaint.priority} color={complaint.priority === 'HIGH' ? 'error' : 'default'} sx={{ mr: 1 }} />
            <Chip label={complaint.status} />
          </Grid>
        </Grid>
      </Paper>
      {canUpdateComplaint && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Update Status & Priority
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status || complaint.status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="RECEIVED">Received</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={priority || complaint.priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              disabled={updateStatus.isPending || ((status || complaint.status) === complaint.status && (priority || complaint.priority) === complaint.priority)}
              onClick={() => updateStatus.mutate({ status: status || complaint.status, priority: priority || complaint.priority })}
            >
              Update
            </Button>
          </Box>
          {updateStatus.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Status and priority updated.</Alert>}
        </Paper>
      )}
      {complaint.media && complaint.media.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Photos / Documents
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {complaint.media.map((m) =>
              m.fileType.startsWith('image/') ? (
                <Card key={m.fileUrl} sx={{ maxWidth: 200 }}>
                  <CardMedia component="img" height="140" image={m.fileUrl} alt="Attachment" />
                </Card>
              ) : (
                <Button key={m.fileUrl} href={m.fileUrl} target="_blank" rel="noopener">
                  View file
                </Button>
              )
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
