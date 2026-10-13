import { describe, expect, it } from 'vitest'
import {
  deslocamentoInicioMes,
  diasNoMes,
  formatarDataCurta,
  formatarDataISO,
  formatarDataNota,
  normalizarHora,
  parseDataISO,
  somarDias,
  somarMeses,
} from './datas'

describe('formatarDataISO', () => {
  it('formata com zeros à esquerda', () => {
    expect(formatarDataISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('usa a data local, não UTC (23h de dia 13 continua a ser dia 13)', () => {
    expect(formatarDataISO(new Date(2026, 9, 13, 23, 30))).toBe('2026-10-13')
  })
})

describe('parseDataISO', () => {
  it('devolve meia-noite local do dia indicado', () => {
    const d = parseDataISO('2026-10-13')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 13, 0])
  })

  it('é o inverso de formatarDataISO', () => {
    expect(formatarDataISO(parseDataISO('2024-02-29'))).toBe('2024-02-29')
  })
})

describe('normalizarHora', () => {
  it.each([
    ['09:00', '09:00'],
    ['09:00:00', '09:00'], // formato devolvido pelo Supabase para colunas time
    ['9:5', '09:05'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('%s -> %s', (entrada, esperado) => {
    expect(normalizarHora(entrada)).toBe(esperado)
  })
})

describe('formatarDataNota', () => {
  it('usa o mês abreviado em maiúsculas', () => {
    expect(formatarDataNota(new Date(2026, 9, 13))).toBe('13 OUT 2026')
    expect(formatarDataNota(new Date(2026, 0, 1))).toBe('1 JAN 2026')
  })
})

describe('formatarDataCurta', () => {
  it('dia + mês abreviado em minúsculas, igual em qualquer navegador', () => {
    expect(formatarDataCurta('2026-10-20')).toBe('20 out')
    expect(formatarDataCurta('2027-01-03')).toBe('3 jan')
  })
})

describe('somarMeses', () => {
  it('não salta fevereiro quando se parte de 31 de janeiro (bug antigo)', () => {
    const r = somarMeses(new Date(2026, 0, 31), 1)
    expect([r.getFullYear(), r.getMonth()]).toEqual([2026, 1])
  })

  it('atravessa a mudança de ano nos dois sentidos', () => {
    expect(somarMeses(new Date(2026, 11, 15), 1).getFullYear()).toBe(2027)
    expect(somarMeses(new Date(2026, 0, 15), -1).getMonth()).toBe(11)
  })
})

describe('somarDias', () => {
  it('avança para o mês seguinte', () => {
    expect(formatarDataISO(somarDias(new Date(2026, 9, 31), 1))).toBe('2026-11-01')
  })

  it('não altera a data original', () => {
    const original = new Date(2026, 9, 13)
    somarDias(original, 5)
    expect(original.getDate()).toBe(13)
  })
})

describe('diasNoMes / deslocamentoInicioMes', () => {
  it('conta dias de cada mês, incluindo anos bissextos', () => {
    expect(diasNoMes(new Date(2026, 1, 10))).toBe(28)
    expect(diasNoMes(new Date(2024, 1, 10))).toBe(29)
    expect(diasNoMes(new Date(2026, 9, 1))).toBe(31)
  })

  it('outubro de 2026 começa numa quinta-feira (4)', () => {
    expect(deslocamentoInicioMes(new Date(2026, 9, 20))).toBe(4)
  })
})
