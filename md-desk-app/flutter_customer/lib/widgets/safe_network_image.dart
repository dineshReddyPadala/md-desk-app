import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// Fetches image bytes with http (browser-like headers) then [Image.memory].
/// Helps on Android when [Image.network] fails for S3/CDN URLs.
class SafeNetworkImage extends StatefulWidget {
  const SafeNetworkImage({
    super.key,
    required this.url,
    this.fit,
    this.width,
    this.height,
    this.loadingColor,
  });

  final String url;
  final BoxFit? fit;
  final double? width;
  final double? height;
  final Color? loadingColor;

  @override
  State<SafeNetworkImage> createState() => _SafeNetworkImageState();
}

class _SafeNetworkImageState extends State<SafeNetworkImage> {
  Uint8List? _bytes;
  bool _loading = true;
  bool _failed = false;

  static const Map<String, String> _headers = {
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(SafeNetworkImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _failed = false;
      _bytes = null;
    });
    try {
      final uri = Uri.tryParse(widget.url);
      if (uri == null || !uri.hasScheme) throw FormatException('bad url');
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 45));
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw StateError('HTTP');
      }
      if (res.bodyBytes.isEmpty) throw StateError('empty');
      if (!mounted) return;
      setState(() {
        _bytes = res.bodyBytes;
        _loading = false;
      });
    } catch (e, st) {
      debugPrint('SafeNetworkImage: $e');
      debugPrint('$st');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
        _bytes = null;
      });
    }
  }

  Widget _errorBox(ThemeData theme) {
    return Container(
      width: widget.width,
      height: widget.height,
      color: theme.colorScheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Icon(Icons.broken_image_outlined, size: 40, color: theme.colorScheme.outline),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_loading) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: Center(
          child: SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: widget.loadingColor ?? theme.colorScheme.primary,
            ),
          ),
        ),
      );
    }
    if (_failed || _bytes == null) return _errorBox(theme);
    final bytes = _bytes!;
    final fit = widget.fit ?? BoxFit.cover;
    if (widget.width == null || widget.height == null) {
      return LayoutBuilder(
        builder: (context, c) {
          final w = widget.width ?? (c.maxWidth.isFinite ? c.maxWidth : null);
          final h = widget.height ?? (c.maxHeight.isFinite ? c.maxHeight : null);
          if (w != null && h != null && w.isFinite && h.isFinite) {
            return SizedBox(
              width: w,
              height: h,
              child: Image.memory(
                bytes,
                fit: fit,
                width: w,
                height: h,
                gaplessPlayback: true,
                errorBuilder: (_, __, ___) => _errorBox(theme),
              ),
            );
          }
          if (c.maxWidth.isFinite && c.maxHeight.isFinite) {
            return SizedBox(
              width: c.maxWidth,
              height: c.maxHeight,
              child: Image.memory(
                bytes,
                fit: fit,
                width: c.maxWidth,
                height: c.maxHeight,
                gaplessPlayback: true,
                errorBuilder: (_, __, ___) => _errorBox(theme),
              ),
            );
          }
          return Image.memory(
            bytes,
            fit: fit,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => _errorBox(theme),
          );
        },
      );
    }
    return Image.memory(
      bytes,
      fit: fit,
      width: widget.width,
      height: widget.height,
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) => _errorBox(theme),
    );
  }
}
