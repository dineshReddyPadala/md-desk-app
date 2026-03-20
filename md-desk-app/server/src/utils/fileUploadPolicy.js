/**
 * Upload scopes:
 * - `media` — documents, images, video, audio, zip (complaints, projects; use same for chat when added)
 * - `image` — images only (product & dealer photos)
 */

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const FULL_MEDIA_MIMES = new Set([
  ...IMAGE_MIMES,
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
  // Video
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'multipart/x-zip',
]);

/** Lowercase extension (no dot) → canonical MIME for storage */
const EXT_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  zip: 'application/zip',
};

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/csv': 'csv',
  'text/comma-separated-values': 'csv',
  'video/mp4': 'mp4',
  'video/x-msvideo': 'avi',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'multipart/x-zip': 'zip',
};

const MSG_IMAGE_ONLY =
  'Invalid file type for this upload. Only images are allowed: JPEG (.jpg, .jpeg), PNG (.png), GIF (.gif), WebP (.webp), SVG (.svg).';

const MSG_FULL_MEDIA =
  'Invalid file type. Allowed: Documents — PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), TXT, CSV; ' +
  'Images — JPEG, PNG, GIF, WebP, SVG; Videos — MP4, AVI, MOV, MKV, WebM; Audio — MP3, WAV, AAC, OGG; ZIP archives.';

function getExtensionFromFilename(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i + 1).toLowerCase().trim() : '';
}

function mimeAllowedForScope(mimetype, scope) {
  let m = (mimetype || '').toLowerCase().trim();
  if (!m) return false;
  if (m === 'image/jpg') m = 'image/jpeg';
  if (scope === 'image') return IMAGE_MIMES.has(m);
  return FULL_MEDIA_MIMES.has(m);
}

/**
 * @param {string} mimetype
 * @param {string} [filename]
 * @param {'media'|'image'} scope
 * @returns {{ ok: true, contentType: string } | { ok: false, message: string }}
 */
function validateUpload(mimetype, filename, scope) {
  const allowSet = scope === 'image' ? IMAGE_MIMES : FULL_MEDIA_MIMES;
  let normalized = (mimetype || '').trim().toLowerCase();
  if (normalized === 'image/jpg') normalized = 'image/jpeg';

  if (normalized && allowSet.has(normalized)) {
    return { ok: true, contentType: normalized };
  }

  const ext = getExtensionFromFilename(filename);
  const fromExt = ext ? EXT_TO_MIME[ext] : null;
  if (fromExt) {
    const allowed = scope === 'image' ? IMAGE_MIMES.has(fromExt) : FULL_MEDIA_MIMES.has(fromExt);
    if (allowed) {
      return { ok: true, contentType: fromExt };
    }
  }

  return {
    ok: false,
    message: scope === 'image' ? MSG_IMAGE_ONLY : MSG_FULL_MEDIA,
  };
}

function getExtensionForMime(contentType) {
  const m = (contentType || '').toLowerCase();
  if (m === 'image/jpg') return 'jpg';
  return MIME_TO_EXT[m] || 'bin';
}

const SCOPES = ['media', 'image'];

function normalizeScope(raw) {
  const s = String(raw || 'media').toLowerCase();
  return SCOPES.includes(s) ? s : 'media';
}

module.exports = {
  validateUpload,
  getExtensionForMime,
  getExtensionFromFilename,
  mimeAllowedForScope,
  normalizeScope,
  IMAGE_MIMES,
  FULL_MEDIA_MIMES,
  MSG_IMAGE_ONLY,
  MSG_FULL_MEDIA,
};
