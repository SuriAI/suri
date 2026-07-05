import { ipcMain, shell, app } from "electron"
import path from "path"
import { diagnosticsService } from "../services/DiagnosticsService.js"
import isDev from "../util.js"

export function registerSystemHandlers() {
  ipcMain.handle("system:get-stats", () => {
    const cpu = process.getCPUUsage()
    const memory = process.getSystemMemoryInfo()

    return {
      cpu: cpu.percentCPUUsage,
      memory: {
        total: memory.total,
        free: memory.free,
        appUsage: process.memoryUsage().rss,
      },
    }
  })

  ipcMain.handle("system:export-health", async () => {
    const report = await diagnosticsService.generateHealthReport()
    const path = await diagnosticsService.exportReportToDisk(report)
    shell.showItemInFolder(path)
    return { success: true, path }
  })

  ipcMain.handle("system:open-data-dir", async () => {
    const dataPath = isDev() ? path.join(app.getAppPath(), "..", "data") : app.getPath("userData")
    await shell.openPath(dataPath)
    return { success: true, path: dataPath }
  })

  ipcMain.handle("system:open-install-dir", async () => {
    const installPath = app.isPackaged ? path.dirname(process.execPath) : app.getAppPath()
    await shell.openPath(installPath)
    return { success: true, path: installPath }
  })
}
