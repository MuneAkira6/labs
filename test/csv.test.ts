// One test per rule of SCOPE.md 2.2, and for each rule one control: the same bytes with that rule
// broken on purpose, which `csvViolations` must report. A control is named "control:".

import { describe, expect, it } from 'vitest'
import type { CsvShape } from '../lab-a/src/csv.ts'
import { BOM, csvBytes, csvField, csvViolations, formatInteger } from '../lab-a/src/csv.ts'

const SHAPE: CsvShape = { header: ['code', 'name', 'n'], integerColumns: [2] }

/** The reference file: three rows, one of which exercises the comma, the quote and a line break. */
function sample(): Buffer {
  return csvBytes(SHAPE.header, [
    ['G001', '営業部1', 1],
    ['G003', 'サポート, 第一3', 20],
    ['G004', '企画"室"4', 300],
  ])
}

function textOf(bytes: Buffer): string {
  return bytes.subarray(3).toString('utf8')
}

describe('the CSV bytes of SCOPE.md 2.2', () => {
  it('obeys every rule at once on a file that exercises them', () => {
    expect(csvViolations(sample(), SHAPE)).toEqual([])
  })

  it('rule: the file starts with the byte-order mark EF BB BF', () => {
    expect(sample().subarray(0, 3).toString('hex')).toBe('efbbbf')
    expect(BOM.toString('hex')).toBe('efbbbf')
  })

  it('control: the same bytes without the BOM break the rule', () => {
    const violations = csvViolations(sample().subarray(3), SHAPE)
    expect(violations.some((v) => v.includes('byte-order mark'))).toBe(true)
  })

  it('rule: the first row is the header', () => {
    expect(textOf(sample()).split('\r\n')[0]).toBe('code,name,n')
  })

  it('control: a file whose first row is not the header breaks the rule', () => {
    const wrong = csvBytes(['code', 'name', 'count'], [['G001', '営業部1', 1]])
    expect(csvViolations(wrong, SHAPE).some((v) => v.includes('the header row is'))).toBe(true)
  })

  it('rule: every row ends in CRLF, the last one included', () => {
    const text = textOf(sample())
    expect(text.endsWith('\r\n')).toBe(true)
    expect(text.split('\r\n').filter((line) => line.length > 0)).toHaveLength(4)
    expect(text.replaceAll('\r\n', '')).not.toContain('\n')
  })

  it('control: dropping the final CRLF breaks the rule', () => {
    const bytes = sample()
    const cut = Buffer.concat([BOM, Buffer.from(textOf(bytes).slice(0, -2), 'utf8')])
    expect(csvViolations(cut, SHAPE).some((v) => v.includes('does not end in CRLF'))).toBe(true)
  })

  it('control: ending a row in a bare LF breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(textOf(sample()).replaceAll('\r\n', '\n'), 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('not CRLF'))).toBe(true)
  })

  it('rule: a field holding a comma is quoted', () => {
    expect(csvField('サポート, 第一3')).toBe('"サポート, 第一3"')
    expect(textOf(sample())).toContain('G003,"サポート, 第一3",20\r\n')
  })

  it('control: the comma field left unquoted breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(textOf(sample()).replace('"サポート, 第一3"', 'サポート, 第一3'), 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('fields, not 3'))).toBe(true)
  })

  it('rule: a field holding a quote is quoted and the inner quote is doubled', () => {
    expect(csvField('企画"室"4')).toBe('"企画""室""4"')
    expect(textOf(sample())).toContain('G004,"企画""室""4",300\r\n')
  })

  it('control: the quote field left unquoted breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(textOf(sample()).replace('"企画""室""4"', '企画"室"4'), 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('holds a quote'))).toBe(true)
  })

  it('control: an inner quote left single inside a quoted field breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(textOf(sample()).replace('"企画""室""4"', '"企画"室"4"'), 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('not a comma or CRLF'))).toBe(true)
  })

  it('rule: a field holding a line break is quoted and keeps its bytes', () => {
    expect(csvField('a\r\nb')).toBe('"a\r\nb"')
    const bytes = csvBytes(SHAPE.header, [['G001', 'a\r\nb', 1]])
    expect(csvViolations(bytes, SHAPE)).toEqual([])
    expect(textOf(bytes)).toBe('code,name,n\r\nG001,"a\r\nb",1\r\n')
  })

  it('control: the same line break left unquoted breaks the rule', () => {
    const bytes = Buffer.concat([BOM, Buffer.from('code,name,n\r\nG001,a\r\nb,1\r\n', 'utf8')])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('fields, not 3'))).toBe(true)
  })

  it('rule: a field that needs none of it is not quoted', () => {
    expect(csvField('営業部1')).toBe('営業部1')
  })

  it('control: quoting a field that needs no quoting breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(textOf(sample()).replace('G001,営業部1,1', 'G001,"営業部1",1'), 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('is quoted but holds no'))).toBe(true)
  })

  it('rule: integers are written in plain decimal', () => {
    expect(formatInteger(0)).toBe('0')
    expect(formatInteger(1000)).toBe('1000')
    expect(csvField(1000000)).toBe('1000000')
    expect(() => formatInteger(1.5)).toThrow()
  })

  it('control: an integer written in exponential form breaks the rule', () => {
    const bytes = Buffer.concat([
      BOM,
      Buffer.from(`code,name,n\r\nG001,営業部1,${(1000).toExponential()}\r\n`, 'utf8'),
    ])
    expect(csvViolations(bytes, SHAPE).some((v) => v.includes('plain decimal'))).toBe(true)
  })
})
