import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../api/client.dart';

class MessageMDScreen extends StatefulWidget {
  const MessageMDScreen({super.key});

  @override
  State<MessageMDScreen> createState() => _MessageMDScreenState();
}

class _MessageMDScreenState extends State<MessageMDScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  List<Map<String, dynamic>> _items = [];
  String? _error;
  bool _sending = false;
  bool _loading = false;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() => _loading = true);
    try {
      final res = await client.get('/messages/my?limit=50');
      final list = (res['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() {
        _items = list;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _send() async {
    final subject = _subjectController.text.trim();
    final message = _messageController.text.trim();
    if (subject.isEmpty || message.isEmpty) return;
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _error = null;
      _success = false;
      _sending = true;
    });
    try {
      await client.post('/messages', {'subject': subject, 'message': message});
      if (mounted) {
        _subjectController.clear();
        _messageController.clear();
        setState(() {
          _sending = false;
          _success = true;
        });
        _load();
      }
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Message MD', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'Send suggestions or feedback to MD Desk. All replies from the admin are shown below.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Send a message', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _subjectController,
                    decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(labelText: 'Message', border: OutlineInputBorder(), alignLabelWithHint: true),
                    maxLines: 5,
                  ),
                  if (_success) Padding(padding: const EdgeInsets.only(top: 12), child: Text('Message sent successfully.', style: TextStyle(color: theme.colorScheme.primary))),
                  if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: TextStyle(color: theme.colorScheme.error))),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _sending ? null : _send,
                    icon: const Icon(Icons.send, size: 18),
                    label: Text(_sending ? 'Sending…' : 'Send'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('My messages & replies from admin', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('Here you can see every message you sent and the replies you received from MD Desk.', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else if (_items.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.email, size: 48, color: theme.colorScheme.outline),
                      const SizedBox(height: 8),
                      Text('No messages yet. Send one above to get started.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline)),
                    ],
                  ),
                ),
              ),
            )
          else
            ..._items.map((item) {
              final subject = item['subject'] as String? ?? '—';
              final message = item['message'] as String? ?? '';
              final adminReply = item['adminReply'] as String?;
              final repliedAt = item['repliedAt'] as String?;
              final createdAt = item['createdAt'] as String? ?? '';
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ExpansionTile(
                  title: Row(
                    children: [
                      Expanded(child: Text(subject, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600))),
                      Chip(
                        label: Text(adminReply != null && adminReply.isNotEmpty ? 'Replied' : 'Pending'),
                        visualDensity: VisualDensity.compact,
                      ),
                      const SizedBox(width: 8),
                      Text(createdAt.isNotEmpty ? _formatDate(createdAt) : '', style: theme.textTheme.bodySmall),
                    ],
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Your message', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                            child: Text(message),
                          ),
                          const SizedBox(height: 12),
                          if (adminReply != null && adminReply.isNotEmpty) ...[
                            Text('Reply from MD Desk', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(adminReply),
                                  if (repliedAt != null && repliedAt.isNotEmpty) Text(_formatDate(repliedAt), style: theme.textTheme.bodySmall),
                                ],
                              ),
                            ),
                          ] else
                            Text('No reply yet. We\'ll get back to you soon.', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}
