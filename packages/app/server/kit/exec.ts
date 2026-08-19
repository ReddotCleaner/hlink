import { IOptions, IPruneOptions } from '@hlink/core'
import { execa, ExecaChildProcess } from 'execa'
import path from 'node:path'
import __dirname from './__dirname.js'

export type OptionsType = {
  main: IOptions
  prune: IPruneOptions
}

export type ReturnType<T extends 'main' | 'prune'> = {
  command: T
  config: OptionsType[T]
}

type LogType = (data: string, type: 'succeed' | 'failed') => void

type MyMonitorType = {
  handleLog: (log: LogType) => void
  original: ExecaChildProcess
  kill: () => boolean
}

const ongoingTasks: Partial<Record<string, MyMonitorType | null>> = {}

const waitingDeleteFiles: Partial<Record<string, string[] | null>> = {}

const execPath = path.join(__dirname(import.meta.url), './nodeExec.js')

export function start<T extends 'main' | 'prune'>(
  name: string,
  command: T,
  options: OptionsType[T] & { usedBy?: string },
  log?: LogType
) {
  const monitor = execa(
    process.execPath,
    [execPath, command, JSON.stringify(options)],
    {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        USED_BY_APP: options.usedBy || 'browser',
      },
    }
  )
  // 把子进程 stdout/stderr 同步到服务进程标准输出（→ docker logs），
  // 这样关闭 Web 页面后也能从 docker logs 看到任务执行进度与状态。
  // 只在进程启动时挂一次，避免重复 attach 造成重复输出。
  monitor.stdout?.on('data', (e) => {
    const str = e.toString()
    if (str) process.stdout.write(str)
  })
  monitor.stderr?.on('data', (e) => {
    const str = e.toString()
    if (str) process.stderr.write(str)
  })
  const handleLog = (_log: LogType) => {
    monitor.stdout?.on('data', (e) => {
      const str = e.toString()
      if (str) {
        _log(str.split('\n').filter(Boolean).join('\n'), 'succeed')
      }
    })
    monitor.stderr?.on('data', (e) => {
      const str = e.toString()
      _log(str, 'failed')
    })
  }
  if (log) {
    handleLog(log)
  }
  monitor.on('message', (r) => {
    const files = r as string[]
    if (files.length) {
      waitingDeleteFiles[name] = r as string[]
    }
  })
  const myMonitor: MyMonitorType = {
    handleLog,
    original: monitor,
    kill: () => monitor.kill('SIGKILL'),
  }

  ongoingTasks[name] = myMonitor
  return myMonitor
}

export function has(name: string) {
  return !!ongoingTasks[name]
}

export function cancel(name: string) {
  const monitor = ongoingTasks[name]
  if (!monitor) {
    throw new Error(`任务 ${name} 没有在进行中`)
  }
  if (monitor.kill()) {
    ongoingTasks[name] = null
    return true
  }
  return false
}

export function clear(name: string) {
  ongoingTasks[name] = null
  return true
}

export function get(name: string) {
  return ongoingTasks[name]
}

export function getFiles(name: string) {
  return waitingDeleteFiles[name]
}

export function clearFiles(name: string) {
  waitingDeleteFiles[name] = null
  return true
}

export function runningList(): string[] {
  return Object.entries(ongoingTasks)
    .filter(([, v]) => !!v)
    .map(([k]) => k)
}
