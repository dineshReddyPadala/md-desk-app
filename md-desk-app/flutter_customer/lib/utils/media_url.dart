/// Align with server / web: 5 MB max per file.
const int kMaxUploadBytes = 5 * 1024 * 1024;

class MediaUrl {
  /// API may return camelCase or snake_case.
  static String? imageUrlFromMap(Map<String, dynamic> m) {
    final v = m['imageUrl'] ?? m['image_url'];
    if (v is String && v.trim().isNotEmpty) return v.trim();
    return null;
  }

  /// Turn relative paths into absolute URLs using the API host.
  static String? resolve(String? raw, String apiBaseUrl) {
    if (raw == null || raw.isEmpty) return null;
    final t = raw.trim();
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('//')) return 'https:$t';
    final base = Uri.parse(apiBaseUrl);
    final origin = '${base.scheme}://${base.authority}';
    if (t.startsWith('/')) return '$origin$t';
    return t;
  }
}
