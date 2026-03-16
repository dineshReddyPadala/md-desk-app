import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

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
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'MD Desk',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in to raise complaints, track status, and message MD Desk.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.9),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    Material(
                      elevation: 0,
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(24),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: _LoginForm(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.go('/register'),
                      child: Text(
                        "Don't have an account? Register",
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
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

class _LoginForm extends StatefulWidget {
  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> {
  final _emailOrPhone = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _emailOrPhone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().login(
            _emailOrPhone.text.trim(),
            _password.text,
          );
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) {
        final msg = e.toString();
        setState(() {
          _error = msg.replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    } finally {
      if (mounted && _loading) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null) ...[
          Container(
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
          const SizedBox(height: 12),
        ],
        TextField(
          controller: _emailOrPhone,
          decoration: const InputDecoration(
            labelText: 'Email or phone',
            hintText: 'e.g. you@example.com or 9876543210',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          decoration: const InputDecoration(
            labelText: 'Password',
            border: OutlineInputBorder(),
          ),
          obscureText: true,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submit(),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _loading ? null : _submit,
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
          child: Text(_loading ? 'Signing in…' : 'Sign In'),
        ),
      ],
    );
  }
}
