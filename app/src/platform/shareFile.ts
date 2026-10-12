// Hands a file to the owner (F10, specs/009-settings-data research R2). Nothing is uploaded: the
// iPhone share sheet lets the owner choose Files, AirDrop or Mail herself (constitution IV).

export type ShareFileResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

/**
 * Opens the share sheet with the file. Safari only allows this right after a tap, so share() is
 * called before the first await: call this synchronously in the tap handler, with a file that is
 * already prepared. Without file sharing (laptop browser) the file is downloaded instead.
 */
export async function shareFile(file: File): Promise<ShareFileResult> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      return (error as { name?: unknown } | null)?.name === 'AbortError' ? 'cancelled' : 'failed'
    }
  }

  // The browser does not report a cancel here, so a download counts as a backup.
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return 'downloaded'
}
