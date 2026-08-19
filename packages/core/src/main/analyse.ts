import { cacheRecord } from '../utils/cacheHelp.js'
import parseLsirfl, { getInodes } from '../core/parseLsirfl.js'
import {
  chalk,
  findParentRelative,
  getOriginalDestPath,
  log,
} from '../utils/index.js'
import { IOptions as IHlinkOptions } from './hlink.js'
import supported from '../utils/supported.js'

interface IOptions extends Omit<IHlinkOptions, 'pathsMapping'> {
  source: string
  dest: string
}

export type WaitLinks = {
  destDir: string
  sourcePath: string
  originalDest: string
  originalSource: string
}

async function analyse(config: IOptions) {
  const {
    include,
    exclude,
    openCache,
    source,
    dest,
    keepDirStruct = true,
    mkdirIfSingle = true,
  } = config
  const [relativeSource, relativeDest] = findParentRelative([source, dest])
  const taskName = [
    chalk.gray(relativeSource),
    chalk.cyan('>'),
    chalk.gray(relativeDest),
  ].join(' ')
  log.info('执行分析任务:', taskName)
  const parseResults = await parseLsirfl(source)
  // 用 Set 做 O(1) 查找，避免大库（源/目标各 20 万+）时
  // dstInodes.indexOf / cached.includes 在 forEach 内造成 O(n*m) 卡死
  const dstInodeSet = new Set(await getInodes(dest))
  const existFiles: string[] = []
  const waitLinkFiles: WaitLinks[] = []
  const excludeFiles: string[] = []
  const cacheFiles: string[] = []
  const cachedSet = openCache ? new Set(cacheRecord.read()) : new Set<string>()

  parseResults.forEach((parseResult) => {
    const { fullPath } = parseResult
    if (!supported(fullPath, include, exclude)) {
      excludeFiles.push(fullPath)
    } else if (dstInodeSet.has(parseResult.inode)) {
      existFiles.push(fullPath)
    } else if (openCache && cachedSet.has(fullPath)) {
      cacheFiles.push(fullPath)
    } else {
      waitLinkFiles.push({
        destDir: getOriginalDestPath(
          fullPath,
          source,
          dest,
          keepDirStruct,
          mkdirIfSingle
        ),
        sourcePath: fullPath,
        originalDest: dest,
        originalSource: source,
      })
    }
  })
  log.success('分析任务执行完毕:', taskName)
  return {
    existFiles,
    waitLinkFiles,
    excludeFiles,
    cacheFiles,
    parseResults,
  }
}

export default analyse
