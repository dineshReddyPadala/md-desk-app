import 'package:flutter/material.dart';

class DealerLocatorScreen extends StatelessWidget {
  const DealerLocatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dealer Locator')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Dealer locator: GET /dealers?city= optional. Show list; map view can use location_lat, location_long with maps package.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
