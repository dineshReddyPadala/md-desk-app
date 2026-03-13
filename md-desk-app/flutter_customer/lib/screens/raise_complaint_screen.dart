import 'package:flutter/material.dart';

class RaiseComplaintScreen extends StatelessWidget {
  const RaiseComplaintScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Raise Complaint')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Raise complaint form: integrate with API using AuthProvider.token and multipart upload for photos. '
            'Fields: product_used, project_location, description, priority, photos.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
