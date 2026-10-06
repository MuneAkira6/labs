// Helpers shared by the three runners. Nothing here assumes a POSIX shell or `/` as a separator: a
// child process is started with its arguments as an array, and a path written into a committed file
// is made relative to the repository and joined with `/` (SCOPE.md, "Language and style").

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:net'
import { relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))

export type RunResult = { code: number; stdout: string; stderr: string; timedOut: boolean }

/**
 * Starts a process with its arguments as an array, never through a shell string. With `timeoutMs`
 * the child is killed when the limit passes and `timedOut` says so; the caller decides what that
 * means for its own cleanup.
 */
export function run(
  command: string,
  args: readonly string[],
  options: { timeoutMs?: number } = {},
): Promise<RunResult> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, [...args], { cwd: REPO_ROOT })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer =
      options.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true
            child.kill('SIGKILL')
          }, options.timeoutMs)
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (error) => {
      if (timer !== undefined) clearTimeout(timer)
      rejectRun(error)
    })
    child.on('close', (code) => {
      if (timer !== undefined) clearTimeout(timer)
      resolveRun({ code: code ?? -1, stdout, stderr, timedOut })
    })
  })
}

export function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/** A path inside the repository, written with `/` on every OS so committed files match. */
export function repoPath(absolute: string): string {
  return relative(REPO_ROOT, resolve(absolute)).split(sep).join('/')
}

/** True when nothing listens on 127.0.0.1:<port>. */
export function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolveFree) => {
    const server = createServer()
    server.once('error', () => resolveFree(false))
    server.once('listening', () => server.close(() => resolveFree(true)))
    server.listen(port, '127.0.0.1')
  })
}

export function progress(message: string): void {
  process.stderr.write(`${message}\n`)
}

export function out(message: string): void {
  process.stdout.write(`${message}\n`)
}
