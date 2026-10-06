// The proxy variables a container of these labs must not inherit. Docker Desktop passes the PC's proxy
// settings, credentials included, into every container it starts: on the author's Windows PC, after
// the run, a plain `docker run` saw six such variables, four of them with `user:pass@` in the value.
// No container here needs a proxy (lab A's database is reached on 127.0.0.1, lab B's arms run with no
// network), so all six forms are set to empty strings — in lab A's compose file and on lab B's
// `docker run`.

export const PROXY_VARIABLES = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy',
] as const

/** `docker run` options that set every proxy variable to the empty string. */
export const clearedProxyEnv = (): string[] => PROXY_VARIABLES.flatMap((name) => ['-e', `${name}=`])
