import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Skeleton,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { complaintsApi } from '../api/endpoints';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';

const statusSteps = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const stepColors = ['#0097d7', '#f37336', '#ffb74d', '#2e7d32'];

type ActivityItem = {
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

function getAttachmentLabel(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split('/').pop() || 'Attachment');
  } catch {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'Attachment');
  }
}

export default function TrackComplaintPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idFromUrl = searchParams.get('complaintId') ?? '';
  const [complaintId, setComplaintId] = useState(idFromUrl);
  const [searchId, setSearchId] = useState(idFromUrl);

  useEffect(() => {
    if (idFromUrl) {
      setComplaintId(idFromUrl);
      setSearchId(idFromUrl);
    } else {
      setComplaintId('');
      setSearchId('');
      queryClient.removeQueries({ queryKey: ['track-complaint'] });
    }
  }, [idFromUrl, queryClient]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['track-complaint'] });
    };
  }, [queryClient]);

  const trimmedInput = complaintId.trim();
  const resultsMatchInput = trimmedInput === searchId;
  const effectiveSearchId = resultsMatchInput ? searchId : '';

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['track-complaint', effectiveSearchId],
    queryFn: async () => (await complaintsApi.trackByComplaintId(effectiveSearchId)).data,
    enabled: !!effectiveSearchId,
    retry: false,
  });

  const complaint = data?.complaint as {
    id: string;
    complaintId: string;
    status: string;
    priority: string;
    category?: string;
    description: string;
    projectLocation: string;
    media?: Array<{ id: string; fileUrl: string; fileType: string }>;
    adminResponses?: ActivityItem[];
    createdAt: string;
  } | undefined;
  const activeStep = statusSteps.indexOf(complaint?.status || '');
  const isImage = (type: string) => /^image\//i.test(type);
  const activityItems: ActivityItem[] = complaint
    ? [
        ...(complaint.adminResponses || []),
        {
          id: `created-${complaint.id}`,
          message: 'Complaint submitted.',
          createdBy: 'Customer',
          createdAt: complaint.createdAt,
        },
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const handleTrack = () => {
    setSearchId(trimmedInput);
  };

  const handleClearSearch = () => {
    setComplaintId('');
    setSearchId('');
    queryClient.removeQueries({ queryKey: ['track-complaint'] });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton
          aria-label="Back"
          onClick={() => navigate(-1)}
          edge="start"
          sx={{ mr: 0.5 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Button variant="text" onClick={() => navigate('/dashboard')} sx={{ textTransform: 'none' }}>
          Dashboard
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>Track Complaint</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Enter your complaint ID to see current status and timeline.
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Complaint ID</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            sx={{ maxWidth: 360 }}
            label="Complaint ID"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
            placeholder="e.g. MD-20250313-XXXX"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleTrack}
            disabled={!trimmedInput || isFetching}
            sx={{ minHeight: 56 }}
          >
            {isFetching ? 'Searching…' : 'Track'}
          </Button>
          {(searchId || trimmedInput) && (
            <Button variant="outlined" onClick={handleClearSearch} sx={{ minHeight: 56 }}>
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {effectiveSearchId && (
        <>
          {isLoading && (
            <Paper sx={{ p: 3, borderRadius: 2 }} variant="outlined">
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
              <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 2 }} />
            </Paper>
          )}
          {data && complaint && (
            <Paper sx={{ p: 3, borderRadius: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>{complaint.complaintId}</Typography>
                <Chip label={complaint.status} color="primary" size="small" />
                <Chip label={complaint.priority} variant="outlined" size="small" />
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>{complaint.description}</Typography>
              <Typography variant="body2" color="text.secondary">
                {complaint.category ? `${complaint.category} · ` : ''}{complaint.projectLocation}
              </Typography>
              {complaint.media && complaint.media.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Attachments</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {complaint.media.map((m) => (
                      <Box key={m.id} sx={{ width: 160, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        {isImage(m.fileType) ? (
                          <>
                            <Box component="a" href={m.fileUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', lineHeight: 0 }}>
                              <Box component="img" src={m.fileUrl} alt={getAttachmentLabel(m.fileUrl)} sx={{ width: '100%', height: 120, objectFit: 'cover' }} />
                            </Box>
                            <Typography variant="caption" display="block" sx={{ px: 1, py: 0.75 }}>
                              {getAttachmentLabel(m.fileUrl)}
                            </Typography>
                          </>
                        ) : (
                          <Box
                            component="a"
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: 120,
                              px: 1.5,
                              py: 1,
                              bgcolor: 'action.hover',
                              color: 'primary.main',
                              textDecoration: 'none',
                              fontWeight: 500,
                              textAlign: 'center',
                              wordBreak: 'break-word',
                            }}
                          >
                            {getAttachmentLabel(m.fileUrl)}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <Stepper activeStep={activeStep >= 0 ? activeStep : 0} alternativeLabel sx={{ mt: 3 }}>
                {statusSteps.map((label, idx) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: activeStep >= idx ? stepColors[idx] : 'grey.300',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}
                        </Box>
                      )}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: activeStep >= idx ? stepColors[idx] : 'text.secondary',
                          fontWeight: activeStep === idx ? 700 : 400,
                          textAlign: 'center',
                        },
                      }}
                    >
                      {label.replace(/_/g, ' ')}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
              {activityItems.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Activity
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {activityItems.map((activity) => (
                      <Paper key={activity.id} variant="outlined" sx={{ p: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {activity.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {activity.createdBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(activity.createdAt)}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
          {isError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {getBackendErrorMessage(error, 'Complaint not found or you do not have access.')}
            </Alert>
          )}
          {!isError && data === undefined && !isLoading && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Enter your complaint ID and click Track. Make sure you are logged in with the account that created the complaint.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
