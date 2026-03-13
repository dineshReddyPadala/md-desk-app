import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('MD Desk - Register', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                _RegisterForm(),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Already have an account? Sign In'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RegisterForm extends StatefulWidget {
  @override
  State<_RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends State<_RegisterForm> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _city = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().register({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        if (_phone.text.trim().isNotEmpty) 'phone': _phone.text.trim(),
        if (_city.text.trim().isNotEmpty) 'city': _city.text.trim(),
      });
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_error != null) ...[
          Text(_error!, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 8),
        ],
        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
        TextField(controller: _password, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
        TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
        TextField(controller: _city, decoration: const InputDecoration(labelText: 'City')),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _loading ? null : _submit,
          child: Text(_loading ? 'Registering...' : 'Register'),
        ),
      ],
    );
  }
}
