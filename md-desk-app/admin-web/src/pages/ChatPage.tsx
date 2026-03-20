import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { chatApi, projectsApi, uploadApi, type ChatMessageDto, type ChatRoomDto, type ChatAdminProjectRow, type ProjectDto } from '../api/endpoints';
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: mine ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
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

export default function ChatPage() {
  const { user, token } = useAuth();
  const role = (user as { role?: string; id?: string } | null)?.role;
  const myId = (user as { id?: string } | null)?.id;
  const isAdmin = role === 'ADMIN';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomDto | null>(null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: adminData } = useQuery({
    queryKey: ['chat-admin-projects'],
    queryFn: async () => (await chatApi.adminProjects()).data,
    enabled: isAdmin,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['chat-staff-projects', 1, 200],
    queryFn: async () => (await projectsApi.list({ page: 1, limit: 200 })).data,
    enabled: role === 'EMPLOYEE',
  });

  const { data: contactsData } = useQuery({
    queryKey: ['chat-contacts'],
    queryFn: async () => (await chatApi.contacts()).data,
    enabled: tab === 1,
  });

  const projectRows: ChatAdminProjectRow[] = useMemo(() => {
    if (isAdmin) return adminData?.items || [];
    const projects = (projectsData?.projects || []) as ProjectDto[];
    return projects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      status: p.status,
      client: p.client
        ? { id: p.client.id, name: p.client.name, email: p.client.email }
        : null,
      roomId: null,
      lastMessage: null,
    }));
  }, [isAdmin, adminData, projectsData]);

  const openProjectRoom = useMutation({
    mutationFn: (projectId: string) => chatApi.projectRoom(projectId),
    onSuccess: (res) => {
      setActiveRoom(res.data.room);
      setRoomId(res.data.room.id);
      queryClient.invalidateQueries({ queryKey: ['chat-admin-projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['chat-admin-projects'] });
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

  const messages = (msgData?.messages || []) as ChatMessageDto[];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Team chat
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Project group chats (and direct messages with people on your projects). Admins see every project thread.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="By project" />
        <Tab label="Direct" />
      </Tabs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" sx={{ minHeight: 520 }}>
        <Paper sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, maxHeight: { xs: 240, md: 'none' }, overflow: 'auto' }}>
          {tab === 0 && (
            <>
              {openProjectRoom.isPending && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {openProjectRoom.isError && (
                <Alert severity="error" sx={{ m: 1 }}>
                  {getBackendErrorMessage(openProjectRoom.error, 'Could not open room')}
                </Alert>
              )}
              <List dense disablePadding>
                {projectRows.map((row) => (
                  <ListItemButton
                    key={row.projectId}
                    selected={activeRoom?.projectId === row.projectId}
                    onClick={() => openProjectRoom.mutate(row.projectId)}
                  >
                    <ListItemText
                      primary={row.projectName}
                      secondary={
                        <>
                          {row.client && `${row.client.name} · `}
                          <Chip size="small" label={row.status} sx={{ mt: 0.5 }} />
                          {row.lastMessage?.body && (
                            <Typography variant="caption" display="block" noWrap>
                              {row.lastMessage.sender?.name}: {row.lastMessage.body}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
              {projectRows.length === 0 && !openProjectRoom.isPending && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No projects found.
                </Typography>
              )}
            </>
          )}
          {tab === 1 && (
            <List dense disablePadding>
              {(contactsData?.users || []).map((u) => (
                <ListItemButton
                  key={u.id}
                  selected={activeRoom?.type === 'DIRECT' && activeRoom.participants?.some((p) => p.userId === u.id)}
                  onClick={() => openDirect.mutate(u.id)}
                >
                  <ListItemText primary={u.name} secondary={`${u.role} · ${u.email}`} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {roomTitle(activeRoom, myId)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            {!roomId && (
              <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                Select a project or person to start.
              </Typography>
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
