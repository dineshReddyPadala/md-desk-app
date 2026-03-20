import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class SafeNetworkImage extends StatefulWidget {
  const SafeNetworkImage({
    super.key,
    required this.url,
    this.fit,
    this.width,
    this.height,
    this.alignment = Alignment.center,
    this.loadingColor,
  });

  final String url;
  final BoxFit? fit;
  final double? width;
  final double? height;
  final Alignment alignment;
  final Color? loadingColor;

  @override
  State<SafeNetworkImage> createState() => _SafeNetworkImageState();
}

class _SafeNetworkImageState extends State<SafeNetworkImage> {
  Uint8List? _bytes;
  bool _loading = true;
  bool _failed = false;

  static const Map<String, String> _h = {
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
      final res = await http.get(uri, headers: _h).timeout(const Duration(seconds: 45));
      if (res.statusCode < 200 || res.statusCode >= 300) throw Exception('HTTP ${res.statusCode}');
      if (res.bodyBytes.isEmpty) throw Exception('empty');
      if (!mounted) return;
      setState(() {
        _bytes = res.bodyBytes;
        _loading = false;
      });
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('SafeNetworkImage ${widget.url} $e');
        debugPrint('$st');
      }
      if (!mounted) return;
      setState(() {
        _loading = false;
        _failed = true;
        _bytes = null;
      });
    }
  }

  Widget _err(ThemeData t) {
    return Container(
      width: widget.width,
      height: widget.height,
      color: t.colorScheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Icon(Icons.broken_image_outlined, size: 40, color: t.colorScheme.outline),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
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
              color: widget.loadingColor ?? t.colorScheme.primary,
            ),
          ),
        ),
      );
    }
    if (_failed || _bytes == null) return _err(t);
    final bytes = _bytes!;
    final fit = widget.fit ?? BoxFit.cover;
    if (widget.width == null && widget.height == null) {
      return LayoutBuilder(
        builder: (context, c) {
          if (c.maxHeight.isFinite && c.maxWidth.isFinite) {
            return SizedBox(
              width: c.maxWidth,
              height: c.maxHeight,
              child: Image.memory(
                bytes,
                fit: fit,
                width: c.maxWidth,
                height: c.maxHeight,
                alignment: widget.alignment,
                gaplessPlayback: true,
                errorBuilder: (_, __, ___) => _err(t),
              ),
            );
          }
          return Image.memory(
            bytes,
            fit: fit,
            alignment: widget.alignment,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => _err(t),
          );
        },
      );
    }
    return Image.memory(
      bytes,
      fit: fit,
      width: widget.width,
      height: widget.height,
      alignment: widget.alignment,
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) => _err(t),
    );
  }
}
