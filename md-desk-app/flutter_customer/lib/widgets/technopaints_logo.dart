import 'package:flutter/material.dart';

/// Bundled TechnoPaints wordmark (same asset as customer web).
const String kTechnoPaintsLogoAsset = 'assets/images/TP-logo-1-1024x164-1.webp';

class TechnoPaintsLogo extends StatelessWidget {
  const TechnoPaintsLogo({
    super.key,
    this.height = 28,
    this.fit = BoxFit.contain,
    this.alignment = Alignment.center,
  });

  final double height;
  final BoxFit fit;
  final AlignmentGeometry alignment;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      kTechnoPaintsLogoAsset,
      height: height,
      fit: fit,
      alignment: alignment,
      semanticLabel: 'TechnoPaints',
      errorBuilder: (context, error, stackTrace) => Icon(
        Icons.image_not_supported_outlined,
        size: height * 0.85,
        color: Theme.of(context).colorScheme.outline,
      ),
    );
  }
}
