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
  Divider,
  Stack,
  TextField,
} from '@mui/material';
import { complaintsApi } from '../api/endpoints';
import { useStaffRole } from '../hooks/useStaffRole';

type AdminResponse = {
  id: string;
  message: string;
  createdBy: string;
  createdAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ComplaintDetailPage() {
  const { canUpdateComplaint } = useStaffRole();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => (await complaintsApi.getById(id!)).data,
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (payload: { status: string; priority?: string; comment?: string }) => complaintsApi.updateStatus(id!, payload),
    onSuccess: () => {
      setStatus('');
      setPriority('');
      setComment('');
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
    projectLocation: string;
    project?: { id: string; name: string } | null;
    description: string;
    name?: string;
    phone?: string;
    city?: string;
    user?: { name: string; email: string; phone?: string; city?: string };
    media?: Array<{ fileUrl: string; fileType: string }>;
    adminResponses?: AdminResponse[];
    createdAt: string;
    updatedAt: string;
  } | undefined;

  if (!id || isLoading) return <Typography>Loading...</Typography>;
  if (!complaint) return <Typography>Complaint not found</Typography>;

  const user: NonNullable<typeof complaint.user> = complaint.user || { name: '', email: '', phone: '', city: '' };
  const displayName = complaint.name || user.name;
  const displayPhone = complaint.phone || user.phone;
  const displayCity = complaint.city || user.city;
  const selectedStatus = status || complaint.status;
  const selectedPriority = priority || complaint.priority;
  const trimmedComment = comment.trim();
  const hasChanges =
    selectedStatus !== complaint.status ||
    selectedPriority !== complaint.priority ||
    Boolean(trimmedComment);
  const activityItems: AdminResponse[] = [
    ...(complaint.adminResponses || []),
    {
      id: `created-${complaint.id}`,
      message: 'Complaint submitted.',
      createdBy: displayName || user.email || 'Customer',
      createdAt: complaint.createdAt,
    },
  ];

  return (
    <Box>
      <Button sx={{ mb: 2 }} onClick={() => navigate('/complaints')}>
        ← Back
      </Button>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
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
                <Typography color="textSecondary">Project</Typography>
                <Typography>{complaint.project?.name || '—'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="textSecondary">Category / Location</Typography>
                <Typography>
                  {complaint.category ? `${complaint.category} · ` : ''}
                  {complaint.projectLocation}
                </Typography>
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={selectedStatus} label="Status" onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="RECEIVED">Received</MenuItem>
                    <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select value={selectedPriority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Comment / Description"
                placeholder="Add context for this update"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                disabled={updateStatus.isPending || !hasChanges}
                onClick={() =>
                  updateStatus.mutate({
                    status: selectedStatus,
                    priority: selectedPriority,
                    comment: trimmedComment || undefined,
                  })
                }
              >
                Update
              </Button>
              {updateStatus.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Complaint update saved.</Alert>}
              {updateStatus.isError && <Alert severity="error" sx={{ mt: 2 }}>Unable to save the complaint update.</Alert>}
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
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h6" gutterBottom>
              Activity
            </Typography>
            <Stack divider={<Divider flexItem />} spacing={2}>
              {activityItems.map((activity) => (
                <Box key={activity.id}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {activity.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {activity.createdBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(activity.createdAt)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
