import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';

/// Shell layout aligned with web: AppBar + Drawer with same nav items.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  static const _navItems = [
    (path: '/dashboard', label: 'Dashboard', icon: Icons.dashboard),
    (path: '/raise-complaint', label: 'Raise Complaint', icon: Icons.report_problem),
    (path: '/track', label: 'Track Complaint', icon: Icons.track_changes),
    (path: '/message-md', label: 'Message MD', icon: Icons.message),
    (path: '/products', label: 'Products', icon: Icons.inventory),
    (path: '/dealers', label: 'Dealer Locator', icon: Icons.location_on),
  ];

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
            const DrawerHeader(
              decoration: BoxDecoration(color: Color(0xFF0097D7)),
              child: Text('MD Desk', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
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
      body: child,
    );
  }
}
