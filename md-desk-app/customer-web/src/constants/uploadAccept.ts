/** Browser file input `accept` for complaint attachments. */
export const ACCEPT_FULL_MEDIA =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.ogg,.zip';

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
  return null;
}
