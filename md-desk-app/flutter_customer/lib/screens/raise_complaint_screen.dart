import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../api/client.dart';

class RaiseComplaintScreen extends StatefulWidget {
  const RaiseComplaintScreen({super.key});

  @override
  State<RaiseComplaintScreen> createState() => _RaiseComplaintScreenState();
}

class _RaiseComplaintScreenState extends State<RaiseComplaintScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _projectLocationController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _category = 'PRODUCT';
  List<XFile> _pickedFiles = [];
  String? _error;
  bool _submitting = false;
  String? _successComplaintId;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _projectLocationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage();
    if (picked.isEmpty) return;
    if (mounted) setState(() => _pickedFiles = [..._pickedFiles, ...picked]);
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final projectLocation = _projectLocationController.text.trim();
    final description = _descriptionController.text.trim();
    if (name.isEmpty || projectLocation.isEmpty || description.isEmpty) {
      setState(() => _error = 'Please fill required fields: Name, Project location, Description.');
      return;
    }
    final client = context.read<AuthProvider>().client;
    if (client == null) return;
    setState(() {
      _error = null;
      _submitting = true;
    });

    try {
      final fields = <String, String>{
        'name': name,
        'phone': _phoneController.text.trim(),
        'city': _cityController.text.trim(),
        'project_location': projectLocation,
        'description': description,
        'category': _category,
      };
      List<http.MultipartFile>? files;
      if (_pickedFiles.isNotEmpty) {
        files = [];
        for (final x in _pickedFiles) {
          final bytes = await x.readAsBytes();
          final name = x.name;
          files.add(http.MultipartFile.fromBytes('photos', bytes, filename: name.isNotEmpty ? name : 'image.jpg'));
        }
      }
      final res = await client.postMultipart('/complaints', fields: fields, files: files);
      final complaintId = res['complaint_id'] as String?;
      if (mounted) setState(() {
        _submitting = false;
        _successComplaintId = complaintId;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_successComplaintId != null) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, size: 64, color: theme.colorScheme.primary),
                  const SizedBox(height: 16),
                  Text('Complaint submitted', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Your complaint ID: $_successComplaintId'),
                  Text('Use this ID to track your complaint.', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () => context.go('/track'),
                    child: const Text('Track Complaint'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Raise Complaint', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'Submit product or service issues. You will receive a unique ID to track status.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Your details', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                    const SizedBox(height: 12),
                    TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()), keyboardType: TextInputType.phone),
                    const SizedBox(height: 12),
                    TextField(controller: _cityController, decoration: const InputDecoration(labelText: 'City', border: OutlineInputBorder())),
                    const SizedBox(height: 24),
                    Text('Complaint details', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _projectLocationController,
                      decoration: const InputDecoration(labelText: 'Project location', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder(), alignLabelWithHint: true),
                      maxLines: 4,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _category,
                      decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'PRODUCT', child: Text('Product')),
                        DropdownMenuItem(value: 'SERVICE', child: Text('Service')),
                        DropdownMenuItem(value: 'DELIVERY', child: Text('Delivery')),
                        DropdownMenuItem(value: 'TECHNICAL', child: Text('Technical')),
                      ],
                      onChanged: (v) => setState(() => _category = v ?? 'PRODUCT'),
                    ),
                    const SizedBox(height: 24),
                    Text('Attachments', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _pickImages,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Choose files'),
                    ),
                    if (_pickedFiles.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text('${_pickedFiles.length} file(s) selected', style: theme.textTheme.bodySmall)),
                    const SizedBox(height: 24),
                    if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: TextStyle(color: theme.colorScheme.error))),
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: Text(_submitting ? 'Submitting…' : 'Submit Complaint'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
