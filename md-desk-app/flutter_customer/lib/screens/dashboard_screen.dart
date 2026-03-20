import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';

const _statusOrder = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
const _statusLabels = {
  'RECEIVED': 'Received',
  'UNDER_REVIEW': 'Under Review',
  'IN_PROGRESS': 'In Progress',
  'RESOLVED': 'Resolved',
};

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _activeProjects = [];
  Map<String, int> _complaintStats = {
    'RECEIVED': 0,
    'UNDER_REVIEW': 0,
    'IN_PROGRESS': 0,
    'RESOLVED': 0,
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadSummary());
  }

  Future<void> _loadSummary() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await client.get('/dashboard/customer-summary');
      final projects = (res['activeProjects'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final stats = res['complaintStats'] as Map<String, dynamic>?;
      final next = Map<String, int>.from(_complaintStats);
      if (stats != null) {
        for (final k in _statusOrder) {
          final v = stats[k];
          next[k] = v is int ? v : (v as num?)?.toInt() ?? 0;
        }
      }
      if (mounted) {
        setState(() {
          _activeProjects = projects;
          _complaintStats = next;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  int get _totalComplaints =>
      _complaintStats.values.fold(0, (a, b) => a + b);

  Color _statusChipColor(BuildContext context, String status) {
    final scheme = Theme.of(context).colorScheme;
    switch (status) {
      case 'RECEIVED':
        return scheme.tertiaryContainer;
      case 'UNDER_REVIEW':
        return scheme.primaryContainer;
      case 'IN_PROGRESS':
        return scheme.secondaryContainer;
      case 'RESOLVED':
        return scheme.primaryContainer.withValues(alpha: 0.5);
      default:
        return scheme.surfaceContainerHighest;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: _loadSummary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Dashboard', style: theme.textTheme.titleLarge),
          Text(
            'Overview of your projects, complaints, and shortcuts',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
          ),
          const SizedBox(height: 16),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
            ),
          // Active Projects (aligned with customer web)
          Card(
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Active Projects', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  if (_loading)
                    const SizedBox(height: 80, child: Center(child: CircularProgressIndicator()))
                  else if (_activeProjects.isEmpty)
                    Text('No active projects assigned to you.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline))
                  else
                    ..._activeProjects.take(5).map((p) {
                      final name = p['name'] as String? ?? 'Project';
                      final status = (p['status'] as String? ?? '').replaceAll('_', ' ');
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: Text(name, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500))),
                            Chip(
                              label: Text(status, style: const TextStyle(fontSize: 11)),
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              padding: EdgeInsets.zero,
                            ),
                          ],
                        ),
                      );
                    }),
                  if (!_loading && _activeProjects.length > 5)
                    Text('+${_activeProjects.length - 5} more', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () => context.go('/complaints'),
                    child: const Text('View complaints'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Complaint Status KPIs (aligned with customer web)
          Card(
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Complaint Status', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  if (_loading)
                    const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()))
                  else
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      childAspectRatio: 2.4,
                      children: _statusOrder.map((status) {
                        final label = _statusLabels[status] ?? status;
                        final count = _complaintStats[status] ?? 0;
                        return Material(
                          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    label,
                                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.75)),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Chip(
                                  label: Text('$count'),
                                  visualDensity: VisualDensity.compact,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  backgroundColor: _statusChipColor(context, status),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  if (!_loading) ...[
                    const SizedBox(height: 8),
                    Text('Total: $_totalComplaints complaint(s)', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                    const SizedBox(height: 8),
                    FilledButton(
                      onPressed: () => context.go('/complaints'),
                      child: const Text('My complaints'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('Shortcuts', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _Tile(
            title: 'Raise Complaint',
            subtitle: 'Submit a new complaint with photos',
            icon: Icons.report_problem,
            onTap: () => context.go('/raise-complaint'),
          ),
          _Tile(
            title: 'Track Complaint',
            subtitle: 'Check status with your complaint ID',
            icon: Icons.track_changes,
            onTap: () => context.go('/track'),
          ),
          _Tile(
            title: 'Message MD',
            subtitle: 'Send suggestions or feedback',
            icon: Icons.message,
            onTap: () => context.go('/message-md'),
          ),
          _Tile(
            title: 'Project chat',
            subtitle: 'Chat with your project team',
            icon: Icons.chat_bubble_outline,
            onTap: () => context.go('/chat'),
          ),
          _Tile(
            title: 'Products',
            subtitle: 'Product information',
            icon: Icons.inventory,
            onTap: () => context.go('/products'),
          ),
          _Tile(
            title: 'Dealer Locator',
            subtitle: 'Find dealers by city',
            icon: Icons.location_on,
            onTap: () => context.go('/dealers'),
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: theme.colorScheme.surface,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              children: [
                Icon(icon, color: theme.colorScheme.primary, size: 28),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
