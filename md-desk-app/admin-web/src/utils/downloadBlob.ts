export function downloadBlob(data: BlobPart, filename: string, type?: string) {
  const blob = data instanceof Blob ? data : new Blob([data], type ? { type } : undefined);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
