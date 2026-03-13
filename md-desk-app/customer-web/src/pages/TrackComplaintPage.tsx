import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { complaintsApi } from '../api/endpoints';

const statusSteps = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const stepColors = ['#0097d7', '#f37336', '#ffb74d', '#2e7d32'];

export default function TrackComplaintPage() {
  const [complaintId, setComplaintId] = useState('');
  const [searchId, setSearchId] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['track-complaint', searchId],
    queryFn: async () => (await complaintsApi.trackByComplaintId(searchId)).data,
    enabled: !!searchId,
    retry: false,
  });

  const complaint = data?.complaint as {
    complaintId: string;
    status: string;
    priority: string;
    description: string;
    productUsed: string;
    projectLocation: string;
    media?: Array<{ id: string; fileUrl: string; fileType: string }>;
    adminResponses?: unknown[];
    createdAt: string;
  } | undefined;
  const activeStep = statusSteps.indexOf(complaint?.status || '');
  const isImage = (type: string) => /^image\//i.test(type);

  return (
    <Box>
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
            onClick={() => setSearchId(complaintId.trim())}
            disabled={!complaintId.trim() || isFetching}
            sx={{ minHeight: 56 }}
          >
            {isFetching ? 'Searching…' : 'Track'}
          </Button>
        </Box>
      </Paper>

      {searchId && (
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
              <Typography variant="body2" color="text.secondary">{complaint.productUsed} · {complaint.projectLocation}</Typography>
              {complaint.media && complaint.media.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Attachments</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {complaint.media.map((m) => (
                      <Box key={m.id} sx={{ width: 160, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        {isImage(m.fileType) ? (
                          <Box component="a" href={m.fileUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', lineHeight: 0 }}>
                            <Box component="img" src={m.fileUrl} alt="Attachment" sx={{ width: '100%', height: 120, objectFit: 'cover' }} />
                          </Box>
                        ) : (
                          <Box component="a" href={m.fileUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, bgcolor: 'action.hover', color: 'primary.main', textDecoration: 'none', fontWeight: 500 }}>
                            View file
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <Stepper activeStep={activeStep >= 0 ? activeStep : 0} sx={{ mt: 3 }}>
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
                      sx={{ '& .MuiStepLabel-label': { color: activeStep >= idx ? stepColors[idx] : 'text.secondary', fontWeight: activeStep === idx ? 700 : 400 } }}
                    >
                      {label.replace(/_/g, ' ')}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}
          {data === undefined && !isLoading && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Enter your complaint ID and click Track. Make sure you are logged in with the account that created the complaint.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
