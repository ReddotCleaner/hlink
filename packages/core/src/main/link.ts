import { ExecaSyncError, execa } from 'execa'
import path from 'path'
import { chalk, getDirBasePath } from '../utils/index.js'
import fs from 'fs-extra'
import HLinkError, { ErrorCode } from '../core/HlinkError.js'

const errorSuggestion: Record<string, ErrorCode> = {
  'Invalid cross-device link': ErrorCode.CrossDeviceLink,
  'Operation not permitted': ErrorCode.NotPermitted,
  'File exists': ErrorCode.FileExists,
}
const knownError = Object.keys(errorSuggestion) as Array<
  keyof typeof errorSuggestion
>

/**
 *
 * @param sourceFile 源文件的绝对路径
 * @param originalDestPath 硬链文件实际存放的目录(绝对路径)
 */

async function link(
  sourceFile: string,
  originalDestPath: string,
  source: string,
  dest: string
) {
  // 做硬链接
  try {
    await fs.ensureDir(originalDestPath)
    await execa('ln', [sourceFile, originalDestPath])
  } catch (e) {
    if (typeof e === 'object' && e instanceof Error) {
      const error = e as ExecaSyncError
      if (error.signal === 'SIGINT') {
        throw e
      }
      // 单个文件权限不足（ensureDir 的 EACCES 或 ln 的 "Permission denied"）
      // 记为失败并跳过，避免一个无权限文件拖死整个任务
      const errText = (error.stderr || error.message || '') as string
      const errCode = (error as { code?: string }).code
      if (
        errCode === 'EACCES' ||
        errText.toLowerCase().indexOf('permission denied') > -1
      ) {
        throw new HLinkError(
          ErrorCode.PermissionDenied,
          `${chalk.gray(getDirBasePath(source, sourceFile))} ${chalk.cyan(
            '>'
          )} ${getDirBasePath(
            dest,
            path.join(originalDestPath, path.basename(sourceFile))
          )}`
        )
      }
      const findError = knownError.find(
        (err: string) => (error.stderr || error.message).indexOf(err) > -1
      )
      if (findError) {
        const errorCode = errorSuggestion[findError]
        throw new HLinkError(
          errorCode,
          `${chalk.gray(getDirBasePath(source, sourceFile))} ${chalk.cyan(
            '>'
          )} ${getDirBasePath(
            dest,
            path.join(originalDestPath, path.basename(sourceFile))
          )}`
        )
      } else {
        throw e
      }
    }
  }
}

export default link
