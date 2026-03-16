import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Dashboard', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
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
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
