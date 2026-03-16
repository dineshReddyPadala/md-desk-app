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
