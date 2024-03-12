// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipc: {
    openFile(): Promise<string|undefined>,
    readFile(filePath: string): Promise<{name: string, data: string}>
    argv(): Promise<string[]>
    onOpenFile(any): void
  }
}
