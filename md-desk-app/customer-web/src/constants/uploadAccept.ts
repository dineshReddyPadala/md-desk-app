export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateFilesMaxSize(files: FileList | File[], maxBytes: number = MAX_UPLOAD_BYTES): string | null {
  for (const f of Array.from(files)) {
    if (f.size > maxBytes) {
      return `"${f.name}" exceeds the maximum size of 5 MB.`;
    }
  }
  return null;
}

/** Browser file input `accept` for complaint attachments. */
export const ACCEPT_FULL_MEDIA =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.ogg,.zip';

export const ACCEPT_CHAT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.aac,.ogg,.webm,audio/*,image/*,application/pdf';

const MEDIA_EXT = new Set([
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
]);

const CHAT_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp3', 'wav', 'aac', 'ogg', 'webm']);

const MSG_MEDIA =
  'Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, TXT, CSV, images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, AVI, MOV, MKV, WebM), audio (MP3, WAV, AAC, OGG), ZIP.';

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function validateFilesFullMedia(files: FileList | File[]): string | null {
  for (const f of Array.from(files)) {
    const e = extOf(f.name);
    if (!e || !MEDIA_EXT.has(e)) {
      return `“${f.name}” is not allowed. ${MSG_MEDIA}`;
    }
  }
  const sizeErr = validateFilesMaxSize(files);
  if (sizeErr) return sizeErr;
  return null;
}

const MSG_CHAT =
  'Invalid file type for chat. Allowed: PDF; images (JPEG, PNG, GIF, WebP, SVG); audio (MP3, WAV, AAC, OGG, WebM).';

export function validateFilesChat(files: FileList | File[]): string | null {
  for (const f of Array.from(files)) {
    const e = extOf(f.name);
    if (!e || !CHAT_EXT.has(e)) {
      return `“${f.name}” is not allowed. ${MSG_CHAT}`;
    }
  }
  const sizeErr = validateFilesMaxSize(files);
  if (sizeErr) return sizeErr;
  return null;
}
