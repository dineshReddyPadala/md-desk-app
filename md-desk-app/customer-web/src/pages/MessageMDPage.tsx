import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  List,
  Chip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import { messagesApi } from '../api/endpoints';

type MessageItem = {
  id: string;
  subject: string;
  message: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
};

export default function MessageMDPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: myData, isLoading: myLoading, refetch: refetchMy } = useQuery({
    queryKey: ['messages-my'],
    queryFn: async () => (await messagesApi.myList({ limit: 50 })).data,
  });

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.create(subject, message),
    onSuccess: () => {
      setSubject('');
      setMessage('');
      setSuccess(true);
      refetchMy();
    },
  });

  const myItems = (myData?.items ?? []) as MessageItem[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    sendMutation.mutate();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Message MD</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Send suggestions or feedback to MD Desk. All replies from the admin are shown below.
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} variant="outlined">
        <Typography variant="h6" gutterBottom>Send a message</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          {success && <Alert severity="success" sx={{ mb: 2 }}>Message sent successfully.</Alert>}
          {sendMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(sendMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send'}
            </Alert>
          )}
          <Button type="submit" variant="contained" startIcon={<SendIcon />} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </Paper>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>My messages & replies from admin</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Here you can see every message you sent and the replies you received from MD Desk.
      </Typography>

      {myLoading ? (
        <Box sx={{ '& > *': { mb: 1 } }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : myItems.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">No messages yet. Send one above to get started.</Typography>
        </Paper>
      ) : (
        <List disablePadding>
          {myItems.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
              <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                    <Typography fontWeight={600}>{item.subject}</Typography>
                    <Chip
                      size="small"
                      label={item.adminReply ? 'Replied' : 'Pending'}
                      color={item.adminReply ? 'success' : 'default'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Your message</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body1">{item.message}</Typography>
                  </Paper>
                  {item.adminReply ? (
                    <>
                      <Typography variant="body2" color="primary.main" fontWeight={600} gutterBottom>
                        Reply from MD Desk
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body1">{item.adminReply}</Typography>
                        {item.repliedAt && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {new Date(item.repliedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Paper>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No reply yet. We&apos;ll get back to you soon.</Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
}
