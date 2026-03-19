import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  static const _gradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0097D7),
      Color(0xFF0080B8),
      Color(0xFFF37336),
    ],
    stops: [0.0, 0.5, 1.0],
  );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: _gradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Material(
                      elevation: 0,
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(24),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(Icons.person_add, size: 56, color: theme.colorScheme.primary),
                            const SizedBox(height: 8),
                            Text(
                              'Create account',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Enter your details and we\'ll send a verification code to your email.',
                              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            _RegisterForm(),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: Text(
                        'Already have an account? Sign In',
                        style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
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
  int _step = 1;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _otp = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _phone = TextEditingController();
  final _city = TextEditingController();
  final _company = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _otp.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _phone.dispose();
    _city.dispose();
    _company.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (_email.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your email');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().sendOtp(_email.text.trim());
      if (mounted) setState(() {
        _step = 2;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _register() async {
    if (_password.text != _confirmPassword.text) {
      setState(() => _error = 'Password and confirm password do not match');
      return;
    }
    if (_password.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    final otp = _otp.text.replaceAll(RegExp(r'\D'), '').padRight(6).substring(0, 6);
    if (otp.length != 6) {
      setState(() => _error = 'Please enter the 6-digit OTP from your email');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().register({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'otp': otp,
        'password': _password.text,
        'confirmPassword': _confirmPassword.text,
        if (_company.text.trim().isNotEmpty) 'company': _company.text.trim(),
        if (_phone.text.trim().isNotEmpty) 'phone': _phone.text.trim(),
        if (_city.text.trim().isNotEmpty) 'city': _city.text.trim(),
      });
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    } finally {
      if (mounted && _loading) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_step == 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_error != null) _errorBox(context),
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _company,
            decoration: const InputDecoration(
              labelText: 'Company',
              hintText: 'Optional',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _sendOtp(),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _sendOtp,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: Text(_loading ? 'Sending…' : 'Send OTP'),
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null) _errorBox(context),
        TextField(
          controller: _name,
          decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _email,
          decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
          enabled: false,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _company,
          decoration: const InputDecoration(labelText: 'Company', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _otp,
          decoration: const InputDecoration(
            labelText: 'OTP (6 digits)',
            hintText: 'Enter code from email',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.number,
          maxLength: 6,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
          obscureText: true,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirmPassword,
          decoration: const InputDecoration(labelText: 'Confirm password', border: OutlineInputBorder()),
          obscureText: true,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phone,
          decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _city,
          decoration: const InputDecoration(labelText: 'City', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _loading ? null : _register,
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
          child: Text(_loading ? 'Creating account…' : 'Register'),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => setState(() {
            _step = 1;
            _otp.clear();
            _error = null;
          }),
          child: const Text('Change email'),
        ),
      ],
    );
  }

  Widget _errorBox(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.errorContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          _error!,
          style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
        ),
      ),
    );
  }
}
