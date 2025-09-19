// deno-lint-ignore-file
export function get__ac_signature2(url: string, ac_nonce: string, ua: string): string {
  let finalNum = 0
  let temp = 0
  //   let ac_signature = '_02B4Z6wo00f01'
  let ac_signature = '_02B4Z6wo00101'

  const bigCountOperation = (str: string): number => {
    for (let i = 0; i < str.length; i++) {
      finalNum = ((finalNum ^ str.charCodeAt(i)) * 65599) >>> 0
    }
    return finalNum
  }
  const countToText = (num: number, str: string): string => {
    ;[24, 18, 12, 6, 0].forEach((offset) => {
      const keyNum = (num >> offset) & 63
      const valNum = keyNum < 26 ? 65 : keyNum < 52 ? 71 : keyNum < 62 ? -4 : -17
      str += String.fromCharCode(keyNum + valNum)
    })
    return str
  }
  const timestamp = Date.now().toString()
  bigCountOperation(timestamp)
  const urlNum = bigCountOperation(url)
  const longStr = ((65521 * (finalNum % 65521)) ^ (parseInt(timestamp) >>> 0)).toString(2).padStart(32, '0')
  const deciNum = parseInt('10000000110000' + longStr, 2)
  ac_signature = countToText(deciNum >> 2, ac_signature)
  ac_signature = countToText((deciNum << 28) | 515, ac_signature)
  ac_signature = countToText((deciNum ^ 1489154074) >>> 6, ac_signature)
  const aloneNum = (deciNum ^ 1489154074) & 63
  const aloneVal = aloneNum < 26 ? 65 : aloneNum < 52 ? 71 : aloneNum < 62 ? -4 : -17
  ac_signature += String.fromCharCode(aloneNum + aloneVal)
  finalNum = 0
  const deciOperaNum = bigCountOperation(deciNum.toString())
  const nonceNum = bigCountOperation(ac_nonce)
  finalNum = deciOperaNum
  bigCountOperation(ua)
  ac_signature = countToText((nonceNum % 65521 | (finalNum % 65521 << 16)) >> 2, ac_signature)
  ac_signature = countToText(
    (((finalNum % 65521 << 16) ^ nonceNum % 65521) << 28) | (((deciNum << 524576) ^ 524576) >>> 4),
    ac_signature,
  )
  ac_signature = countToText(urlNum % 65521, ac_signature)
  for (const char of ac_signature) {
    temp = (temp * 65599 + char.charCodeAt(0)) >>> 0
  }
  ac_signature += temp.toString(16).slice(-2)
  return ac_signature
}
export function get__ac_signature(url: string, ac_nonce: string, ua: string) {
  const one_time_stamp = +new Date()
  function cal_one_str(one_str: string, orgi_iv: number) {
    let k = orgi_iv
    for (let i = 0; i < one_str.length; i++) {
      const a = one_str.charCodeAt(i)
      k = ((k ^ a) * 65599) >>> 0
    }
    return k
  }
  function cal_one_str_3(one_str: string, orgi_iv: number) {
    let k = orgi_iv
    for (let i = 0; i < one_str.length; i++) {
      k = (k * 65599 + one_str.charCodeAt(i)) >>> 0
    }
    return k
  }
  function get_one_chr(enc_chr_code: number) {
    if (enc_chr_code < 26) {
      return String.fromCharCode(enc_chr_code + 65)
    } else if (enc_chr_code < 52) {
      return String.fromCharCode(enc_chr_code + 71)
    } else if (enc_chr_code < 62) {
      return String.fromCharCode(enc_chr_code - 4)
    } else {
      return String.fromCharCode(enc_chr_code - 17)
    }
  }
  function enc_num_to_str(one_orgi_enc: number) {
    let s = ''
    for (let i = 24; i >= 0; i -= 6) {
      s += get_one_chr((one_orgi_enc >> i) & 63)
    }
    return s
  }
  const sign_head = '_02B4Z6wo00101',
    time_stamp_s = one_time_stamp + ''
  const a = cal_one_str(url, cal_one_str(time_stamp_s, 0)) % 65521
  const b = parseInt(
      '10000000110000' +
        parseInt(((one_time_stamp ^ (a * 65521)) >>> 0).toString())
          .toString(2)
          .padStart(32, '0'),
      2,
    ),
    b_s = b + ''
  const c = cal_one_str(b_s, 0)
  const d = enc_num_to_str(b >> 2)
  const e = (b / 4294967296) >>> 0
  const f = enc_num_to_str((b << 28) | (e >>> 4))
  const g = 582085784 ^ b
  const h = enc_num_to_str((e << 26) | (g >>> 6))
  const i = get_one_chr(g & 63)
  const j = (cal_one_str(ua, c) % 65521 << 16) | cal_one_str(ac_nonce, c) % 65521
  const k = enc_num_to_str(j >> 2)
  const l = enc_num_to_str((j << 28) | ((524576 ^ b) >>> 4))
  const m = enc_num_to_str(a)
  const n = sign_head + d + f + h + i + k + l + m
  const o = parseInt(cal_one_str_3(n, 0).toString()).toString(16).slice(-2)
  const signature = n + o
  return signature
}
export function mergeCookies(cookie1: string, cookie2: string) {
  const cookieObj: Record<string, string> = {}
  const parseCookies = (cookie: string) => {
    cookie.split(';').forEach((item) => {
      const [key, value] = item.trim().split('=')
      if (value) {
        cookieObj[key] = value
      }
    })
  }
  parseCookies(cookie1)
  parseCookies(cookie2)
  return Object.keys(cookieObj)
    .map((key) => `${key}=${cookieObj[key]}`)
    .join('; ')
}
export function getCookieValue(cookies: string, key: string) {
  const regex = new RegExp('(?:^| )' + key + '=([^;]*)(?:;|$)', 'gi')
  const match = regex.exec(cookies)
  return match ? decodeURIComponent(match[1]) : ''
}

export function get_ab(dpf: string, ua: string): string {
  function enc_sum(n_str: string): number[] {
    function ir(t: any): string {
      const impl =
        typeof Symbol === 'function' && typeof (Symbol as any).iterator === 'symbol'
          ? function (x: any): string {
              return typeof x
            }
          : function (x: any): string {
              return x &&
                typeof Symbol === 'function' &&
                (x as any).constructor === Symbol &&
                x !== (Symbol as any).prototype
                ? 'symbol'
                : typeof x
            }

      return impl(t)
    }
    function ur(t: any, r: any[]) {
      for (let e = 0; e < r.length; e++) {
        const n = r[e]
        n.enumerable = n.enumerable || !1
        n.configurable = !0
        if ('value' in n) n.writable = !0
        Object.defineProperty(t, sr(n.key), n)
      }
    }
    function sr(t: any) {
      const r = (function (t: any, r: any) {
        if ('object' != ir(t) || !t) return t
        const e = t[Symbol.toPrimitive as any]
        if (void 0 !== e) {
          const n = e.call(t, r || 'default')
          if ('object' != ir(n)) return n
          throw new TypeError('@@toPrimitive must return a primitive value.')
        }
        return ('string' === r ? String : Number)(t)
      })(t, 'string')
      return 'symbol' == ir(r) ? r : r + ''
    }

    const gr = (function () {
      function t(this: { reg?: number[]; chunk?: number[]; size?: number }) {
        ;(function (t: any, r: any) {
          if (!(t instanceof r)) throw new TypeError('Cannot call a class as a function')
        })(this, t)
        if (!(this instanceof t)) return new (t as any)()
        this.reg = new Array(8)
        this.chunk = []
        this.size = 0
        // @ts-ignore
        this.reset()
      }
      ;(function (t: any, r: any[], e?: any[]) {
        r && ur(t.prototype, r)
        e && ur(t, e)
        Object.defineProperty(t, 'prototype', { writable: !1 })
      })(t, [
        {
          key: 'reset',
          value: function (this: any) {
            this.reg[0] = 1937774191
            this.reg[1] = 1226093241
            this.reg[2] = 388252375
            this.reg[3] = 3666478592
            this.reg[4] = 2842636476
            this.reg[5] = 372324522
            this.reg[6] = 3817729613
            this.reg[7] = 2969243214
            this.chunk = []
            this.size = 0
          },
        },
        {
          key: 'write',
          value: function (this: any, t: string | number[]) {
            const r =
              typeof t == 'string'
                ? (function (t: string) {
                    const r = encodeURIComponent(t).replace(/%([0-9A-F]{2})/g, function (_t, r) {
                      return String.fromCharCode(Number('0x' + r))
                    })
                    const e = new Array(r.length)
                    Array.prototype.forEach.call(r, function (t: string, r: number) {
                      e[r] = t.charCodeAt(0)
                    })
                    return e as number[]
                  })(t)
                : t
            this.size += r.length
            let e = 64 - this.chunk.length
            if (r.length < e) {
              this.chunk = this.chunk.concat(r)
            } else {
              this.chunk = this.chunk.concat(r.slice(0, e))
              for (; this.chunk.length >= 64; ) {
                this._compress(this.chunk)
                if (e < r.length) {
                  this.chunk = r.slice(e, Math.min(e + 64, r.length))
                } else {
                  this.chunk = []
                }
                e += 64
              }
            }
          },
        },
        {
          key: 'sum',
          value: function (this: any, t?: string | number[], r?: 'hex') {
            t && (this.reset(), this.write(t as any))
            this._fill()
            for (let e = 0; e < this.chunk.length; e += 64) this._compress(this.chunk.slice(e, e + 64))
            let n: string,
              o: number,
              i: string,
              u: any = null
            if ('hex' == r) {
              u = ''
              for (let e = 0; e < 8; e++) {
                n = this.reg[e].toString(16)
                o = 8
                i = '0'
                u += n.length >= o ? n : i.repeat(o - n.length) + n
              }
            } else {
              u = new Array(32)
              for (let e = 0; e < 8; e++) {
                let s = this.reg[e]
                u[4 * e + 3] = (255 & s) >>> 0
                s >>>= 8
                u[4 * e + 2] = (255 & s) >>> 0
                s >>>= 8
                u[4 * e + 1] = (255 & s) >>> 0
                s >>>= 8
                u[4 * e] = (255 & s) >>> 0
              }
            }
            this.reset()
            return u
          },
        },
        {
          key: '_compress',
          value: function (this: any, t: any) {
            if (t < 64) console.error('compress error: not enough data')
            else {
              const r = (function (t: number[]) {
                const r = new Array(132)
                for (let e = 0; e < 16; e++) {
                  r[e] = t[4 * e] << 24
                  r[e] |= t[4 * e + 1] << 16
                  r[e] |= t[4 * e + 2] << 8
                  r[e] |= t[4 * e + 3]
                  r[e] >>>= 0
                }
                for (let n = 16; n < 68; n++) {
                  let o = r[n - 16] ^ r[n - 9] ^ dr(r[n - 3], 15)
                  o = o ^ dr(o, 15) ^ dr(o, 23)
                  r[n] = (o ^ dr(r[n - 13], 7) ^ r[n - 6]) >>> 0
                }
                for (let n = 0; n < 64; n++) r[n + 68] = (r[n] ^ r[n + 4]) >>> 0
                return r
              })(t)
              const e = this.reg.slice(0)
              for (let n = 0; n < 64; n++) {
                let o = dr(e[0], 12) + e[4] + dr(yr(n), n)
                o = ((o = (4294967295 & o) >>> 0), dr(o, 7))
                const i = (o ^ dr(e[0], 12)) >>> 0
                let u = br(n, e[0], e[1], e[2])
                u = (4294967295 & (u = u + e[3] + i + r[n + 68])) >>> 0
                let s = mr(n, e[4], e[5], e[6])
                s = (4294967295 & (s = s + e[7] + o + r[n])) >>> 0
                e[3] = e[2]
                e[2] = dr(e[1], 9)
                e[1] = e[0]
                e[0] = u
                e[7] = e[6]
                e[6] = dr(e[5], 19)
                e[5] = e[4]
                e[4] = (s ^ dr(s, 9) ^ dr(s, 17)) >>> 0
              }
              for (let c = 0; c < 8; c++) this.reg[c] = (this.reg[c] ^ e[c]) >>> 0
            }
          },
        },
        {
          key: '_fill',
          value: function (this: any) {
            const t = 8 * this.size
            let r = this.chunk.push(128) % 64
            if (64 - r < 8) r -= 64
            for (; r < 56; r++) this.chunk.push(0)
            for (let e = 0; e < 4; e++) {
              const n = Math.floor(t / 4294967296)
              this.chunk.push((n >>> (8 * (3 - e))) & 255)
            }
            for (let e = 0; e < 4; e++) this.chunk.push((t >>> (8 * (3 - e))) & 255)
          },
        },
      ])
      return t as any
    })()

    function dr(t: number, r: number) {
      r %= 32
      return ((t << r) | (t >>> (32 - r))) >>> 0
    }
    function yr(t: number) {
      return 0 <= t && t < 16 ? 2043430169 : 16 <= t && t < 64 ? 2055708042 : 0
    }
    function br(t: number, r: number, e: number, n: number) {
      return 0 <= t && t < 16
        ? (r ^ e ^ n) >>> 0
        : 16 <= t && t < 64
          ? ((r & e) | (r & n) | (e & n)) >>> 0
          : (console.error('invalid j for bool function FF'), 0)
    }
    function mr(t: number, r: number, e: number, n: number) {
      return 0 <= t && t < 16
        ? (r ^ e ^ n) >>> 0
        : 16 <= t && t < 64
          ? ((r & e) | (~r & n)) >>> 0
          : (console.error('invalid j for bool function GG'), 0)
    }

    const enc_ = new (gr as any)()
    return enc_.sum(n_str) as number[]
  }

  function generate_lm_g_EP(ua_n: string = ua) {
    function get_sz256f_2(): number[] {
      const r: number[] = []
      let k = 0
      const y = [0, 1, 0]
      for (let i = 255; i >= 0; i--) {
        r.push(i)
      }
      for (let i = 0; i < r.length; i++) {
        const a = r[i]
        k = (k * a + k + y[i % 3]) % 256
        const b = r[k]
        ;(r[i] = b), (r[k] = a)
      }
      return r
    }
    const sz256f_2 = [
      233, 5, 1, 249, 162, 140, 57, 143, 19, 203, 254, 236, 99, 248, 93, 213, 79, 149, 216, 50, 145, 123, 240, 92, 23,
      113, 130, 53, 235, 220, 201, 136, 223, 155, 190, 242, 243, 42, 52, 214, 151, 232, 97, 187, 163, 222, 30, 78, 47,
      71, 49, 170, 247, 196, 25, 156, 183, 182, 217, 180, 147, 124, 208, 69, 215, 200, 161, 154, 91, 60, 133, 224, 119,
      164, 221, 45, 98, 40, 186, 120, 51, 167, 38, 90, 194, 212, 129, 56, 87, 195, 144, 44, 75, 84, 81, 13, 197, 245,
      36, 250, 115, 100, 105, 252, 206, 103, 112, 202, 114, 138, 192, 21, 116, 173, 181, 29, 82, 125, 141, 16, 211, 131,
      225, 118, 31, 101, 77, 146, 135, 150, 62, 66, 67, 176, 0, 41, 46, 59, 107, 178, 43, 26, 189, 128, 8, 207, 166,
      110, 3, 229, 85, 54, 63, 11, 32, 4, 234, 142, 72, 58, 33, 231, 12, 230, 102, 86, 70, 159, 226, 65, 237, 34, 244,
      76, 132, 122, 111, 95, 179, 152, 175, 18, 177, 6, 126, 193, 219, 74, 134, 2, 61, 251, 191, 168, 209, 241, 137,
      165, 88, 238, 160, 174, 153, 157, 199, 48, 22, 64, 246, 7, 139, 55, 27, 188, 148, 204, 127, 171, 89, 37, 172, 205,
      121, 20, 28, 17, 169, 15, 227, 117, 80, 218, 198, 10, 106, 9, 39, 210, 104, 83, 109, 24, 108, 228, 184, 96, 185,
      158, 14, 255, 239, 68, 94, 35, 73, 253,
    ]
    let k = 0,
      s = ''
    for (let i = 0; i < ua_n.length; i++) {
      const i1 = (i + 1) % 256
      const a = sz256f_2[i1]
      k = (k + a) % 256
      const c = sz256f_2[k]
      sz256f_2[i1] = c
      sz256f_2[k] = a
      s += String.fromCharCode(ua_n.charCodeAt(i) ^ sz256f_2[(a + c) % 256])
    }
    return s
  }

  function get_str_chr_list(one_str: string): number[] {
    const r: number[] = [] // 当然也可以用map实现
    for (let i = 0; i < one_str.length; i++) {
      r.push(one_str.charCodeAt(i))
    }
    return r
  }

  function generate_szenc_head8p1(): number[] {
    const z = Math.random() * 65535
    const a = z & 255
    const b = (z >> 8) & 255
    const d: number[] = []
    d.push((a & 170) | 1)
    d.push((a & 85) | 0)
    d.push((b & 170) | 0)
    d.push((b & 85) | 0)
    return d
  }

  function generate_szenc_head8p2(): number[] {
    const a = ((Math.random() * 240) >> 0) + 1
    let b = ((Math.random() * 255) >> 0) & 77,
      c = [1, 4, 5, 7],
      d: number[] = []
    for (let i = 0; i < c.length; i++) {
      b = b | (1 << c[i])
    }
    d.push((a & 170) | 1)
    d.push((a & 85) | 0)
    d.push((b & 170) | 0)
    d.push((b & 85) | 0)
    return d
  }

  function get_szenc_tail(sz96_n: number[]): number[] {
    const key_sz_6 = [145, 110, 66, 189, 44, 211]
    const a: number[] = []
    for (let i = 0; i < 94; i += 3) {
      const b = sz96_n[i]
      const c = sz96_n[i + 1]
      const d = sz96_n[i + 2]
      const e = (Math.random() * 1000) & 255
      a.push((e & key_sz_6[0]) | (b & key_sz_6[1]))
      a.push((e & key_sz_6[2]) | (c & key_sz_6[3]))
      a.push((e & key_sz_6[4]) | (d & key_sz_6[5]))
      a.push((b & key_sz_6[0]) | (c & key_sz_6[2]) | (d & key_sz_6[4]))
    }
    return a
  }

  function generate_lm_g_ab_head4(): string {
    let s = ''
    const a = (Math.random() * 65535) & 255,
      b = (Math.random() * 40) >> 0
    s += String.fromCharCode((a & 170) | 1)
    s += String.fromCharCode((a & 85) | 2)
    s += String.fromCharCode((b & 170) | 80)
    s += String.fromCharCode((b & 85) | 2)
    return s
  }

  function get_list_str(one_list: number[]): string {
    let s = ''
    for (let i = 0; i < one_list.length; i++) {
      s += String.fromCharCode(one_list[i])
    }
    return s
  }

  function get_lm_g_ab(lm_g_lm_n: string): string {
    function get_sz256(): number[] {
      const raw: number[] = []
      let z = 0
      for (let i = 255; i >= 0; i--) {
        raw.push(i)
      }
      for (let i = 0; i < raw.length; i++) {
        z += 211
        const a = z % 256
        const b = raw[i]
        const c = raw[a]
        raw[a] = b
        raw[i] = c
        z = raw[i + 1] * a + a
      }
      return raw
    }
    const fixed_sz256_n = get_sz256()
    let z = 0
    let st = ''
    for (let i = 0; i < lm_g_lm_n.length; i++) {
      const a = (i + 1) % 256
      const c = fixed_sz256_n[a]
      z = (z + c) % 256
      const e = fixed_sz256_n[z]
      fixed_sz256_n[a] = e
      fixed_sz256_n[z] = c
      const g = (e + c) % 256
      const h = lm_g_lm_n.charCodeAt(i)
      const j = fixed_sz256_n[g]
      const k = h ^ j
      const l = String.fromCharCode(k)
      st += l
    }
    return st
  }

  function get_raw_ab(lm_get_ab_n: string, key_str: string = info_dic.s4): string {
    let s = '',
      bw = 0
    for (let i = 0; i < lm_get_ab_n.length; i += 3) {
      let cl = 16
      let tcz = 0
      let sof = 16515072
      for (let j = i; j < i + 3; j++) {
        if (j < lm_get_ab_n.length) {
          const tlcy = lm_get_ab_n.charCodeAt(j) & 255
          tcz = tcz | (tlcy << cl)
          cl -= 8
        } else {
          bw += 1
        }
      }
      for (let h = 18; h >= 6 * bw; h -= 6) {
        const tsz = tcz & sof
        s += key_str[tsz >> h]
        sof = sof / 64
      }
      s += '='.repeat(bw)
    }
    return s
  }

  function get_random_number(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const info_dic = {
    s0: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    s1: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s2: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s3: 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe',
    s4: 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe',
  }

  const t1 = Date.now()
  const s: any[] = []

  const t2 = Date.now() - 1 + get_random_number(1, 3)
  const EP = get_raw_ab(generate_lm_g_EP(ua), info_dic.s3),
    eEP = enc_sum(EP)
  s.push('env_fx_list', 'dpf_ua_dic', 1, 0, 8, 'dpf', '', 'ua', 6241, 6383, '1.0.1.19-fix.01', 'ink', 3, '0X21_dic')

  const t3 = Date.now() + get_random_number(4, 15)
  const eedp = enc_sum(enc_sum(dpf + 'dhzx') as unknown as string)
  s.push(t3, 'reg_dic', 1, 0, eedp, 'eedh', EP, eEP, t2, [3, 82], 41, [1, 0, 1, 0, 1])

  const t4 = Date.now() + get_random_number(100, 1000)
  const s1 = ((t4 - 1721836800000) / 1000 / 60 / 60 / 24 / 14) >> 0
  const szenc_o95_tail41 = [
    49, 52, 52, 49, 124, 56, 51, 56, 124, 49, 52, 52, 49, 124, 57, 49, 51, 124, 49, 52, 52, 49, 124, 57, 49, 51, 124,
    49, 52, 52, 49, 124, 57, 54, 49, 124, 87, 105, 110, 51, 50,
  ]
  //1441|838|1441|913|1441|913|1441|961|Win32
  s.push(
    s1,
    6,
    (t3 - t1 + 3) & 255,
    t3 & 255,
    (t3 >> 8) & 255,
    (t3 >> 16) & 255,
    (t3 >> 24) & 255,
    (t3 / 256 / 256 / 256 / 256) & 255,
  )

  const s2 = (t3 / 256 / 256 / 256 / 256 / 256) & 255
  s.push(
    s2,
    s2 % 256 & 255,
    (s2 / 256) & 255,
    [211, 2, 5, 1, 129],
    129,
    0,
    211,
    2,
    5,
    1,
    0,
    0,
    0,
    0,
    (eedp as number[])[9],
    (eedp as number[])[18],
    3,
    (eedp as number[])[3],
    82,
    177,
    4,
    44,
    (eEP as number[])[11],
    (eEP as number[])[21],
    5,
    (eEP as number[])[5],
    t2 & 255,
    (t2 >> 8) & 255,
    (t2 >> 16) & 255,
    (t2 >> 24) & 255,
    (t2 / 256 / 256 / 256 / 256) & 255,
    (t2 / 256 / 256 / 256 / 256 / 256) & 255,
    3,
    97,
    24,
    0,
    0,
    239,
    24,
    0,
    0,
    'screec_dic',
    'screen_str',
    szenc_o95_tail41,
    41,
    41,
    0,
  )

  const s3 = ((t3 + 3) & 255) + ','
  const s4 = get_str_chr_list(s3)
  s.push(s3, s4, s4.length, s4.length & 255, (s4.length >> 8) & 255)

  const szenc_head8_p1 = generate_szenc_head8p1()
  const szenc_head8_p2 = generate_szenc_head8p2()
  const szenc_head8 = szenc_head8_p1.concat(szenc_head8_p2)
  const s5: any[] = []
  const s6 = [
    24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 55, 56,
    57, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 79, 80, 84, 85,
  ]
  for (let i = 0; i < s6.length; i++) {
    s5.push(s[s6[i]])
  }
  s.push(szenc_head8)

  const s7 = szenc_head8.concat(s5)
  let s8 = s7[0] as number
  for (let i = 1; i < s7.length; i++) {
    s8 = s8 ^ (s7[i] as number)
  }
  s.push(s8)

  const enc_s_i = [
    34, 44, 56, 61, 73, 29, 70, 45, 35, 49, 38, 66, 51, 68, 28, 48, 64, 47, 30, 71, 26, 55, 31, 69, 59, 40, 62, 63, 27,
    72, 41, 74, 57, 52, 42, 39, 33, 67, 53, 43, 65, 46, 36, 24, 60, 32, 79, 80, 84, 85,
  ]
  const szenc_o95_head50: any[] = []
  for (let i = 0; i < enc_s_i.length; i++) {
    szenc_o95_head50.push(s[enc_s_i[i]])
  }

  let szenc_o95: any[] = []
  szenc_o95 = szenc_o95.concat(szenc_o95_head50, szenc_o95_tail41, s4, [s8])

  const szenc_tail = get_szenc_tail(szenc_o95)
  const szenc = szenc_head8.concat(szenc_tail)

  const lm_get_ab_head4 = generate_lm_g_ab_head4()

  const lm_get_lm = get_list_str(szenc)
  const lm_get_ab_tail = get_lm_g_ab(lm_get_lm)
  const lm_get_ab = lm_get_ab_head4 + lm_get_ab_tail
  const ab = get_raw_ab(lm_get_ab)
  return ab
}
