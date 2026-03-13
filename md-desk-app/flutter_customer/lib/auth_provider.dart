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
    notifyListeners();
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

  Future<void> login(String email, String password) async {
    final client = ApiClient(baseUrl: _baseUrl);
    final res = await client.post('/auth/login', {'email': email, 'password': password});
    final t = res['token'] as String?;
    if (t == null) throw Exception('No token');
    await _saveToken(t);
    user = res['user'] as Map<String, dynamic>?;
  }

  Future<void> register(Map<String, String> data) async {
    final client = ApiClient(baseUrl: _baseUrl);
    final res = await client.post('/auth/register', data);
    final t = res['token'] as String?;
    if (t == null) throw Exception('No token');
    await _saveToken(t);
    user = res['user'] as Map<String, dynamic>?;
  }

  static String get _baseUrl => 'http://localhost:3000/api/v1';
}
