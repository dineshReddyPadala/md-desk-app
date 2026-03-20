/** Max upload size (aligned with server @fastify/multipart and UI). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Reject files over the limit (call from change handlers before upload). */
export function validateFilesMaxSize(files: FileList | File[], maxBytes: number = MAX_UPLOAD_BYTES): string | null {
  for (const f of Array.from(files)) {
    if (f.size > maxBytes) {
      return `"${f.name}" exceeds the maximum size of 5 MB.`;
    }
  }
  return null;
}

/** Browser file input `accept` for full media uploads (complaints-style). */
export const ACCEPT_FULL_MEDIA =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.ogg,.zip';

/** Product / dealer image uploads only. */
export const ACCEPT_IMAGES_ONLY = '.jpg,.jpeg,.png,.gif,.webp,.svg,image/*';

/** Chat attachments: PDF, images, voice. */
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

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

const CHAT_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp3', 'wav', 'aac', 'ogg', 'webm']);

const MSG_MEDIA =
  'Invalid file type. Allowed: PDF, Word, Excel, PowerPoint, TXT, CSV, images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, AVI, MOV, MKV, WebM), audio (MP3, WAV, AAC, OGG), ZIP.';

const MSG_IMAGE =
  'Invalid file type. Only images allowed: JPEG, PNG, GIF, WebP, SVG.';

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** Client-side check before upload (complaints / project documents). */
export function validateFilesFullMedia(files: FileList | File[]): string | null {
  for (const f of Array.from(files)) {
    const e = extOf(f.name);
    if (!e || !MEDIA_EXT.has(e)) {
      return `"${f.name}" is not allowed here. ${MSG_MEDIA}`;
    }
  }
  const sizeErr = validateFilesMaxSize(files);
  if (sizeErr) return sizeErr;
  return null;
}

/** Client-side check for product/dealer images. */
export function validateFilesImageOnly(files: FileList | File[]): string | null {
  for (const f of Array.from(files)) {
    const e = extOf(f.name);
    if (!e || !IMAGE_EXT.has(e)) {
      return `"${f.name}" is not allowed here. ${MSG_IMAGE}`;
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
      return `"${f.name}" is not allowed here. ${MSG_CHAT}`;
    }
  }
  const sizeErr = validateFilesMaxSize(files);
  if (sizeErr) return sizeErr;
  return null;
}
