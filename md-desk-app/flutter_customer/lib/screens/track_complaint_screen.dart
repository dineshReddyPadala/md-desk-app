import 'package:flutter/material.dart';

class TrackComplaintScreen extends StatelessWidget {
  const TrackComplaintScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track Complaint')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Track complaint: call GET /complaints/track/:complaintId with Bearer token. Show status timeline (RECEIVED → UNDER_REVIEW → IN_PROGRESS → RESOLVED).',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
