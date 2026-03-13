import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({required this.baseUrl, this.token});
  final String baseUrl;
  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> get(String path) async {
    final r = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    return _handleResponse(r);
  }

  Future<Map<String, dynamic>> post(String path, [Map<String, dynamic>? body]) async {
    final r = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(r);
  }

  static Map<String, dynamic> _handleResponse(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) {
      return r.body.isEmpty ? {} : jsonDecode(r.body) as Map<String, dynamic>;
    }
    final msg = r.body.isNotEmpty ? (jsonDecode(r.body) as Map?)?['message'] ?? r.body : r.reasonPhrase;
    throw ApiException(r.statusCode, msg?.toString() ?? 'Request failed');
  }
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.message);
  final int statusCode;
  final String message;
}
