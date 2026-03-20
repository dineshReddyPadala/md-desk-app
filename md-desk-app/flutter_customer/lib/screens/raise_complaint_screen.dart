import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../api/client.dart';

/// Allowed extensions for complaint attachments (aligned with server `media` scope).
const _mediaExtensions = <String>[
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'mp4',
  'avi',
  'mov',
  'mkv',
  'webm',
  'mp3',
  'wav',
  'aac',
  'ogg',
  'zip',
];

const _attachmentsHelp =
    'PDF, Word, Excel, PowerPoint, TXT, CSV, images, video, audio, ZIP. Invalid types show an error here.';

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
  String? _selectedProjectId;
  List<Map<String, dynamic>> _activeProjects = [];
  bool _loadingProjects = true;
  List<PlatformFile> _pickedFiles = [];
  String? _error;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadActiveProjects());
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _projectLocationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadActiveProjects() async {
    final client = context.read<AuthProvider>().client;
    if (client == null) {
      if (mounted) setState(() => _loadingProjects = false);
      return;
    }
    try {
      final res = await client.get('/dashboard/customer-summary');
      final list = (res['activeProjects'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (mounted) {
        setState(() {
          _activeProjects = list;
          _loadingProjects = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingProjects = false);
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: _mediaExtensions,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    for (final f in result.files) {
      final ext = (f.extension ?? '').toLowerCase();
      if (!_mediaExtensions.contains(ext)) {
        if (mounted) {
          setState(() {
            _error =
                '“${f.name}” is not allowed. $_attachmentsHelp';
          });
        }
        return;
      }
    }
    if (mounted) {
      setState(() {
        _error = null;
        _pickedFiles = result.files;
      });
    }
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final description = _descriptionController.text.trim();
    if (name.isEmpty || description.isEmpty) {
      setState(() => _error = 'Please fill required fields: Name, Description.');
      return;
    }

    String projectLocation;
    String? projectId;
    if (_activeProjects.isNotEmpty) {
      if (_selectedProjectId == null || _selectedProjectId!.isEmpty) {
        setState(() => _error = 'Please select the project this complaint relates to.');
        return;
      }
      Map<String, dynamic>? proj;
      for (final p in _activeProjects) {
        if (p['id'] == _selectedProjectId) {
          proj = p;
          break;
        }
      }
      if (proj == null) {
        setState(() => _error = 'Invalid project selection.');
        return;
      }
      projectLocation = proj['name'] as String? ?? _projectLocationController.text.trim();
      projectId = _selectedProjectId;
    } else {
      projectLocation = _projectLocationController.text.trim();
      if (projectLocation.isEmpty) {
        setState(() => _error = 'Please enter project location (no active projects on file).');
        return;
      }
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
      if (projectId != null && projectId.isNotEmpty) {
        fields['project_id'] = projectId;
      }
      List<http.MultipartFile>? files;
      if (_pickedFiles.isNotEmpty) {
        files = [];
        for (final f in _pickedFiles) {
          final bytes = f.bytes;
          if (bytes == null) {
            if (mounted) {
              setState(() {
                _error = 'Could not read “${f.name}”. Try a smaller file or pick again.';
                _submitting = false;
              });
            }
            return;
          }
          final fname = f.name.isNotEmpty ? f.name : 'attachment';
          files.add(http.MultipartFile.fromBytes('photos', bytes, filename: fname));
        }
      }
      await client.postMultipart('/complaints', fields: fields, files: files);
      if (mounted) context.go('/complaints');
      return;
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

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Raise Complaint', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'You will receive a unique ID to track status.',
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
                    if (_loadingProjects)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))),
                      )
                    else if (_activeProjects.isNotEmpty)
                      DropdownButtonFormField<String>(
                        value: _selectedProjectId,
                        decoration: const InputDecoration(
                          labelText: 'Project *',
                          border: OutlineInputBorder(),
                          helperText: 'Select the project so your team can route the complaint correctly.',
                        ),
                        items: [
                          for (final p in _activeProjects)
                            if (p['id'] is String)
                              DropdownMenuItem<String>(
                                value: p['id'] as String,
                                child: Text(p['name'] as String? ?? '—'),
                              ),
                        ],
                        onChanged: (v) => setState(() => _selectedProjectId = v),
                      )
                    else
                      TextField(
                        controller: _projectLocationController,
                        decoration: const InputDecoration(
                          labelText: 'Project location *',
                          border: OutlineInputBorder(),
                          helperText: 'No active projects on file — describe the site or location.',
                        ),
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
                      onPressed: _pickFiles,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Choose files'),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(_attachmentsHelp, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
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
