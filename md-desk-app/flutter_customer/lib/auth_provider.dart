import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api/client.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _loadToken();
  }
  static const _keyToken = 'md_desk_token';
  String? token;
  Map<String, dynamic>? user;

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString(_keyToken);
    if (token != null && token!.isNotEmpty) {
      _fetchUser();
    } else {
      notifyListeners();
    }
  }

  Future<void> _fetchUser() async {
    try {
      final client = ApiClient(baseUrl: _baseUrl, token: token);
      final res = await client.get('/auth/me');
      user = res['user'] as Map<String, dynamic>?;
    } catch (_) {
      user = null;
    }
    notifyListeners();
  }

  /// Refresh user from server (e.g. for profile). Call when token exists.
  Future<void> loadUser() async {
    if (token == null || token!.isEmpty) return;
    await _fetchUser();
  }

  Future<void> _saveToken(String t) async {
    token = t;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, t);
    notifyListeners();
  }

  Future<void> clearToken() async {
    token = null;
    user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    notifyListeners();
  }

  /// Login with email or phone. Pass the same string as web: email or phone number.
  Future<void> login(String emailOrPhone, String password) async {
    final client = ApiClient(baseUrl: _baseUrl);
    final body = emailOrPhone.contains('@')
        ? {'email': emailOrPhone, 'password': password}
        : {'phone': emailOrPhone, 'password': password};
    final res = await client.post('/auth/login', body);
    final t = res['token'] as String?;
    if (t == null) throw Exception('No token');
    await _saveToken(t);
    user = res['user'] as Map<String, dynamic>?;
  }

  /// Send OTP to email (step 1 of registration, aligned with web).
  Future<void> sendOtp(String email) async {
    final client = ApiClient(baseUrl: _baseUrl);
    await client.post('/auth/send-otp', {'email': email});
  }

  /// Register with OTP (step 2). Data must include name, email, otp, password, confirmPassword; optional phone, city.
  Future<void> register(Map<String, String> data) async {
    final client = ApiClient(baseUrl: _baseUrl);
    final res = await client.post('/auth/register', data);
    final t = res['token'] as String?;
    if (t == null) throw Exception('No token');
    await _saveToken(t);
    user = res['user'] as Map<String, dynamic>?;
  }

  static String get baseUrl => _baseUrl;
  static String get _baseUrl => 'http://localhost:3000/api/v1';

  /// Authenticated client for API calls from screens. Null if not logged in.
  ApiClient? get client =>
      token != null && token!.isNotEmpty ? ApiClient(baseUrl: _baseUrl, token: token) : null;
}
