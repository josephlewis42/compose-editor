// Maps a validator-produced JSONPath (built by errors.ts's childPath/
// indexPath) back to a { line, col } in the original YAML source, by
// re-walking the yaml package's parsed Document — which keeps a
// [start, valueEnd, nodeEnd] character-offset `range` on every node.

import { type Document, type LineCounter, type Node, isMap, isScalar, isSeq } from 'yaml'

export interface Position {
  line: number
  col: number
}

// Mirrors childPath/indexPath's output format exactly: `.identifier` for
// plain object keys, `["json string"]` for anything else, `[number]` for
// array indices. Reparsing the rendered path (rather than threading raw
// segments through every validateXxx function) keeps this isolated to one
// file instead of touching all ~20 of them.
// eslint-disable-next-line prefer-named-capture-group
const PATH_SEGMENT = /\.(?<field>[a-zA-Z_][a-zA-Z0-9_]*)|\[(?<index>-?\d+)\]|\[(?<selector>"(?:[^"\\]|\\.)*")\]/g

export function parseJsonPath(path: string): (string | number)[] {
  const segments: (string | number)[] = []
  const body = path.startsWith('$') ? path.slice(1) : path
  for (const match of body.matchAll(PATH_SEGMENT)) {
    if (match.groups?.field !== undefined) {
      segments.push(match.groups?.field)
    }
    else if (match.groups?.index !== undefined) {
      segments.push(Number(match.groups?.index))
    }
    else if (match.groups?.selector) {
      segments.push(JSON.parse(match.groups?.selector) as string)
    }
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
 * Resolves an error's `path` to a friendly source position.
 */
export function resolvePosition(doc: Document, lineCounter: LineCounter, path: string): Position | undefined {
  const segments = parseJsonPath(path)

  // If the JSONPath isn't valid or points at the root
  if (segments.length === 0) {
    // Point at the first non-comment element, if it exists.
    if (isNode(doc.contents)) {
      return nodeStart(doc.contents, lineCounter)
    }
    return {line: 0, col: 0}
  }

  const last = segments[segments.length - 1]
  const parentSegments = segments.slice(0, -1)
  const parent: unknown = parentSegments.length === 0 ? doc.contents : doc.getIn(parentSegments, true)
  if (!isNode(parent)) {
    return undefined
  }

  // If a map, find the key's position.
  if (isMap(parent)) {
    const pair = parent.items.find((p) => isScalar(p.key) && p.key.value === last)
    if (pair && isNode(pair.key)) {
      return nodeStart(pair.key, lineCounter)
    }
    return nodeStart(parent, lineCounter)
  }

  // If an array, find the position of the index.
  if (isSeq(parent) && typeof last === 'number') {
    const item: unknown = parent.items[last]
    if (isNode(item)) {
      return nodeStart(item, lineCounter)
    }
    return nodeStart(parent, lineCounter)
  }

  return nodeStart(parent, lineCounter)
}