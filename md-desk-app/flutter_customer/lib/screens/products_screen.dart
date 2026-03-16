import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth_provider.dart';
import '../api/client.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Map<String, dynamic>>? _products;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _error = null;
      _products = null;
    });
    try {
      final res = await client.get('/products');
      final list = (res['products'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) setState(() => _products = list);
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _products = [];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final list = _products ?? [];
    final filtered = _search.trim().isEmpty
        ? list
        : list.where((p) {
            final q = _search.trim().toLowerCase();
            final name = (p['name'] as String? ?? '').toLowerCase();
            final desc = (p['description'] as String? ?? '').toLowerCase();
            return name.contains(q) || desc.contains(q);
          }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Products', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Browse our product range', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6))),
          const SizedBox(height: 16),
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search by name or description…',
              border: OutlineInputBorder(),
            ),
            onChanged: (v) => setState(() => _search = v),
          ),
          const SizedBox(height: 16),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
            ),
          if (_products == null)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final crossAxisCount = constraints.maxWidth > 600 ? 3 : (constraints.maxWidth > 400 ? 2 : 1);
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    childAspectRatio: 0.85,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) {
                    final p = filtered[i];
                    final name = p['name'] as String? ?? '—';
                    final desc = p['description'] as String? ?? '—';
                    final imageUrl = p['imageUrl'] as String?;
                    return Card(
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (imageUrl != null && imageUrl.isNotEmpty)
                            Image.network(imageUrl, height: 160, fit: BoxFit.cover)
                          else
                            Container(
                              height: 160,
                              color: theme.colorScheme.surfaceContainerHighest,
                              child: Icon(Icons.image, size: 64, color: theme.colorScheme.outline),
                            ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(desc, style: theme.textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          if (_products != null && filtered.isEmpty)
            Center(child: Text('No products available.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline))),
        ],
      ),
    );
  }
}
