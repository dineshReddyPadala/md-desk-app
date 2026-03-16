import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';
import 'widgets/app_shell.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/raise_complaint_screen.dart';
import 'screens/track_complaint_screen.dart';
import 'screens/message_md_screen.dart';
import 'screens/products_screen.dart';
import 'screens/dealer_locator_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const MdDeskApp(),
    ),
  );
}

class MdDeskApp extends StatelessWidget {
  const MdDeskApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MD Desk',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0097D7))
            .copyWith(secondary: const Color(0xFFF37336)),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    ShellRoute(
      builder: (_, __, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          redirect: (_, __) => '/dashboard',
          routes: [
            GoRoute(path: 'dashboard', builder: (_, __) => const DashboardScreen()),
            GoRoute(path: 'raise-complaint', builder: (_, __) => const RaiseComplaintScreen()),
            GoRoute(path: 'track', builder: (_, __) => const TrackComplaintScreen()),
            GoRoute(path: 'message-md', builder: (_, __) => const MessageMDScreen()),
            GoRoute(path: 'products', builder: (_, __) => const ProductsScreen()),
            GoRoute(path: 'dealers', builder: (_, __) => const DealerLocatorScreen()),
          ],
        ),
      ],
    ),
  ],
);
