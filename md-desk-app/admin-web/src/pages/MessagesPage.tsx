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
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
  Chip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import { messagesApi } from '../api/endpoints';
import { downloadBlob } from '../utils/downloadBlob';

export default function MessagesPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages', page, limit, replyStatus, fromDate, toDate],
    queryFn: async () => (await messagesApi.list({
      page: page + 1,
      limit,
      replyStatus: replyStatus || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })).data,
  });

  const { data: detail } = useQuery({
    queryKey: ['message', selectedId],
    queryFn: async () => (await messagesApi.getById(selectedId!)).data,
    enabled: !!selectedId,
  });

  const replyMutation = useMutation({
    mutationFn: () => messagesApi.reply(selectedId!, replyText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['message', selectedId] });
      setReplyText('');
      setSelectedId(null);
    },
  });

  const items = (data?.items || []) as Array<{
    id: string;
    subject: string;
    message: string;
    createdAt: string;
    adminReply?: string;
    user?: { name: string; email: string };
  }>;
  const msg = detail?.message as
    | {
        id: string;
        subject: string;
        message: string;
        adminReply?: string;
        repliedAt?: string;
        user?: { name: string; email: string };
      }
    | undefined;

  const handleExport = async () => {
    const res = await messagesApi.export({
      replyStatus: replyStatus || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    downloadBlob(res.data, 'messages_export.xlsx');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Customer Messages</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => void handleExport()}>
          Export Excel
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>View and reply to customer suggestions and feedback</Typography>
      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Reply status</InputLabel>
          <Select value={replyStatus} label="Reply status" onChange={(e) => { setReplyStatus(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="REPLIED">Replied</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="From date"
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <Button onClick={() => { setReplyStatus(''); setFromDate(''); setToDate(''); setPage(0); }}>
          Clear filters
        </Button>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Replied</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton height={48} /></TableCell></TableRow>
                ))
              : items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.user?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.user?.email}</Typography>
                    </TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{row.adminReply ? <Chip label="Replied" color="success" size="small" /> : <Chip label="Pending" size="small" />}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<ReplyIcon />} variant="outlined" onClick={() => setSelectedId(row.id)}>View / Reply</Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.total ?? 0}
          rowsPerPage={limit}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
        />
      </TableContainer>
      <Dialog open={!!selectedId} onClose={() => setSelectedId(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EmailIcon color="primary" /> {msg?.subject}</DialogTitle>
        <DialogContent>
          {msg ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>From: {msg.user?.name} ({msg.user?.email})</Typography>
              <Paper variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body1">{msg.message}</Typography>
              </Paper>
              {msg.adminReply && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>Your reply</Typography>
                  <Typography variant="body1">{msg.adminReply}</Typography>
                  {msg.repliedAt && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{new Date(msg.repliedAt).toLocaleString()}</Typography>}
                </Paper>
              )}
              {!msg.adminReply && (
                <Box sx={{ mt: 2 }}>
                  <TextField fullWidth multiline rows={4} label="Your reply" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply…" sx={{ mb: 2 }} />
                  <Button variant="contained" startIcon={<ReplyIcon />} disabled={!replyText.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate()}>
                    {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Skeleton variant="rectangular" height={180} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
