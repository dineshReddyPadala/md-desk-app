import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../api/client.dart';
import '../utils/media_url.dart';

class DealerLocatorScreen extends StatefulWidget {
  const DealerLocatorScreen({super.key});

  @override
  State<DealerLocatorScreen> createState() => _DealerLocatorScreenState();
}

class _DealerLocatorScreenState extends State<DealerLocatorScreen> {
  String _city = '';
  List<Map<String, dynamic>>? _dealers;
  String? _error;

  Future<void> _load() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _error = null;
      _dealers = null;
    });
    try {
      final path = _city.trim().isEmpty ? '/dealers' : '/dealers?city=${Uri.encodeComponent(_city.trim())}';
      final res = await client.get(path);
      final list = (res['dealers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() => _dealers = list);
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _dealers = [];
      });
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final list = _dealers ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dealer Locator', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Find dealers by city', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6))),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Filter by city',
                    hintText: 'Enter city name',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (v) => setState(() => _city = v),
                ),
              ),
              const SizedBox(width: 12),
              FilledButton(
                onPressed: () => _load(),
                child: const Text('Search'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ),
          if (_dealers == null)
            const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Center(child: CircularProgressIndicator()))
          else
            ...list.map((d) {
              final name = d['name'] as String? ?? '—';
              final city = d['city'] as String?;
              final phone = d['phone'] as String?;
              final imageUrl = MediaUrl.resolve(MediaUrl.imageUrlFromMap(d), AuthProvider.baseUrl);
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (imageUrl != null && imageUrl.isNotEmpty)
                      Image.network(
                        imageUrl,
                        height: 140,
                        fit: BoxFit.cover,
                        headers: const {'Accept': 'image/*'},
                        loadingBuilder: (context, child, progress) {
                          if (progress == null) return child;
                          return SizedBox(
                            height: 140,
                            child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary)),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 140,
                          color: theme.colorScheme.surfaceContainerHighest,
                          alignment: Alignment.center,
                          child: Icon(Icons.broken_image_outlined, size: 48, color: theme.colorScheme.outline),
                        ),
                      )
                    else
                      Container(
                        height: 140,
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: Icon(Icons.store, size: 48, color: theme.colorScheme.outline),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                          if (city != null && city.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Row(
                                children: [
                                  Icon(Icons.location_on, size: 16, color: theme.colorScheme.outline),
                                  const SizedBox(width: 4),
                                  Text(city, style: theme.textTheme.bodySmall),
                                ],
                              ),
                            ),
                          if (phone != null && phone.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Row(
                                children: [
                                  Icon(Icons.phone, size: 16, color: theme.colorScheme.outline),
                                  const SizedBox(width: 4),
                                  Text(phone, style: theme.textTheme.bodySmall),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          if (_dealers != null && list.isEmpty)
            Center(child: Text('No dealers found.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline))),
        ],
      ),
    );
  }
}
