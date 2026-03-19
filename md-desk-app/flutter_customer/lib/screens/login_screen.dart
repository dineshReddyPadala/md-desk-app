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

enum _LoginMode { password, otp }

class _LoginForm extends StatefulWidget {
  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> {
  _LoginMode _mode = _LoginMode.password;
  final _emailOrPhone = TextEditingController();
  final _password = TextEditingController();
  final _otpEmail = TextEditingController();
  final _otp = TextEditingController();
  String? _error;
  bool _loading = false;
  bool _otpSent = false;
  bool _sendingOtp = false;

  @override
  void dispose() {
    _emailOrPhone.dispose();
    _password.dispose();
    _otpEmail.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _switchMode(_LoginMode mode) {
    setState(() {
      _mode = mode;
      _error = null;
      _otpSent = false;
      _otp.clear();
    });
  }

  Future<void> _submitPassword() async {
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

  Future<void> _sendLoginOtp() async {
    if (_otpEmail.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your email');
      return;
    }
    setState(() {
      _error = null;
      _sendingOtp = true;
    });
    try {
      await context.read<AuthProvider>().sendLoginOtp(_otpEmail.text.trim());
      if (mounted) setState(() {
        _otpSent = true;
        _sendingOtp = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _sendingOtp = false;
      });
    }
  }

  Future<void> _submitOtp() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().loginWithOtp(
            _otpEmail.text.trim(),
            _otp.text.replaceAll(RegExp(r'\D'), '').padRight(6).substring(0, 6),
          );
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: SegmentedButton<_LoginMode>(
                segments: const [
                  ButtonSegment(value: _LoginMode.password, label: Text('Password')),
                  ButtonSegment(value: _LoginMode.otp, label: Text('Email OTP')),
                ],
                selected: {_mode},
                onSelectionChanged: (s) => _switchMode(s.first),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _error!,
              style: TextStyle(color: theme.colorScheme.onErrorContainer),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (_mode == _LoginMode.password) ...[
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
            onSubmitted: (_) => _submitPassword(),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => context.go('/forgot-password'),
              child: Text(
                'Forgot password?',
                style: TextStyle(color: theme.colorScheme.primary, fontSize: 12),
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _submitPassword,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: Text(_loading ? 'Signing in…' : 'Sign In'),
          ),
        ] else ...[
          if (!_otpSent) ...[
            TextField(
              controller: _otpEmail,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'you@example.com',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _sendLoginOtp(),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _sendingOtp ? null : _sendLoginOtp,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: Text(_sendingOtp ? 'Sending…' : 'Send OTP to email'),
            ),
            const SizedBox(height: 8),
            Text(
              'Phone OTP (SMS) coming soon.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ] else ...[
            TextField(
              controller: _otpEmail,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              enabled: false,
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
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submitOtp(),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _submitOtp,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: Text(_loading ? 'Verifying…' : 'Verify & Sign In'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => setState(() {
                _otpSent = false;
                _otp.clear();
                _error = null;
              }),
              child: const Text('Use a different email'),
            ),
          ],
        ],
      ],
    );
  }
}
