import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../api/client.dart';

class MyComplaintsScreen extends StatefulWidget {
  const MyComplaintsScreen({super.key});

  @override
  State<MyComplaintsScreen> createState() => _MyComplaintsScreenState();
}

class _MyComplaintsScreenState extends State<MyComplaintsScreen> {
  List<Map<String, dynamic>> _items = [];
  int _total = 0;
  int _page = 1;
  int _limit = 10;
  String? _statusFilter;
  DateTime? _fromDate;
  DateTime? _toDate;
  bool _loading = true;
  String? _error;

  String? get _fromDateValue => _fromDate?.toIso8601String().split('T').first;
  String? get _toDateValue => _toDate?.toIso8601String().split('T').first;

  Future<void> _load() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = <String, String>{
        'page': _page.toString(),
        'limit': _limit.toString(),
        if (_statusFilter != null && _statusFilter!.isNotEmpty) 'status': _statusFilter!,
        if (_fromDateValue != null) 'fromDate': _fromDateValue!,
        if (_toDateValue != null) 'toDate': _toDateValue!,
      };
      final qs = query.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
      final res = await client.get('/complaints/my?$qs');
      final list = (res['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final total = (res['total'] as num?)?.toInt() ?? 0;
      if (mounted) setState(() {
        _items = list;
        _total = total;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _pickDate({required bool isFromDate}) async {
    final initialDate = isFromDate
        ? (_fromDate ?? DateTime.now())
        : (_toDate ?? _fromDate ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isFromDate) {
        _fromDate = picked;
        if (_toDate != null && picked.isAfter(_toDate!)) {
          _toDate = picked;
        }
      } else {
        _toDate = picked;
        if (_fromDate != null && picked.isBefore(_fromDate!)) {
          _fromDate = picked;
        }
      }
      _page = 1;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final role = context.watch<AuthProvider>().user?['role'] as String?;
    final isEmployee = role == 'EMPLOYEE';

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isEmployee ? 'Assigned Complaints' : 'My Complaints',
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isEmployee
                        ? 'View complaints assigned to your projects.'
                        : 'View your complaints and raise a new one.',
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  SizedBox(
                    width: 240,
                    child: DropdownButtonFormField<String>(
                      value: _statusFilter ?? '',
                      decoration: const InputDecoration(
                        labelText: 'Status',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: '', child: Text('All')),
                        DropdownMenuItem(value: 'RECEIVED', child: Text('Received')),
                        DropdownMenuItem(value: 'UNDER_REVIEW', child: Text('Under Review')),
                        DropdownMenuItem(value: 'IN_PROGRESS', child: Text('In Progress')),
                        DropdownMenuItem(value: 'RESOLVED', child: Text('Resolved')),
                      ],
                      onChanged: (v) {
                        setState(() {
                          _statusFilter = (v == null || v.isEmpty) ? null : v;
                          _page = 1;
                        });
                        _load();
                      },
                    ),
                  ),
                  SizedBox(
                    width: 180,
                    child: OutlinedButton(
                      onPressed: () => _pickDate(isFromDate: true),
                      child: Text(_fromDateValue == null ? 'From date' : 'From: $_fromDateValue'),
                    ),
                  ),
                  SizedBox(
                    width: 180,
                    child: OutlinedButton(
                      onPressed: () => _pickDate(isFromDate: false),
                      child: Text(_toDateValue == null ? 'To date' : 'To: $_toDateValue'),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _statusFilter = null;
                        _fromDate = null;
                        _toDate = null;
                        _page = 1;
                      });
                      _load();
                    },
                    child: const Text('Clear filters'),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    children: [
                      Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                      const SizedBox(height: 16),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                ),
              ),
            )
          else if (_items.isEmpty)
            SliverFillRemaining(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'No complaints yet.',
                        style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                      ),
                      if (!isEmployee) ...[
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => context.go('/raise-complaint'),
                          icon: const Icon(Icons.add),
                          label: const Text('Raise a complaint'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = _items[index];
                    final id = item['complaintId'] as String? ?? '';
                    final status = item['status'] as String? ?? '';
                    final category = item['category'] as String? ?? '—';
                    final createdAt = item['createdAt'] as String?;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title: Text(id, style: const TextStyle(fontFamily: 'monospace')),
                        subtitle: Text('$category · ${status.replaceAll('_', ' ')}${createdAt != null ? ' · ${DateTime.tryParse(createdAt)?.toIso8601String().split('T').first ?? ''}' : ''}'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.go('/track?complaintId=${Uri.encodeComponent(id)}'),
                      ),
                    );
                  },
                  childCount: _items.length,
                ),
              ),
            ),
          if (!_loading && _total > _limit)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      onPressed: _page > 1 ? () { setState(() => _page--); _load(); } : null,
                      icon: const Icon(Icons.chevron_left),
                    ),
                    Text('$_page / ${(_total / _limit).ceil()}'),
                    IconButton(
                      onPressed: _page < (_total / _limit).ceil() ? () { setState(() => _page++); _load(); } : null,
                      icon: const Icon(Icons.chevron_right),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: isEmployee
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.go('/raise-complaint'),
              icon: const Icon(Icons.add),
              label: const Text('New complaint'),
            ),
    );
  }
}
