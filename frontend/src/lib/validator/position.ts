// Maps a validator-produced JSONPath (built by errors.ts's childPath/
// indexPath) back to a { line, col } in the original YAML source, by
// re-walking the yaml package's parsed Document — which keeps a
// [start, valueEnd, nodeEnd] character-offset `range` on every node.

import { isMap, isSeq, isScalar, type Document, type LineCounter, type Node } from 'yaml'

export interface Position {
  line: number
  col: number
}

// Mirrors childPath/indexPath's output format exactly: `.identifier` for
// plain object keys, `["json string"]` for anything else, `[number]` for
// array indices. Reparsing the rendered path (rather than threading raw
// segments through every validateXxx function) keeps this isolated to one
// file instead of touching all ~20 of them.
const PATH_SEGMENT = /\.([a-zA-Z_][a-zA-Z0-9_]*)|\[(-?\d+)\]|\[("(?:[^"\\]|\\.)*")\]/g

export function parseJsonPath(path: string): (string | number)[] {
  const segments: (string | number)[] = []
  const body = path.startsWith('$') ? path.slice(1) : path
  for (const match of body.matchAll(PATH_SEGMENT)) {
    if (match[1] !== undefined) segments.push(match[1])
    else if (match[2] !== undefined) segments.push(Number(match[2]))
    else if (match[3] !== undefined) segments.push(JSON.parse(match[3]) as string)
  }
  return segments
}

function isNode(value: unknown): value is Node {
  return isMap(value) || isSeq(value) || isScalar(value)
}

function nodeStart(node: Node, lineCounter: LineCounter): Position | undefined {
  return node.range ? lineCounter.linePos(node.range[0]) : undefined
}

/**
 * Resolves an error's `path` to a source position. Prefers a map entry's
 * *key* position over its value — most errors are about "this key/value is
 * wrong", and the key reliably lands on the right line even when the value
 * is a multi-line block collection. Falls back to the closest existing
 * ancestor's position when the path names something that doesn't actually
 * exist in the source (e.g. a `required` error's missing field).
 */
export function resolvePosition(doc: Document, lineCounter: LineCounter, path: string): Position | undefined {
  const segments = parseJsonPath(path)
  if (segments.length === 0) {
    return isNode(doc.contents) ? nodeStart(doc.contents, lineCounter) : undefined
  }

  const last = segments[segments.length - 1]
  const parentSegments = segments.slice(0, -1)
  const parent: unknown = parentSegments.length === 0 ? doc.contents : doc.getIn(parentSegments, true)
  if (!isNode(parent)) return undefined

  if (isMap(parent)) {
    const pair = parent.items.find((p) => isScalar(p.key) && p.key.value === last)
    if (pair && isNode(pair.key)) return nodeStart(pair.key, lineCounter)
    return nodeStart(parent, lineCounter)
  }

  if (isSeq(parent)) {
    const item: unknown = typeof last === 'number' ? parent.items[last] : undefined
    if (isNode(item)) return nodeStart(item, lineCounter)
    return nodeStart(parent, lineCounter)
  }

  return nodeStart(parent, lineCounter)
}
