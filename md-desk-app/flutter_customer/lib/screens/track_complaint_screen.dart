import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../api/client.dart';

const _statusSteps = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const _stepColors = [
  Color(0xFF0097D7),
  Color(0xFFF37336),
  Color(0xFFFFB74D),
  Color(0xFF2E7D32),
];

class TrackComplaintScreen extends StatefulWidget {
  const TrackComplaintScreen({super.key, this.initialComplaintId});

  final String? initialComplaintId;

  @override
  State<TrackComplaintScreen> createState() => _TrackComplaintScreenState();
}

class _TrackComplaintScreenState extends State<TrackComplaintScreen> {
  final _complaintIdController = TextEditingController();
  String _searchId = '';
  Map<String, dynamic>? _complaint;
  String? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialComplaintId != null && widget.initialComplaintId!.isNotEmpty) {
      _complaintIdController.text = widget.initialComplaintId!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _track());
    }
  }

  @override
  void dispose() {
    _complaintIdController.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    final id = _complaintIdController.text.trim();
    if (id.isEmpty) return;
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _searchId = id;
      _error = null;
      _complaint = null;
      _loading = true;
    });
    try {
      final res = await client.get('/complaints/track/${Uri.encodeComponent(id)}');
      final c = res['complaint'] as Map<String, dynamic>?;
      if (mounted) setState(() {
        _complaint = c;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _complaint = null;
        _loading = false;
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
          Text('Track Complaint', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'Enter your complaint ID to see current status and timeline.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Complaint ID', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _complaintIdController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. MD-20250313-XXXX',
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (_) => _track(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      FilledButton(
                        onPressed: _loading ? null : _track,
                        child: Text(_loading ? 'Searching…' : 'Track'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_searchId.isNotEmpty) ...[
            const SizedBox(height: 24),
            if (_loading)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              )
            else if (_complaint != null)
              _ComplaintResult(complaint: _complaint!),
            if (!_loading && _error == null && _complaint == null)
              Text(
                'Enter your complaint ID and click Track. Make sure you are logged in with the account that created the complaint.',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
              ),
          ],
        ],
      ),
    );
  }
}

class _ComplaintResult extends StatelessWidget {
  const _ComplaintResult({required this.complaint});
  final Map<String, dynamic> complaint;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final complaintId = complaint['complaintId'] as String? ?? '—';
    final status = complaint['status'] as String? ?? '';
    final priority = complaint['priority'] as String? ?? '';
    final description = complaint['description'] as String? ?? '';
    final category = complaint['category'] as String? ?? '';
    final projectLocation = complaint['projectLocation'] as String? ?? '';
    final media = (complaint['media'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final activeStep = _statusSteps.indexOf(status);
    final stepIndex = activeStep >= 0 ? activeStep : 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Text(complaintId, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                Chip(label: Text(status), padding: EdgeInsets.zero),
                Chip(label: Text(priority), padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
              ],
            ),
            const SizedBox(height: 8),
            Text(description, style: theme.textTheme.bodyMedium),
            Text(
              category.isNotEmpty ? '$category · $projectLocation' : projectLocation,
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
            if (media.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Attachments', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: media.map((m) {
                  final url = m['fileUrl'] as String? ?? '';
                  final type = m['fileType'] as String? ?? '';
                  final isImage = type.toLowerCase().startsWith('image/');
                  return SizedBox(
                    width: 160,
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: isImage
                          ? Image.network(url, height: 120, fit: BoxFit.cover)
                          : ListTile(
                              title: const Text('View file'),
                              onTap: () {},
                            ),
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              children: List.generate(_statusSteps.length, (i) {
                final done = stepIndex >= i;
                return Expanded(
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: done ? _stepColors[i] : theme.colorScheme.surfaceContainerHighest,
                        child: Text('${i + 1}', style: TextStyle(color: done ? Colors.white : theme.colorScheme.outline, fontSize: 12)),
                      ),
                      if (i < _statusSteps.length - 1) Expanded(child: Divider(color: stepIndex > i ? _stepColors[i] : theme.colorScheme.outline)),
                    ],
                  ),
                );
              }),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _statusSteps.asMap().entries.map((e) {
                final active = stepIndex == e.key;
                return Text(
                  e.value.replaceAll('_', ' '),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: active ? _stepColors[e.key] : theme.colorScheme.outline,
                    fontWeight: active ? FontWeight.bold : FontWeight.normal,
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
