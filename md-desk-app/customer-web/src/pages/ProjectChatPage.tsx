import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useAuth } from '../hooks/useAuth';
import { chatApi, uploadApi, dashboardApi, type ChatMessageDto, type ChatRoomDto } from '../api/endpoints';
import { useChatRoomSocket } from '../socket/useChatRoomSocket';
import { getBackendErrorMessage } from '../api/getBackendErrorMessage';
import { ACCEPT_CHAT, validateFilesChat } from '../constants/uploadAccept';

function roomTitle(room: ChatRoomDto | null, myId: string | undefined) {
  if (!room || !myId) return 'Chat';
  if (room.project?.name) return `${room.project.name} — project`;
  const other = room.participants?.find((p) => p.userId !== myId)?.user?.name;
  return other || 'Direct chat';
}

function MessageBubble({ m, mine }: { m: ChatMessageDto; mine: boolean }) {
  const isImage = m.attachmentMime?.startsWith('image/');
  return (
    <Box sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1 }}>
      <Paper
        elevation={1}
        sx={{
          px: 1.5,
          py: 1,
          maxWidth: '78%',
          bgcolor: mine ? 'primary.main' : 'grey.100',
          color: mine ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {!mine && (
          <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>
            {m.sender?.name || 'User'}
          </Typography>
        )}
        {m.body && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {m.body}
          </Typography>
        )}
        {m.kind === 'FILE' && m.attachmentUrl && (
          <Box sx={{ mt: 0.5 }}>
            {isImage ? (
              <Box component="img" src={m.attachmentUrl} alt="" sx={{ maxWidth: '100%', maxHeight: 220, borderRadius: 1 }} />
            ) : (
              <Button size="small" href={m.attachmentUrl} target="_blank" rel="noreferrer" sx={{ color: 'inherit' }}>
                Open file
              </Button>
            )}
          </Box>
        )}
        {m.kind === 'VOICE' && m.attachmentUrl && (
          <audio controls src={m.attachmentUrl} style={{ maxWidth: '100%', marginTop: 4 }} />
        )}
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {mine && m.deliveryStatus && (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {m.deliveryStatus === 'seen' ? '✓✓' : '✓'}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default function ProjectChatPage() {
  const { user, token } = useAuth();
  const myId = (user as { id?: string } | null)?.id;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomDto | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: summary } = useQuery({
    queryKey: ['customer-summary'],
    queryFn: async () => (await dashboardApi.customerSummary()).data,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['chat-contacts'],
    queryFn: async () => (await chatApi.contacts()).data,
    enabled: tab === 1,
  });

  const openProjectRoom = useMutation({
    mutationFn: (projectId: string) => chatApi.projectRoom(projectId),
    onSuccess: (res) => {
      setActiveRoom(res.data.room);
      setRoomId(res.data.room.id);
    },
  });

  const openDirect = useMutation({
    mutationFn: (otherUserId: string) => chatApi.direct(otherUserId),
    onSuccess: (res) => {
      setActiveRoom(res.data.room);
      setRoomId(res.data.room.id);
    },
  });

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => (await chatApi.messages(roomId!, { limit: 100 })).data,
    enabled: !!roomId,
  });

  useChatRoomSocket(token ?? null, roomId);

  useEffect(() => {
    if (!roomId) return;
    chatApi.markRead(roomId).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgData?.messages?.length, roomId]);

  const sendMut = useMutation({
    mutationFn: async (payload: { kind: 'TEXT' | 'FILE' | 'VOICE'; body?: string; attachmentUrl?: string; attachmentMime?: string }) => {
      if (!roomId) throw new Error('No room');
      return chatApi.send(roomId, payload);
    },
    onSuccess: () => {
      setText('');
      setSendError(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    },
    onError: (e: unknown) => setSendError(getBackendErrorMessage(e, 'Failed to send')),
  });

  const handleSendText = () => {
    const t = text.trim();
    if (!t || !roomId) return;
    sendMut.mutate({ kind: 'TEXT', body: t });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !roomId) return;
    const err = validateFilesChat(files);
    if (err) {
      setSendError(err);
      return;
    }
    setUploading(true);
    setSendError(null);
    try {
      const file = files[0];
      const { data } = await uploadApi.upload(file, { scope: 'chat' });
      const mime = data.file_type || file.type;
      const isAudio = mime.startsWith('audio/');
      await sendMut.mutateAsync({
        kind: isAudio ? 'VOICE' : 'FILE',
        attachmentUrl: data.file_url,
        attachmentMime: mime,
        body: file.name,
      });
    } catch (err: unknown) {
      setSendError(getBackendErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const projects = summary?.activeProjects || [];
  const messages = (msgData?.messages || []) as ChatMessageDto[];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Project chat
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Group chat per project with your team, or direct messages with staff assigned to your projects.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="My projects" />
        <Tab label="Message staff" />
      </Tabs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" sx={{ minHeight: 480 }}>
        <Paper sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, maxHeight: { xs: 220, md: 'none' }, overflow: 'auto' }}>
          {tab === 0 && (
            <List dense disablePadding>
              {projects.map((p) => (
                <ListItemButton
                  key={p.id}
                  selected={activeRoom?.projectId === p.id}
                  onClick={() => openProjectRoom.mutate(p.id)}
                >
                  <ListItemText
                    primary={p.name}
                    secondary={<Chip size="small" label={p.status} sx={{ mt: 0.5 }} />}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
          {tab === 1 && (
            <List dense disablePadding>
              {(contactsData?.users || []).map((u) => (
                <ListItemButton
                  key={u.id}
                  selected={activeRoom?.type === 'DIRECT' && activeRoom.participants?.some((p) => p.userId === u.id)}
                  onClick={() => openDirect.mutate(u.id)}
                >
                  <ListItemText primary={u.name} secondary={u.email} />
                </ListItemButton>
              ))}
            </List>
          )}
          {tab === 0 && projects.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No active projects yet.
            </Typography>
          )}
        </Paper>

        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 360 }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {roomTitle(activeRoom, myId)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            {!roomId && (
              <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                Choose a project or staff member.
              </Typography>
            )}
            {openProjectRoom.isError && (
              <Alert severity="error">{getBackendErrorMessage(openProjectRoom.error, 'Could not open chat')}</Alert>
            )}
            {msgLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} mine={m.senderId === myId} />
            ))}
            <div ref={bottomRef} />
          </Box>
          {roomId && (
            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
              {sendError && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setSendError(null)}>
                  {sendError}
                </Alert>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <input ref={fileRef} type="file" hidden accept={ACCEPT_CHAT} onChange={handleFile} />
                <IconButton onClick={() => fileRef.current?.click()} disabled={uploading || sendMut.isPending} aria-label="Attach">
                  <AttachFileIcon />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                />
                <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendText} disabled={!text.trim() || sendMut.isPending || uploading}>
                  Send
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
