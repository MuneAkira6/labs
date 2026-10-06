// The CSV bytes of SCOPE.md 2.2: UTF-8 with a BOM, a header row, CRLF after every row including the
// last, a field enclosed in `"` exactly when it holds a comma, a quote, CR or LF, an inner quote
// doubled, integers in plain decimal. Nothing else varies.

export const BOM = Buffer.from([0xef, 0xbb, 0xbf])
export const CRLF = '\r\n'

export type CsvValue = string | number

/** True exactly for the four characters of SCOPE.md 2.2 that force quoting. */
export function needsQuoting(field: string): boolean {
  return field.includes(',') || field.includes('"') || field.includes('\r') || field.includes('\n')
}

export function formatInteger(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`csv: not a safe integer, so it has no plain decimal form: ${value}`)
  }
  return String(value)
}

export function csvField(value: CsvValue): string {
  const text = typeof value === 'number' ? formatInteger(value) : value
  return needsQuoting(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function csvRow(values: readonly CsvValue[]): string {
  return values.map(csvField).join(',')
}

export function csvBytes(
  header: readonly string[],
  rows: readonly (readonly CsvValue[])[],
): Buffer {
  const text = [csvRow(header), ...rows.map(csvRow)].map((row) => row + CRLF).join('')
  return Buffer.concat([BOM, Buffer.from(text, 'utf8')])
}

export type CsvShape = {
  header: readonly string[]
  /** Zero-based indexes of the columns that must hold an integer in plain decimal. */
  integerColumns: readonly number[]
}

const PLAIN_INTEGER = /^(0|-?[1-9][0-9]*)$/

/**
 * Reads bytes back against every rule of SCOPE.md 2.2 and returns one message per rule broken, so a
 * test can show the rule holding on real output and breaking on a planted violation. An empty array
 * means the bytes obey all of them.
 */
export function csvViolations(bytes: Buffer, shape: CsvShape): string[] {
  const bad: string[] = []

  let body = bytes
  if (bytes.subarray(0, 3).equals(BOM)) {
    body = bytes.subarray(3)
  } else {
    bad.push(
      `the file does not start with the byte-order mark EF BB BF (got ${
        bytes.subarray(0, 3).toString('hex').toUpperCase() || 'nothing'
      })`,
    )
  }

  const text = body.toString('utf8')
  if (text.length === 0) {
    bad.push('the file holds no header row')
    return bad
  }

  const rows: string[][] = []
  let i = 0
  let rowNumber = 0
  while (i < text.length) {
    rowNumber++
    const fields: string[] = []
    for (;;) {
      if (text[i] === '"') {
        i++
        let value = ''
        let closed = false
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              value += '"'
              i += 2
            } else {
              i++
              closed = true
              break
            }
          } else {
            value += text[i]
            i++
          }
        }
        if (!closed) bad.push(`row ${rowNumber}: a quoted field is never closed`)
        if (!needsQuoting(value)) {
          bad.push(
            `row ${rowNumber}: the field "${value}" is quoted but holds no comma, quote, CR or LF`,
          )
        }
        fields.push(value)
        if (i < text.length && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          bad.push(
            `row ${rowNumber}: a closed quoted field is followed by ${JSON.stringify(text[i])}, not a comma or CRLF`,
          )
          while (i < text.length && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') i++
        }
      } else {
        const start = i
        while (i < text.length && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') i++
        const value = text.slice(start, i)
        if (value.includes('"')) {
          bad.push(`row ${rowNumber}: the unquoted field ${JSON.stringify(value)} holds a quote`)
        }
        fields.push(value)
      }
      if (text[i] === ',') {
        i++
        continue
      }
      break
    }

    if (text.startsWith(CRLF, i)) {
      i += 2
    } else if (i >= text.length) {
      bad.push(`row ${rowNumber}: the last row does not end in CRLF`)
    } else {
      bad.push(`row ${rowNumber}: the row ends in ${JSON.stringify(text[i])}, not CRLF`)
      i++
    }
    rows.push(fields)
  }

  const header = rows[0] ?? []
  if (header.join(',') !== shape.header.join(',')) {
    bad.push(`the header row is ${header.join(',')}, not ${shape.header.join(',')}`)
  }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (row.length !== shape.header.length) {
      bad.push(`row ${r + 1}: ${row.length} fields, not ${shape.header.length}`)
      continue
    }
    if (r === 0) continue
    for (const column of shape.integerColumns) {
      const value = row[column]
      if (!PLAIN_INTEGER.test(value)) {
        bad.push(
          `row ${r + 1}: the field ${JSON.stringify(value)} in column ${column} is not an integer in plain decimal`,
        )
      }
    }
  }

  return bad
}
