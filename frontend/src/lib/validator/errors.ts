export type Linter =
  | 'parse'
  | 'style'
  | 'portability'

export interface ValidationError {
  /** JSONPath to the offending value, e.g. $.services.web.ports[0].target */
  path: string
  type: Linter
  message: string
  /** 1-indexed source position, filled in by parseComposeYaml when it can be resolved against the original YAML text. */
  line?: number
  col?: number
}

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export function childPath(path: string, key: string): string {
  return IDENTIFIER.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`
}

export function indexPath(path: string, index: number): string {
  return `${path}[${index}]`
}
