import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../auth_provider.dart';
import '../api/client.dart';

const _statusSteps = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const _stepColors = [
  Color(0xFF0097D7),
  Color(0xFFF37336),
  Color(0xFFFFB74D),
  Color(0xFF2E7D32),
];

String _formatDateTime(String iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return iso;
  }
}

String _attachmentLabel(String url) {
  try {
    final uri = Uri.parse(url);
    final segment = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : 'Attachment';
    return Uri.decodeComponent(segment);
  } catch (_) {
    final parts = url.split('/');
    return Uri.decodeComponent(parts.isNotEmpty ? parts.last : 'Attachment');
  }
}

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
    final trimmed = _complaintIdController.text.trim();
    final resultsMatchInput = trimmed == _searchId;
    final showResults = _searchId.isNotEmpty && resultsMatchInput;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                tooltip: 'Back',
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/dashboard');
                  }
                },
              ),
              TextButton(
                onPressed: () => context.go('/dashboard'),
                child: const Text('Dashboard'),
              ),
            ],
          ),
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
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      SizedBox(
                        width: 280,
                        child: TextField(
                          controller: _complaintIdController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. MD-20250313-XXXX',
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (_) => _track(),
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                      FilledButton(
                        onPressed: _loading ? null : _track,
                        child: Text(_loading ? 'Searching…' : 'Track'),
                      ),
                      if (_searchId.isNotEmpty || _complaintIdController.text.trim().isNotEmpty)
                        TextButton(
                          onPressed: _loading
                              ? null
                              : () {
                                  setState(() {
                                    _complaintIdController.clear();
                                    _searchId = '';
                                    _complaint = null;
                                    _error = null;
                                  });
                                },
                          child: const Text('Clear'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (showResults) ...[
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

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

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
    final createdAt = complaint['createdAt'] as String? ?? '';
    final activity = [
      ...((complaint['adminResponses'] as List?)?.cast<Map<String, dynamic>>() ?? []),
      {
        'id': 'created-${complaint['id'] ?? complaintId}',
        'message': 'Complaint submitted.',
        'createdBy': 'Customer',
        'createdAt': createdAt,
      },
    ]..sort((a, b) {
        final aTime = DateTime.tryParse(a['createdAt'] as String? ?? '')?.millisecondsSinceEpoch ?? 0;
        final bTime = DateTime.tryParse(b['createdAt'] as String? ?? '')?.millisecondsSinceEpoch ?? 0;
        return aTime.compareTo(bTime);
      });
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
                  final label = _attachmentLabel(url);
                  return SizedBox(
                    width: 160,
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: isImage
                          ? InkWell(
                              onTap: () => _openUrl(url),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Image.network(url, height: 120, fit: BoxFit.cover),
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: Text(label, style: theme.textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                            )
                          : ListTile(
                              title: Text(label, maxLines: 2, overflow: TextOverflow.ellipsis),
                              onTap: () => _openUrl(url),
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
            Row(
              children: _statusSteps.asMap().entries.map((e) {
                final active = stepIndex == e.key;
                return Expanded(
                  child: Text(
                    e.value.replaceAll('_', ' '),
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: active ? _stepColors[e.key] : theme.colorScheme.outline,
                      fontWeight: active ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                );
              }).toList(),
            ),
            if (activity.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Activity', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              ...activity.map((item) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['message'] as String? ?? '', style: theme.textTheme.bodyMedium),
                          const SizedBox(height: 6),
                          Text(
                            item['createdBy'] as String? ?? '',
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                          ),
                          Text(
                            _formatDateTime(item['createdAt'] as String? ?? ''),
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
