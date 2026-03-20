import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../api/client.dart';
import 'technopaints_logo.dart';

/// Shell layout aligned with web: AppBar + Drawer + Profile + Notifications.
class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _unreadCount = 0;

  static const _navItems = [
    (path: '/dashboard', label: 'Dashboard', icon: Icons.dashboard),
    (path: '/complaints', label: 'Complaints', icon: Icons.report_problem),
    (path: '/track', label: 'Track Complaint', icon: Icons.track_changes),
    (path: '/message-md', label: 'Message MD', icon: Icons.message),
    (path: '/chat', label: 'Project chat', icon: Icons.chat_bubble_outline),
    (path: '/products', label: 'Products', icon: Icons.inventory),
    (path: '/dealers', label: 'Dealer Locator', icon: Icons.location_on),
  ];

  Future<void> _refreshUnreadCount() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    try {
      final res = await client.get('/notifications/unread-count');
      final count = (res['count'] as num?)?.toInt() ?? 0;
      if (mounted) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshUnreadCount());
  }

  void _openNotifications() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    List<Map<String, dynamic>> items = [];
    try {
      final res = await client.get('/notifications?limit=10');
      items = (res['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    } catch (_) {}
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (ctx, scrollController) => CustomScrollView(
          controller: scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Notifications', style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    if (_unreadCount > 0)
                      TextButton(
                        onPressed: () async {
                          try {
                            await client.post('/notifications/mark-all-read', <String, dynamic>{});
                            await _refreshUnreadCount();
                            if (mounted) Navigator.of(ctx).pop();
                          } catch (_) {}
                        },
                        child: const Text('Mark all read'),
                      ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: Divider(height: 1)),
            if (items.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(child: Text('No notifications', style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: Theme.of(ctx).colorScheme.outline))),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final n = items[i];
                    final title = n['title'] as String? ?? '';
                    final body = n['body'] as String?;
                    final readAt = n['readAt'];
                    final createdAt = n['createdAt'] as String?;
                    final id = n['id'] as String?;
                    return ListTile(
                      title: Text(title, style: TextStyle(fontWeight: readAt == null ? FontWeight.w600 : FontWeight.normal)),
                      subtitle: body != null && body.isNotEmpty ? Text(body, maxLines: 2, overflow: TextOverflow.ellipsis) : null,
                      trailing: createdAt != null ? Text(_formatDate(createdAt), style: Theme.of(ctx).textTheme.bodySmall) : null,
                      tileColor: readAt == null ? Theme.of(ctx).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5) : null,
                      onTap: id != null && readAt == null
                          ? () async {
                              try {
                                await client.patch('/notifications/$id/read');
                                _refreshUnreadCount();
                              } catch (_) {}
                            }
                          : null,
                    );
                  },
                  childCount: items.length,
                ),
              ),
          ],
        ),
      ),
    ).whenComplete(_refreshUnreadCount);
  }

  void _openProfile() async {
    await context.read<AuthProvider>().loadUser();
    if (!mounted) return;
    final user = context.read<AuthProvider>().user;
    final name = user?['name'] as String? ?? '—';
    final email = user?['email'] as String? ?? '—';
    final phone = user?['phone'] as String?;
    final city = user?['city'] as String?;
    final company = user?['company'] as String?;
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Profile', style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Text(name, style: Theme.of(ctx).textTheme.titleMedium),
              Text(email, style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: Theme.of(ctx).colorScheme.outline)),
              if (company != null && company.toString().isNotEmpty) Text(company.toString(), style: Theme.of(ctx).textTheme.bodyMedium),
              if (phone != null && phone.toString().isNotEmpty) Text(phone.toString(), style: Theme.of(ctx).textTheme.bodyMedium),
              if (city != null && city.toString().isNotEmpty) Text(city.toString(), style: Theme.of(ctx).textTheme.bodyMedium),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () async {
                  Navigator.of(ctx).pop();
                  await context.read<AuthProvider>().clearToken();
                  if (mounted) context.go('/login');
                },
                child: const Text('Logout'),
              ),
            ],
          ),
        ),
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

  @override
  Widget build(BuildContext context) {
    final token = context.watch<AuthProvider>().token;
    if (token == null || token.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/login');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('MD Desk'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 2),
            child: SizedBox(
              height: 26,
              width: 108,
              child: FittedBox(
                fit: BoxFit.contain,
                alignment: Alignment.centerRight,
                child: TechnoPaintsLogo(height: 26, alignment: Alignment.centerRight),
              ),
            ),
          ),
          IconButton(
            icon: Badge(
              label: Text(_unreadCount > 0 ? '$_unreadCount' : ''),
              isLabelVisible: _unreadCount > 0,
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: _openNotifications,
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: _openProfile,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await context.read<AuthProvider>().clearToken();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFF0097D7)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset(
                    kTechnoPaintsLogoAsset,
                    height: 36,
                    fit: BoxFit.contain,
                    alignment: Alignment.centerLeft,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                  const SizedBox(height: 8),
                  const Text('MD Desk', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ..._navItems.map((e) {
              return ListTile(
                leading: Icon(e.icon),
                title: Text(e.label),
                onTap: () {
                  Navigator.of(context).pop();
                  context.go(e.path);
                },
              );
            }),
          ],
        ),
      ),
      body: widget.child,
    );
  }
}
