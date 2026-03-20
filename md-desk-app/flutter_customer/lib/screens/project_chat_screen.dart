import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:url_launcher/url_launcher.dart';
import '../auth_provider.dart';
import '../api/client.dart';
import '../utils/media_url.dart';

/// Allowed extensions for chat uploads (server `scope=chat`).
const _chatExtensions = <String>{
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'mp3',
  'wav',
  'aac',
  'ogg',
  'webm',
};

bool _isAllowedChatFile(String filename) {
  final i = filename.lastIndexOf('.');
  if (i < 0) return false;
  return _chatExtensions.contains(filename.substring(i + 1).toLowerCase());
}

class ProjectChatScreen extends StatefulWidget {
  const ProjectChatScreen({super.key});

  @override
  State<ProjectChatScreen> createState() => _ProjectChatScreenState();
}

class _ProjectChatScreenState extends State<ProjectChatScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  List<Map<String, dynamic>> _projects = [];
  List<Map<String, dynamic>> _contacts = [];
  String? _roomId;
  Map<String, dynamic>? _activeRoom;
  List<Map<String, dynamic>> _messages = [];

  bool _loadingProjects = true;
  bool _loadingContacts = false;
  bool _loadingMessages = false;
  bool _openingRoom = false;
  bool _sending = false;
  bool _uploading = false;
  String? _error;

  IO.Socket? _socket;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) return;
      if (_tabController.index == 1 && _contacts.isEmpty && !_loadingContacts) {
        _loadContacts();
      }
      setState(() {});
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProjects());
  }

  @override
  void dispose() {
    _disconnectSocket();
    _tabController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _disconnectSocket() {
    try {
      if (_roomId != null) {
        _socket?.emit('chat:leave', {'roomId': _roomId});
      }
      _socket?.disconnect();
      _socket?.dispose();
    } catch (_) {}
    _socket = null;
  }

  void _connectSocket(String roomId) {
    _disconnectSocket();
    final token = context.read<AuthProvider>().token;
    if (token == null || token.isEmpty) return;

    final origin = ApiClient.socketOrigin(AuthProvider.baseUrl);
    final socket = IO.io(
      origin,
      IO.OptionBuilder()
          .setPath('/socket.io')
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .build(),
    );
    _socket = socket;

    socket.onConnect((_) {
      socket.emit('chat:join', {'roomId': roomId});
    });
    socket.on('chat:message', (_) {
      if (mounted) _loadMessages(silent: true);
    });
    socket.on('chat:read', (_) {
      if (mounted) _loadMessages(silent: true);
    });
  }

  String? get _myId => context.read<AuthProvider>().user?['id'] as String?;

  String _roomTitle() {
    final room = _activeRoom;
    final myId = _myId;
    if (room == null || myId == null) return 'Chat';
    final project = room['project'] as Map<String, dynamic>?;
    final name = project?['name'] as String?;
    if (name != null && name.isNotEmpty) return '$name — project';
    final parts = room['participants'] as List?;
    if (parts != null) {
      for (final p in parts) {
        final m = p as Map<String, dynamic>;
        final uid = m['userId'] as String?;
        if (uid != null && uid != myId) {
          final u = m['user'] as Map<String, dynamic>?;
          final n = u?['name'] as String?;
          if (n != null) return n;
        }
      }
    }
    return 'Direct chat';
  }

  Future<void> _loadProjects() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _loadingProjects = true;
      _error = null;
    });
    try {
      final res = await client.get('/dashboard/customer-summary');
      final list = (res['activeProjects'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() => _projects = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loadingProjects = false);
    }
  }

  Future<void> _loadContacts() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _loadingContacts = true;
      _error = null;
    });
    try {
      final res = await client.get('/chat/contacts');
      final list = (res['users'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() => _contacts = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loadingContacts = false);
    }
  }

  Future<void> _openProjectRoom(String projectId) async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _openingRoom = true;
      _error = null;
    });
    try {
      final res = await client.get('/chat/projects/$projectId/room');
      final room = res['room'] as Map<String, dynamic>?;
      final id = room?['id'] as String?;
      if (id == null) throw Exception('No room id');
      if (!mounted) return;
      setState(() {
        _roomId = id;
        _activeRoom = room;
        _messages = [];
      });
      _connectSocket(id);
      await client.post('/chat/rooms/$id/read');
      await _loadMessages();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _openingRoom = false);
    }
  }

  Future<void> _openDirect(String otherUserId) async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _openingRoom = true;
      _error = null;
    });
    try {
      final res = await client.post('/chat/direct', {'otherUserId': otherUserId});
      final room = res['room'] as Map<String, dynamic>?;
      final id = room?['id'] as String?;
      if (id == null) throw Exception('No room id');
      if (!mounted) return;
      setState(() {
        _roomId = id;
        _activeRoom = room;
        _messages = [];
      });
      _connectSocket(id);
      await client.post('/chat/rooms/$id/read');
      await _loadMessages();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _openingRoom = false);
    }
  }

  Future<void> _loadMessages({bool silent = false}) async {
    final client = context.read<AuthProvider>().client;
    final rid = _roomId;
    if (client == null || rid == null) return;
    if (!silent) setState(() => _loadingMessages = true);
    try {
      final res = await client.get('/chat/rooms/$rid/messages', query: {'limit': '100'});
      final list = (res['messages'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (!mounted) return;
      setState(() => _messages = list);
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (e) {
      if (!silent && mounted) setState(() => _error = e.toString());
    } finally {
      if (!silent && mounted) setState(() => _loadingMessages = false);
    }
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
    );
  }

  Future<void> _sendText() async {
    final text = _messageController.text.trim();
    final client = context.read<AuthProvider>().client;
    final rid = _roomId;
    if (text.isEmpty || client == null || rid == null) return;
    setState(() => _sending = true);
    try {
      await client.post('/chat/rooms/$rid/messages', {
        'kind': 'TEXT',
        'body': text,
      });
      _messageController.clear();
      await _loadMessages();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _pickFile() async {
    final client = context.read<AuthProvider>().client;
    final rid = _roomId;
    if (client == null || rid == null) return;

    final result = await FilePicker.platform.pickFiles(
      withData: true,
      type: FileType.custom,
      allowedExtensions: _chatExtensions.toList(),
    );
    if (result == null || result.files.isEmpty) return;
    final f = result.files.first;
    final name = f.name;
    if (!_isAllowedChatFile(name)) {
      setState(() => _error = 'File type not allowed for chat.');
      return;
    }
    final bytes = f.bytes;
    if (bytes == null) {
      setState(() => _error = 'Could not read file.');
      return;
    }
    if (bytes.length > kMaxUploadBytes) {
      setState(() => _error = 'File exceeds the maximum size of 5 MB.');
      return;
    }

    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final multipart = http.MultipartFile.fromBytes('file', bytes, filename: name);
      final up = await client.uploadFile('/upload', file: multipart, query: {'scope': 'chat'});
      final url = up['file_url'] as String?;
      final mime = up['file_type'] as String? ?? 'application/octet-stream';
      if (url == null) throw Exception('Upload failed');
      final isAudio = mime.startsWith('audio/');
      await client.post('/chat/rooms/$rid/messages', {
        'kind': isAudio ? 'VOICE' : 'FILE',
        'attachmentUrl': url,
        'attachmentMime': mime,
        'body': name,
      });
      await _loadMessages();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final myId = _myId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Project chat', style: theme.textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                'Group chat per project or direct messages with assigned staff.',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
              ),
            ],
          ),
        ),
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'My projects'),
            Tab(text: 'Message staff'),
          ],
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: MaterialBanner(
              content: Text(_error!),
              actions: [TextButton(onPressed: () => setState(() => _error = null), child: const Text('Dismiss'))],
            ),
          ),
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: 160,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border(right: BorderSide(color: theme.dividerColor)),
                  ),
                  child: _tabController.index == 0 ? _buildProjectList() : _buildContactList(),
                ),
              ),
              Expanded(child: _buildThread(theme, myId)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProjectList() {
    if (_loadingProjects) {
      return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
    }
    if (_projects.isEmpty) {
      return const Center(child: Padding(padding: EdgeInsets.all(8), child: Text('No projects', textAlign: TextAlign.center)));
    }
    return ListView.builder(
      itemCount: _projects.length,
      itemBuilder: (ctx, i) {
        final p = _projects[i];
        final id = p['id'] as String? ?? '';
        final name = p['name'] as String? ?? 'Project';
        final status = p['status'] as String? ?? '';
        final selected = _activeRoom?['projectId'] == id;
        return ListTile(
          dense: true,
          selected: selected,
          title: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis),
          subtitle: Text(status, style: const TextStyle(fontSize: 11)),
          onTap: _openingRoom ? null : () => _openProjectRoom(id),
        );
      },
    );
  }

  Widget _buildContactList() {
    if (_loadingContacts) {
      return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
    }
    if (_contacts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Text(
            'No contacts',
            textAlign: TextAlign.center,
            style: TextStyle(color: Theme.of(context).colorScheme.outline),
          ),
        ),
      );
    }
    return ListView.builder(
      itemCount: _contacts.length,
      itemBuilder: (ctx, i) {
        final u = _contacts[i];
        final id = u['id'] as String? ?? '';
        final name = u['name'] as String? ?? 'User';
        final email = u['email'] as String? ?? '';
        bool selected = false;
        final room = _activeRoom;
        if (room?['type'] == 'DIRECT') {
          final parts = room!['participants'] as List?;
          if (parts != null) {
            for (final p in parts) {
              final m = p as Map<String, dynamic>;
              if (m['userId'] == id) selected = true;
            }
          }
        }
        return ListTile(
          dense: true,
          selected: selected && _roomId != null,
          title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(email, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)),
          onTap: _openingRoom ? null : () => _openDirect(id),
        );
      },
    );
  }

  Widget _buildThread(ThemeData theme, String? myId) {
    if (_roomId == null) {
      return Center(
        child: Text(
          'Select a project or staff member',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          elevation: 0,
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Text(_roomTitle(), style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
          ),
        ),
        Expanded(
          child: _loadingMessages
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(8),
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    return _MessageTile(message: m, mine: m['senderId'] == myId);
                  },
                ),
        ),
        SafeArea(
          top: false,
          child: Material(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton(
                    onPressed: (_uploading || _sending) ? null : _pickFile,
                    icon: const Icon(Icons.attach_file),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Message…',
                        border: OutlineInputBorder(),
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (_) => _sendText(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: (_sending || _uploading) ? null : _sendText,
                    child: _sending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send, size: 20),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageTile extends StatelessWidget {
  const _MessageTile({required this.message, required this.mine});
  final Map<String, dynamic> message;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final kind = message['kind'] as String? ?? 'TEXT';
    final body = message['body'] as String?;
    final url = message['attachmentUrl'] as String?;
    final mime = message['attachmentMime'] as String?;
    final createdAt = message['createdAt'] as String?;
    final sender = message['sender'] as Map<String, dynamic>?;
    final senderName = sender?['name'] as String? ?? '';
    final delivery = message['deliveryStatus'] as String?;

    DateTime? dt;
    if (createdAt != null) {
      try {
        dt = DateTime.parse(createdAt);
      } catch (_) {}
    }
    final timeStr = dt != null
        ? '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}'
        : '';

    final bubble = theme.colorScheme.primaryContainer;
    final onBubble = theme.colorScheme.onPrimaryContainer;
    final otherBg = theme.colorScheme.surfaceContainerHighest;
    final isImage = mime != null && mime.startsWith('image/');

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.82),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: mine ? bubble : otherBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: DefaultTextStyle.merge(
                style: TextStyle(color: mine ? onBubble : theme.colorScheme.onSurface),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!mine && senderName.isNotEmpty)
                      Text(senderName, style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600)),
                    if (body != null && body.isNotEmpty) Text(body),
                    if (kind == 'FILE' && url != null)
                      isImage
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(url, height: 160, fit: BoxFit.cover),
                            )
                          : TextButton(
                              onPressed: () async {
                                final u = Uri.parse(url);
                                if (await canLaunchUrl(u)) {
                                  await launchUrl(u, mode: LaunchMode.externalApplication);
                                }
                              },
                              child: const Text('Open file'),
                            ),
                    if (kind == 'VOICE' && url != null)
                      TextButton(
                        onPressed: () async {
                          final u = Uri.parse(url);
                          if (await canLaunchUrl(u)) {
                            await launchUrl(u, mode: LaunchMode.externalApplication);
                          }
                        },
                        child: const Text('Play voice note'),
                      ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (timeStr.isNotEmpty) Text(timeStr, style: theme.textTheme.labelSmall),
                        if (mine && delivery != null) ...[
                          const SizedBox(width: 4),
                          Text(delivery == 'seen' ? '✓✓' : '✓', style: theme.textTheme.labelSmall),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
