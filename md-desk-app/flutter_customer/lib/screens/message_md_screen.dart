import 'package:flutter/material.dart';

class MessageMDScreen extends StatelessWidget {
  const MessageMDScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Message MD')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Message MD: POST /messages with subject and message. Use AuthProvider.token.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
