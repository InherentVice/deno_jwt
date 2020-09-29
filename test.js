// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiate;
(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };
  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }
  __instantiate = (m, a) => {
    System = __instantiate = undefined;
    rF(m);
    return a ? gExpA(m) : gExp(m);
  };
})();

System.register("https://deno.land/x/dotenv@v0.5.0/util", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function trim(val) {
        return val.trim();
    }
    exports_1("trim", trim);
    function compact(obj) {
        return Object.keys(obj).reduce((result, key) => {
            if (obj[key]) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    }
    exports_1("compact", compact);
    function difference(arrA, arrB) {
        return arrA.filter((a) => arrB.indexOf(a) < 0);
    }
    exports_1("difference", difference);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/dotenv@v0.5.0/mod", ["https://deno.land/x/dotenv@v0.5.0/util"], function (exports_2, context_2) {
    "use strict";
    var util_ts_1, MissingEnvVarsError;
    var __moduleName = context_2 && context_2.id;
    function parse(rawDotenv) {
        return rawDotenv.split("\n").reduce((acc, line) => {
            if (!isVariableStart(line))
                return acc;
            let [key, ...vals] = line.split("=");
            let value = util_ts_1.trim(vals.join("="));
            if (/^"/.test(value)) {
                value = expandNewlines(value);
            }
            acc[util_ts_1.trim(key)] = util_ts_1.trim(cleanQuotes(value));
            return acc;
        }, {});
    }
    exports_2("parse", parse);
    function config(options = {}) {
        const o = Object.assign({
            path: `.env`,
            export: false,
            safe: false,
            example: `.env.example`,
            allowEmptyValues: false,
            defaults: `.env.defaults`,
        }, options);
        const conf = parseFile(o.path);
        if (o.safe) {
            const confExample = parseFile(o.example);
            assertSafe(conf, confExample, o.allowEmptyValues);
        }
        if (o.defaults) {
            const confDefaults = parseFile(o.defaults);
            for (let key in confDefaults) {
                if (!(key in conf)) {
                    conf[key] = confDefaults[key];
                }
            }
        }
        if (o.export) {
            for (let key in conf) {
                Deno.env.set(key, conf[key]);
            }
        }
        return conf;
    }
    exports_2("config", config);
    function parseFile(filepath) {
        try {
            return parse(new TextDecoder("utf-8").decode(Deno.readFileSync(filepath)));
        }
        catch (e) {
            if (e instanceof Deno.errors.NotFound)
                return {};
            throw e;
        }
    }
    function isVariableStart(str) {
        return /^\s*?[a-zA-Z_][a-zA-Z_0-9 ]*=/.test(str);
    }
    function cleanQuotes(value = "") {
        return value.replace(/^['"]([\s\S]*)['"]$/gm, "$1");
    }
    function expandNewlines(str) {
        return str.replace("\\n", "\n");
    }
    function assertSafe(conf, confExample, allowEmptyValues) {
        const currentEnv = Deno.env.toObject();
        const confWithEnv = Object.assign({}, currentEnv, conf);
        const missing = util_ts_1.difference(Object.keys(confExample), Object.keys(allowEmptyValues ? confWithEnv : util_ts_1.compact(confWithEnv)));
        if (missing.length > 0) {
            const errorMessages = [
                `The following variables were defined in the example file but are not present in the environment:\n  ${missing.join(", ")}`,
                `Make sure to add them to your env file.`,
                !allowEmptyValues &&
                    `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`,
            ];
            throw new MissingEnvVarsError(errorMessages.filter(Boolean).join("\n\n"));
        }
    }
    return {
        setters: [
            function (util_ts_1_1) {
                util_ts_1 = util_ts_1_1;
            }
        ],
        execute: function () {
            MissingEnvVarsError = class MissingEnvVarsError extends Error {
                constructor(message) {
                    super(message);
                    this.name = "MissingEnvVarsError";
                    Object.setPrototypeOf(this, new.target.prototype);
                }
            };
            exports_2("MissingEnvVarsError", MissingEnvVarsError);
        }
    };
});
System.register("https://deno.land/std@0.61.0/bytes/mod", [], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    function findIndex(source, pat) {
        const s = pat[0];
        for (let i = 0; i < source.length; i++) {
            if (source[i] !== s)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j++;
                if (source[j] !== pat[j - pin]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin;
            }
        }
        return -1;
    }
    exports_3("findIndex", findIndex);
    function findLastIndex(source, pat) {
        const e = pat[pat.length - 1];
        for (let i = source.length - 1; i >= 0; i--) {
            if (source[i] !== e)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j--;
                if (source[j] !== pat[pat.length - 1 - (pin - j)]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin - pat.length + 1;
            }
        }
        return -1;
    }
    exports_3("findLastIndex", findLastIndex);
    function equal(source, match) {
        if (source.length !== match.length)
            return false;
        for (let i = 0; i < match.length; i++) {
            if (source[i] !== match[i])
                return false;
        }
        return true;
    }
    exports_3("equal", equal);
    function hasPrefix(source, prefix) {
        for (let i = 0, max = prefix.length; i < max; i++) {
            if (source[i] !== prefix[i])
                return false;
        }
        return true;
    }
    exports_3("hasPrefix", hasPrefix);
    function hasSuffix(source, suffix) {
        for (let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--) {
            if (source[srci] !== suffix[sfxi])
                return false;
        }
        return true;
    }
    exports_3("hasSuffix", hasSuffix);
    function repeat(origin, count) {
        if (count === 0) {
            return new Uint8Array();
        }
        if (count < 0) {
            throw new Error("bytes: negative repeat count");
        }
        else if ((origin.length * count) / count !== origin.length) {
            throw new Error("bytes: repeat count causes overflow");
        }
        const int = Math.floor(count);
        if (int !== count) {
            throw new Error("bytes: repeat count must be an integer");
        }
        const nb = new Uint8Array(origin.length * count);
        let bp = copyBytes(origin, nb);
        for (; bp < nb.length; bp *= 2) {
            copyBytes(nb.slice(0, bp), nb, bp);
        }
        return nb;
    }
    exports_3("repeat", repeat);
    function concat(origin, b) {
        const output = new Uint8Array(origin.length + b.length);
        output.set(origin, 0);
        output.set(b, origin.length);
        return output;
    }
    exports_3("concat", concat);
    function contains(source, pat) {
        return findIndex(source, pat) != -1;
    }
    exports_3("contains", contains);
    function copyBytes(src, dst, off = 0) {
        off = Math.max(0, Math.min(off, dst.byteLength));
        const dstBytesAvailable = dst.byteLength - off;
        if (src.byteLength > dstBytesAvailable) {
            src = src.subarray(0, dstBytesAvailable);
        }
        dst.set(src, off);
        return src.byteLength;
    }
    exports_3("copyBytes", copyBytes);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/hash/sha1", [], function (exports_4, context_4) {
    "use strict";
    var HEX_CHARS, EXTRA, SHIFT, blocks, Sha1;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            HEX_CHARS = "0123456789abcdef".split("");
            EXTRA = [-2147483648, 8388608, 32768, 128];
            SHIFT = [24, 16, 8, 0];
            blocks = [];
            Sha1 = class Sha1 {
                constructor(sharedMemory = false) {
                    this.#h0 = 0x67452301;
                    this.#h1 = 0xefcdab89;
                    this.#h2 = 0x98badcfe;
                    this.#h3 = 0x10325476;
                    this.#h4 = 0xc3d2e1f0;
                    this.#lastByteIndex = 0;
                    if (sharedMemory) {
                        blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        this.#blocks = blocks;
                    }
                    else {
                        this.#blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                    this.#h0 = 0x67452301;
                    this.#h1 = 0xefcdab89;
                    this.#h2 = 0x98badcfe;
                    this.#h3 = 0x10325476;
                    this.#h4 = 0xc3d2e1f0;
                    this.#block = this.#start = this.#bytes = this.#hBytes = 0;
                    this.#finalized = this.#hashed = false;
                }
                #blocks;
                #block;
                #start;
                #bytes;
                #hBytes;
                #finalized;
                #hashed;
                #h0;
                #h1;
                #h2;
                #h3;
                #h4;
                #lastByteIndex;
                update(message) {
                    if (this.#finalized) {
                        return this;
                    }
                    let msg;
                    if (message instanceof ArrayBuffer) {
                        msg = new Uint8Array(message);
                    }
                    else {
                        msg = message;
                    }
                    let index = 0;
                    const length = msg.length;
                    const blocks = this.#blocks;
                    while (index < length) {
                        let i;
                        if (this.#hashed) {
                            this.#hashed = false;
                            blocks[0] = this.#block;
                            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        }
                        if (typeof msg !== "string") {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                            }
                        }
                        else {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                let code = msg.charCodeAt(index);
                                if (code < 0x80) {
                                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                                }
                                else if (code < 0x800) {
                                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else if (code < 0xd800 || code >= 0xe000) {
                                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else {
                                    code =
                                        0x10000 +
                                            (((code & 0x3ff) << 10) | (msg.charCodeAt(++index) & 0x3ff));
                                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                            }
                        }
                        this.#lastByteIndex = i;
                        this.#bytes += i - this.#start;
                        if (i >= 64) {
                            this.#block = blocks[16];
                            this.#start = i - 64;
                            this.hash();
                            this.#hashed = true;
                        }
                        else {
                            this.#start = i;
                        }
                    }
                    if (this.#bytes > 4294967295) {
                        this.#hBytes += (this.#bytes / 4294967296) >>> 0;
                        this.#bytes = this.#bytes >>> 0;
                    }
                    return this;
                }
                finalize() {
                    if (this.#finalized) {
                        return;
                    }
                    this.#finalized = true;
                    const blocks = this.#blocks;
                    const i = this.#lastByteIndex;
                    blocks[16] = this.#block;
                    blocks[i >> 2] |= EXTRA[i & 3];
                    this.#block = blocks[16];
                    if (i >= 56) {
                        if (!this.#hashed) {
                            this.hash();
                        }
                        blocks[0] = this.#block;
                        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                    }
                    blocks[14] = (this.#hBytes << 3) | (this.#bytes >>> 29);
                    blocks[15] = this.#bytes << 3;
                    this.hash();
                }
                hash() {
                    let a = this.#h0;
                    let b = this.#h1;
                    let c = this.#h2;
                    let d = this.#h3;
                    let e = this.#h4;
                    let f;
                    let j;
                    let t;
                    const blocks = this.#blocks;
                    for (j = 16; j < 80; ++j) {
                        t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
                        blocks[j] = (t << 1) | (t >>> 31);
                    }
                    for (j = 0; j < 20; j += 5) {
                        f = (b & c) | (~b & d);
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e + 1518500249 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = (a & b) | (~a & c);
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d + 1518500249 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = (e & a) | (~e & b);
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c + 1518500249 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = (d & e) | (~d & a);
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b + 1518500249 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = (c & d) | (~c & e);
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a + 1518500249 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 40; j += 5) {
                        f = b ^ c ^ d;
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e + 1859775393 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = a ^ b ^ c;
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d + 1859775393 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = e ^ a ^ b;
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c + 1859775393 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = d ^ e ^ a;
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b + 1859775393 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = c ^ d ^ e;
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a + 1859775393 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 60; j += 5) {
                        f = (b & c) | (b & d) | (c & d);
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e - 1894007588 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = (a & b) | (a & c) | (b & c);
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d - 1894007588 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = (e & a) | (e & b) | (a & b);
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c - 1894007588 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = (d & e) | (d & a) | (e & a);
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b - 1894007588 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = (c & d) | (c & e) | (d & e);
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a - 1894007588 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    for (; j < 80; j += 5) {
                        f = b ^ c ^ d;
                        t = (a << 5) | (a >>> 27);
                        e = (t + f + e - 899497514 + blocks[j]) >>> 0;
                        b = (b << 30) | (b >>> 2);
                        f = a ^ b ^ c;
                        t = (e << 5) | (e >>> 27);
                        d = (t + f + d - 899497514 + blocks[j + 1]) >>> 0;
                        a = (a << 30) | (a >>> 2);
                        f = e ^ a ^ b;
                        t = (d << 5) | (d >>> 27);
                        c = (t + f + c - 899497514 + blocks[j + 2]) >>> 0;
                        e = (e << 30) | (e >>> 2);
                        f = d ^ e ^ a;
                        t = (c << 5) | (c >>> 27);
                        b = (t + f + b - 899497514 + blocks[j + 3]) >>> 0;
                        d = (d << 30) | (d >>> 2);
                        f = c ^ d ^ e;
                        t = (b << 5) | (b >>> 27);
                        a = (t + f + a - 899497514 + blocks[j + 4]) >>> 0;
                        c = (c << 30) | (c >>> 2);
                    }
                    this.#h0 = (this.#h0 + a) >>> 0;
                    this.#h1 = (this.#h1 + b) >>> 0;
                    this.#h2 = (this.#h2 + c) >>> 0;
                    this.#h3 = (this.#h3 + d) >>> 0;
                    this.#h4 = (this.#h4 + e) >>> 0;
                }
                hex() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    return (HEX_CHARS[(h0 >> 28) & 0x0f] +
                        HEX_CHARS[(h0 >> 24) & 0x0f] +
                        HEX_CHARS[(h0 >> 20) & 0x0f] +
                        HEX_CHARS[(h0 >> 16) & 0x0f] +
                        HEX_CHARS[(h0 >> 12) & 0x0f] +
                        HEX_CHARS[(h0 >> 8) & 0x0f] +
                        HEX_CHARS[(h0 >> 4) & 0x0f] +
                        HEX_CHARS[h0 & 0x0f] +
                        HEX_CHARS[(h1 >> 28) & 0x0f] +
                        HEX_CHARS[(h1 >> 24) & 0x0f] +
                        HEX_CHARS[(h1 >> 20) & 0x0f] +
                        HEX_CHARS[(h1 >> 16) & 0x0f] +
                        HEX_CHARS[(h1 >> 12) & 0x0f] +
                        HEX_CHARS[(h1 >> 8) & 0x0f] +
                        HEX_CHARS[(h1 >> 4) & 0x0f] +
                        HEX_CHARS[h1 & 0x0f] +
                        HEX_CHARS[(h2 >> 28) & 0x0f] +
                        HEX_CHARS[(h2 >> 24) & 0x0f] +
                        HEX_CHARS[(h2 >> 20) & 0x0f] +
                        HEX_CHARS[(h2 >> 16) & 0x0f] +
                        HEX_CHARS[(h2 >> 12) & 0x0f] +
                        HEX_CHARS[(h2 >> 8) & 0x0f] +
                        HEX_CHARS[(h2 >> 4) & 0x0f] +
                        HEX_CHARS[h2 & 0x0f] +
                        HEX_CHARS[(h3 >> 28) & 0x0f] +
                        HEX_CHARS[(h3 >> 24) & 0x0f] +
                        HEX_CHARS[(h3 >> 20) & 0x0f] +
                        HEX_CHARS[(h3 >> 16) & 0x0f] +
                        HEX_CHARS[(h3 >> 12) & 0x0f] +
                        HEX_CHARS[(h3 >> 8) & 0x0f] +
                        HEX_CHARS[(h3 >> 4) & 0x0f] +
                        HEX_CHARS[h3 & 0x0f] +
                        HEX_CHARS[(h4 >> 28) & 0x0f] +
                        HEX_CHARS[(h4 >> 24) & 0x0f] +
                        HEX_CHARS[(h4 >> 20) & 0x0f] +
                        HEX_CHARS[(h4 >> 16) & 0x0f] +
                        HEX_CHARS[(h4 >> 12) & 0x0f] +
                        HEX_CHARS[(h4 >> 8) & 0x0f] +
                        HEX_CHARS[(h4 >> 4) & 0x0f] +
                        HEX_CHARS[h4 & 0x0f]);
                }
                toString() {
                    return this.hex();
                }
                digest() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    return [
                        (h0 >> 24) & 0xff,
                        (h0 >> 16) & 0xff,
                        (h0 >> 8) & 0xff,
                        h0 & 0xff,
                        (h1 >> 24) & 0xff,
                        (h1 >> 16) & 0xff,
                        (h1 >> 8) & 0xff,
                        h1 & 0xff,
                        (h2 >> 24) & 0xff,
                        (h2 >> 16) & 0xff,
                        (h2 >> 8) & 0xff,
                        h2 & 0xff,
                        (h3 >> 24) & 0xff,
                        (h3 >> 16) & 0xff,
                        (h3 >> 8) & 0xff,
                        h3 & 0xff,
                        (h4 >> 24) & 0xff,
                        (h4 >> 16) & 0xff,
                        (h4 >> 8) & 0xff,
                        h4 & 0xff,
                    ];
                }
                array() {
                    return this.digest();
                }
                arrayBuffer() {
                    this.finalize();
                    const buffer = new ArrayBuffer(20);
                    const dataView = new DataView(buffer);
                    dataView.setUint32(0, this.#h0);
                    dataView.setUint32(4, this.#h1);
                    dataView.setUint32(8, this.#h2);
                    dataView.setUint32(12, this.#h3);
                    dataView.setUint32(16, this.#h4);
                    return buffer;
                }
            };
            exports_4("Sha1", Sha1);
        }
    };
});
System.register("https://deno.land/std@0.61.0/hash/sha256", [], function (exports_5, context_5) {
    "use strict";
    var HEX_CHARS, EXTRA, SHIFT, K, blocks, Sha256, HmacSha256;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [],
        execute: function () {
            HEX_CHARS = "0123456789abcdef".split("");
            EXTRA = [-2147483648, 8388608, 32768, 128];
            SHIFT = [24, 16, 8, 0];
            K = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
                0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
                0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
                0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
                0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
                0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
                0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
                0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
                0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
            ];
            blocks = [];
            Sha256 = class Sha256 {
                constructor(is224 = false, sharedMemory = false) {
                    this.#lastByteIndex = 0;
                    this.init(is224, sharedMemory);
                }
                #block;
                #blocks;
                #bytes;
                #finalized;
                #first;
                #h0;
                #h1;
                #h2;
                #h3;
                #h4;
                #h5;
                #h6;
                #h7;
                #hashed;
                #hBytes;
                #is224;
                #lastByteIndex;
                #start;
                init(is224, sharedMemory) {
                    if (sharedMemory) {
                        blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        this.#blocks = blocks;
                    }
                    else {
                        this.#blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                    if (is224) {
                        this.#h0 = 0xc1059ed8;
                        this.#h1 = 0x367cd507;
                        this.#h2 = 0x3070dd17;
                        this.#h3 = 0xf70e5939;
                        this.#h4 = 0xffc00b31;
                        this.#h5 = 0x68581511;
                        this.#h6 = 0x64f98fa7;
                        this.#h7 = 0xbefa4fa4;
                    }
                    else {
                        this.#h0 = 0x6a09e667;
                        this.#h1 = 0xbb67ae85;
                        this.#h2 = 0x3c6ef372;
                        this.#h3 = 0xa54ff53a;
                        this.#h4 = 0x510e527f;
                        this.#h5 = 0x9b05688c;
                        this.#h6 = 0x1f83d9ab;
                        this.#h7 = 0x5be0cd19;
                    }
                    this.#block = this.#start = this.#bytes = this.#hBytes = 0;
                    this.#finalized = this.#hashed = false;
                    this.#first = true;
                    this.#is224 = is224;
                }
                update(message) {
                    if (this.#finalized) {
                        return this;
                    }
                    let msg;
                    if (message instanceof ArrayBuffer) {
                        msg = new Uint8Array(message);
                    }
                    else {
                        msg = message;
                    }
                    let index = 0;
                    const length = msg.length;
                    const blocks = this.#blocks;
                    while (index < length) {
                        let i;
                        if (this.#hashed) {
                            this.#hashed = false;
                            blocks[0] = this.#block;
                            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        }
                        if (typeof msg !== "string") {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                            }
                        }
                        else {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                let code = msg.charCodeAt(index);
                                if (code < 0x80) {
                                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                                }
                                else if (code < 0x800) {
                                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else if (code < 0xd800 || code >= 0xe000) {
                                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else {
                                    code =
                                        0x10000 +
                                            (((code & 0x3ff) << 10) | (msg.charCodeAt(++index) & 0x3ff));
                                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                            }
                        }
                        this.#lastByteIndex = i;
                        this.#bytes += i - this.#start;
                        if (i >= 64) {
                            this.#block = blocks[16];
                            this.#start = i - 64;
                            this.hash();
                            this.#hashed = true;
                        }
                        else {
                            this.#start = i;
                        }
                    }
                    if (this.#bytes > 4294967295) {
                        this.#hBytes += (this.#bytes / 4294967296) << 0;
                        this.#bytes = this.#bytes % 4294967296;
                    }
                    return this;
                }
                finalize() {
                    if (this.#finalized) {
                        return;
                    }
                    this.#finalized = true;
                    const blocks = this.#blocks;
                    const i = this.#lastByteIndex;
                    blocks[16] = this.#block;
                    blocks[i >> 2] |= EXTRA[i & 3];
                    this.#block = blocks[16];
                    if (i >= 56) {
                        if (!this.#hashed) {
                            this.hash();
                        }
                        blocks[0] = this.#block;
                        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                    }
                    blocks[14] = (this.#hBytes << 3) | (this.#bytes >>> 29);
                    blocks[15] = this.#bytes << 3;
                    this.hash();
                }
                hash() {
                    let a = this.#h0;
                    let b = this.#h1;
                    let c = this.#h2;
                    let d = this.#h3;
                    let e = this.#h4;
                    let f = this.#h5;
                    let g = this.#h6;
                    let h = this.#h7;
                    const blocks = this.#blocks;
                    let s0;
                    let s1;
                    let maj;
                    let t1;
                    let t2;
                    let ch;
                    let ab;
                    let da;
                    let cd;
                    let bc;
                    for (let j = 16; j < 64; ++j) {
                        t1 = blocks[j - 15];
                        s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
                        t1 = blocks[j - 2];
                        s1 =
                            ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
                        blocks[j] = (blocks[j - 16] + s0 + blocks[j - 7] + s1) << 0;
                    }
                    bc = b & c;
                    for (let j = 0; j < 64; j += 4) {
                        if (this.#first) {
                            if (this.#is224) {
                                ab = 300032;
                                t1 = blocks[0] - 1413257819;
                                h = (t1 - 150054599) << 0;
                                d = (t1 + 24177077) << 0;
                            }
                            else {
                                ab = 704751109;
                                t1 = blocks[0] - 210244248;
                                h = (t1 - 1521486534) << 0;
                                d = (t1 + 143694565) << 0;
                            }
                            this.#first = false;
                        }
                        else {
                            s0 =
                                ((a >>> 2) | (a << 30)) ^
                                    ((a >>> 13) | (a << 19)) ^
                                    ((a >>> 22) | (a << 10));
                            s1 =
                                ((e >>> 6) | (e << 26)) ^
                                    ((e >>> 11) | (e << 21)) ^
                                    ((e >>> 25) | (e << 7));
                            ab = a & b;
                            maj = ab ^ (a & c) ^ bc;
                            ch = (e & f) ^ (~e & g);
                            t1 = h + s1 + ch + K[j] + blocks[j];
                            t2 = s0 + maj;
                            h = (d + t1) << 0;
                            d = (t1 + t2) << 0;
                        }
                        s0 =
                            ((d >>> 2) | (d << 30)) ^
                                ((d >>> 13) | (d << 19)) ^
                                ((d >>> 22) | (d << 10));
                        s1 =
                            ((h >>> 6) | (h << 26)) ^
                                ((h >>> 11) | (h << 21)) ^
                                ((h >>> 25) | (h << 7));
                        da = d & a;
                        maj = da ^ (d & b) ^ ab;
                        ch = (h & e) ^ (~h & f);
                        t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
                        t2 = s0 + maj;
                        g = (c + t1) << 0;
                        c = (t1 + t2) << 0;
                        s0 =
                            ((c >>> 2) | (c << 30)) ^
                                ((c >>> 13) | (c << 19)) ^
                                ((c >>> 22) | (c << 10));
                        s1 =
                            ((g >>> 6) | (g << 26)) ^
                                ((g >>> 11) | (g << 21)) ^
                                ((g >>> 25) | (g << 7));
                        cd = c & d;
                        maj = cd ^ (c & a) ^ da;
                        ch = (g & h) ^ (~g & e);
                        t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
                        t2 = s0 + maj;
                        f = (b + t1) << 0;
                        b = (t1 + t2) << 0;
                        s0 =
                            ((b >>> 2) | (b << 30)) ^
                                ((b >>> 13) | (b << 19)) ^
                                ((b >>> 22) | (b << 10));
                        s1 =
                            ((f >>> 6) | (f << 26)) ^
                                ((f >>> 11) | (f << 21)) ^
                                ((f >>> 25) | (f << 7));
                        bc = b & c;
                        maj = bc ^ (b & d) ^ cd;
                        ch = (f & g) ^ (~f & h);
                        t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
                        t2 = s0 + maj;
                        e = (a + t1) << 0;
                        a = (t1 + t2) << 0;
                    }
                    this.#h0 = (this.#h0 + a) << 0;
                    this.#h1 = (this.#h1 + b) << 0;
                    this.#h2 = (this.#h2 + c) << 0;
                    this.#h3 = (this.#h3 + d) << 0;
                    this.#h4 = (this.#h4 + e) << 0;
                    this.#h5 = (this.#h5 + f) << 0;
                    this.#h6 = (this.#h6 + g) << 0;
                    this.#h7 = (this.#h7 + h) << 0;
                }
                hex() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    const h5 = this.#h5;
                    const h6 = this.#h6;
                    const h7 = this.#h7;
                    let hex = HEX_CHARS[(h0 >> 28) & 0x0f] +
                        HEX_CHARS[(h0 >> 24) & 0x0f] +
                        HEX_CHARS[(h0 >> 20) & 0x0f] +
                        HEX_CHARS[(h0 >> 16) & 0x0f] +
                        HEX_CHARS[(h0 >> 12) & 0x0f] +
                        HEX_CHARS[(h0 >> 8) & 0x0f] +
                        HEX_CHARS[(h0 >> 4) & 0x0f] +
                        HEX_CHARS[h0 & 0x0f] +
                        HEX_CHARS[(h1 >> 28) & 0x0f] +
                        HEX_CHARS[(h1 >> 24) & 0x0f] +
                        HEX_CHARS[(h1 >> 20) & 0x0f] +
                        HEX_CHARS[(h1 >> 16) & 0x0f] +
                        HEX_CHARS[(h1 >> 12) & 0x0f] +
                        HEX_CHARS[(h1 >> 8) & 0x0f] +
                        HEX_CHARS[(h1 >> 4) & 0x0f] +
                        HEX_CHARS[h1 & 0x0f] +
                        HEX_CHARS[(h2 >> 28) & 0x0f] +
                        HEX_CHARS[(h2 >> 24) & 0x0f] +
                        HEX_CHARS[(h2 >> 20) & 0x0f] +
                        HEX_CHARS[(h2 >> 16) & 0x0f] +
                        HEX_CHARS[(h2 >> 12) & 0x0f] +
                        HEX_CHARS[(h2 >> 8) & 0x0f] +
                        HEX_CHARS[(h2 >> 4) & 0x0f] +
                        HEX_CHARS[h2 & 0x0f] +
                        HEX_CHARS[(h3 >> 28) & 0x0f] +
                        HEX_CHARS[(h3 >> 24) & 0x0f] +
                        HEX_CHARS[(h3 >> 20) & 0x0f] +
                        HEX_CHARS[(h3 >> 16) & 0x0f] +
                        HEX_CHARS[(h3 >> 12) & 0x0f] +
                        HEX_CHARS[(h3 >> 8) & 0x0f] +
                        HEX_CHARS[(h3 >> 4) & 0x0f] +
                        HEX_CHARS[h3 & 0x0f] +
                        HEX_CHARS[(h4 >> 28) & 0x0f] +
                        HEX_CHARS[(h4 >> 24) & 0x0f] +
                        HEX_CHARS[(h4 >> 20) & 0x0f] +
                        HEX_CHARS[(h4 >> 16) & 0x0f] +
                        HEX_CHARS[(h4 >> 12) & 0x0f] +
                        HEX_CHARS[(h4 >> 8) & 0x0f] +
                        HEX_CHARS[(h4 >> 4) & 0x0f] +
                        HEX_CHARS[h4 & 0x0f] +
                        HEX_CHARS[(h5 >> 28) & 0x0f] +
                        HEX_CHARS[(h5 >> 24) & 0x0f] +
                        HEX_CHARS[(h5 >> 20) & 0x0f] +
                        HEX_CHARS[(h5 >> 16) & 0x0f] +
                        HEX_CHARS[(h5 >> 12) & 0x0f] +
                        HEX_CHARS[(h5 >> 8) & 0x0f] +
                        HEX_CHARS[(h5 >> 4) & 0x0f] +
                        HEX_CHARS[h5 & 0x0f] +
                        HEX_CHARS[(h6 >> 28) & 0x0f] +
                        HEX_CHARS[(h6 >> 24) & 0x0f] +
                        HEX_CHARS[(h6 >> 20) & 0x0f] +
                        HEX_CHARS[(h6 >> 16) & 0x0f] +
                        HEX_CHARS[(h6 >> 12) & 0x0f] +
                        HEX_CHARS[(h6 >> 8) & 0x0f] +
                        HEX_CHARS[(h6 >> 4) & 0x0f] +
                        HEX_CHARS[h6 & 0x0f];
                    if (!this.#is224) {
                        hex +=
                            HEX_CHARS[(h7 >> 28) & 0x0f] +
                                HEX_CHARS[(h7 >> 24) & 0x0f] +
                                HEX_CHARS[(h7 >> 20) & 0x0f] +
                                HEX_CHARS[(h7 >> 16) & 0x0f] +
                                HEX_CHARS[(h7 >> 12) & 0x0f] +
                                HEX_CHARS[(h7 >> 8) & 0x0f] +
                                HEX_CHARS[(h7 >> 4) & 0x0f] +
                                HEX_CHARS[h7 & 0x0f];
                    }
                    return hex;
                }
                toString() {
                    return this.hex();
                }
                digest() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    const h5 = this.#h5;
                    const h6 = this.#h6;
                    const h7 = this.#h7;
                    const arr = [
                        (h0 >> 24) & 0xff,
                        (h0 >> 16) & 0xff,
                        (h0 >> 8) & 0xff,
                        h0 & 0xff,
                        (h1 >> 24) & 0xff,
                        (h1 >> 16) & 0xff,
                        (h1 >> 8) & 0xff,
                        h1 & 0xff,
                        (h2 >> 24) & 0xff,
                        (h2 >> 16) & 0xff,
                        (h2 >> 8) & 0xff,
                        h2 & 0xff,
                        (h3 >> 24) & 0xff,
                        (h3 >> 16) & 0xff,
                        (h3 >> 8) & 0xff,
                        h3 & 0xff,
                        (h4 >> 24) & 0xff,
                        (h4 >> 16) & 0xff,
                        (h4 >> 8) & 0xff,
                        h4 & 0xff,
                        (h5 >> 24) & 0xff,
                        (h5 >> 16) & 0xff,
                        (h5 >> 8) & 0xff,
                        h5 & 0xff,
                        (h6 >> 24) & 0xff,
                        (h6 >> 16) & 0xff,
                        (h6 >> 8) & 0xff,
                        h6 & 0xff,
                    ];
                    if (!this.#is224) {
                        arr.push((h7 >> 24) & 0xff, (h7 >> 16) & 0xff, (h7 >> 8) & 0xff, h7 & 0xff);
                    }
                    return arr;
                }
                array() {
                    return this.digest();
                }
                arrayBuffer() {
                    this.finalize();
                    const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
                    const dataView = new DataView(buffer);
                    dataView.setUint32(0, this.#h0);
                    dataView.setUint32(4, this.#h1);
                    dataView.setUint32(8, this.#h2);
                    dataView.setUint32(12, this.#h3);
                    dataView.setUint32(16, this.#h4);
                    dataView.setUint32(20, this.#h5);
                    dataView.setUint32(24, this.#h6);
                    if (!this.#is224) {
                        dataView.setUint32(28, this.#h7);
                    }
                    return buffer;
                }
            };
            exports_5("Sha256", Sha256);
            HmacSha256 = class HmacSha256 extends Sha256 {
                constructor(secretKey, is224 = false, sharedMemory = false) {
                    super(is224, sharedMemory);
                    let key;
                    if (typeof secretKey === "string") {
                        const bytes = [];
                        const length = secretKey.length;
                        let index = 0;
                        for (let i = 0; i < length; ++i) {
                            let code = secretKey.charCodeAt(i);
                            if (code < 0x80) {
                                bytes[index++] = code;
                            }
                            else if (code < 0x800) {
                                bytes[index++] = 0xc0 | (code >> 6);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else if (code < 0xd800 || code >= 0xe000) {
                                bytes[index++] = 0xe0 | (code >> 12);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else {
                                code =
                                    0x10000 +
                                        (((code & 0x3ff) << 10) | (secretKey.charCodeAt(++i) & 0x3ff));
                                bytes[index++] = 0xf0 | (code >> 18);
                                bytes[index++] = 0x80 | ((code >> 12) & 0x3f);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                        }
                        key = bytes;
                    }
                    else {
                        if (secretKey instanceof ArrayBuffer) {
                            key = new Uint8Array(secretKey);
                        }
                        else {
                            key = secretKey;
                        }
                    }
                    if (key.length > 64) {
                        key = new Sha256(is224, true).update(key).array();
                    }
                    const oKeyPad = [];
                    const iKeyPad = [];
                    for (let i = 0; i < 64; ++i) {
                        const b = key[i] || 0;
                        oKeyPad[i] = 0x5c ^ b;
                        iKeyPad[i] = 0x36 ^ b;
                    }
                    this.update(iKeyPad);
                    this.#oKeyPad = oKeyPad;
                    this.#inner = true;
                    this.#is224 = is224;
                    this.#sharedMemory = sharedMemory;
                }
                #inner;
                #is224;
                #oKeyPad;
                #sharedMemory;
                finalize() {
                    super.finalize();
                    if (this.#inner) {
                        this.#inner = false;
                        const innerHash = this.array();
                        super.init(this.#is224, this.#sharedMemory);
                        this.update(this.#oKeyPad);
                        this.update(innerHash);
                        super.finalize();
                    }
                }
            };
            exports_5("HmacSha256", HmacSha256);
        }
    };
});
System.register("https://deno.land/std@0.61.0/encoding/utf8", [], function (exports_6, context_6) {
    "use strict";
    var encoder, decoder;
    var __moduleName = context_6 && context_6.id;
    function encode(input) {
        return encoder.encode(input);
    }
    exports_6("encode", encode);
    function decode(input) {
        return decoder.decode(input);
    }
    exports_6("decode", decode);
    return {
        setters: [],
        execute: function () {
            exports_6("encoder", encoder = new TextEncoder());
            exports_6("decoder", decoder = new TextDecoder());
        }
    };
});
System.register("https://deno.land/std@0.61.0/_util/assert", [], function (exports_7, context_7) {
    "use strict";
    var DenoStdInternalError;
    var __moduleName = context_7 && context_7.id;
    function assert(expr, msg = "") {
        if (!expr) {
            throw new DenoStdInternalError(msg);
        }
    }
    exports_7("assert", assert);
    return {
        setters: [],
        execute: function () {
            DenoStdInternalError = class DenoStdInternalError extends Error {
                constructor(message) {
                    super(message);
                    this.name = "DenoStdInternalError";
                }
            };
            exports_7("DenoStdInternalError", DenoStdInternalError);
        }
    };
});
System.register("https://deno.land/std@0.61.0/io/bufio", ["https://deno.land/std@0.61.0/bytes/mod", "https://deno.land/std@0.61.0/_util/assert"], function (exports_8, context_8) {
    "use strict";
    var mod_ts_1, assert_ts_1, DEFAULT_BUF_SIZE, MIN_BUF_SIZE, MAX_CONSECUTIVE_EMPTY_READS, CR, LF, BufferFullError, PartialReadError, BufReader, AbstractBufBase, BufWriter, BufWriterSync;
    var __moduleName = context_8 && context_8.id;
    function createLPS(pat) {
        const lps = new Uint8Array(pat.length);
        lps[0] = 0;
        let prefixEnd = 0;
        let i = 1;
        while (i < lps.length) {
            if (pat[i] == pat[prefixEnd]) {
                prefixEnd++;
                lps[i] = prefixEnd;
                i++;
            }
            else if (prefixEnd === 0) {
                lps[i] = 0;
                i++;
            }
            else {
                prefixEnd = pat[prefixEnd - 1];
            }
        }
        return lps;
    }
    async function* readDelim(reader, delim) {
        const delimLen = delim.length;
        const delimLPS = createLPS(delim);
        let inputBuffer = new Deno.Buffer();
        const inspectArr = new Uint8Array(Math.max(1024, delimLen + 1));
        let inspectIndex = 0;
        let matchIndex = 0;
        while (true) {
            const result = await reader.read(inspectArr);
            if (result === null) {
                yield inputBuffer.bytes();
                return;
            }
            if (result < 0) {
                return;
            }
            const sliceRead = inspectArr.subarray(0, result);
            await Deno.writeAll(inputBuffer, sliceRead);
            let sliceToProcess = inputBuffer.bytes();
            while (inspectIndex < sliceToProcess.length) {
                if (sliceToProcess[inspectIndex] === delim[matchIndex]) {
                    inspectIndex++;
                    matchIndex++;
                    if (matchIndex === delimLen) {
                        const matchEnd = inspectIndex - delimLen;
                        const readyBytes = sliceToProcess.subarray(0, matchEnd);
                        const pendingBytes = sliceToProcess.slice(inspectIndex);
                        yield readyBytes;
                        sliceToProcess = pendingBytes;
                        inspectIndex = 0;
                        matchIndex = 0;
                    }
                }
                else {
                    if (matchIndex === 0) {
                        inspectIndex++;
                    }
                    else {
                        matchIndex = delimLPS[matchIndex - 1];
                    }
                }
            }
            inputBuffer = new Deno.Buffer(sliceToProcess);
        }
    }
    exports_8("readDelim", readDelim);
    async function* readStringDelim(reader, delim) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        for await (const chunk of readDelim(reader, encoder.encode(delim))) {
            yield decoder.decode(chunk);
        }
    }
    exports_8("readStringDelim", readStringDelim);
    async function* readLines(reader) {
        yield* readStringDelim(reader, "\n");
    }
    exports_8("readLines", readLines);
    return {
        setters: [
            function (mod_ts_1_1) {
                mod_ts_1 = mod_ts_1_1;
            },
            function (assert_ts_1_1) {
                assert_ts_1 = assert_ts_1_1;
            }
        ],
        execute: function () {
            DEFAULT_BUF_SIZE = 4096;
            MIN_BUF_SIZE = 16;
            MAX_CONSECUTIVE_EMPTY_READS = 100;
            CR = "\r".charCodeAt(0);
            LF = "\n".charCodeAt(0);
            BufferFullError = class BufferFullError extends Error {
                constructor(partial) {
                    super("Buffer full");
                    this.partial = partial;
                    this.name = "BufferFullError";
                }
            };
            exports_8("BufferFullError", BufferFullError);
            PartialReadError = class PartialReadError extends Deno.errors.UnexpectedEof {
                constructor() {
                    super("Encountered UnexpectedEof, data only partially read");
                    this.name = "PartialReadError";
                }
            };
            exports_8("PartialReadError", PartialReadError);
            BufReader = class BufReader {
                constructor(rd, size = DEFAULT_BUF_SIZE) {
                    this.r = 0;
                    this.w = 0;
                    this.eof = false;
                    if (size < MIN_BUF_SIZE) {
                        size = MIN_BUF_SIZE;
                    }
                    this._reset(new Uint8Array(size), rd);
                }
                static create(r, size = DEFAULT_BUF_SIZE) {
                    return r instanceof BufReader ? r : new BufReader(r, size);
                }
                size() {
                    return this.buf.byteLength;
                }
                buffered() {
                    return this.w - this.r;
                }
                async _fill() {
                    if (this.r > 0) {
                        this.buf.copyWithin(0, this.r, this.w);
                        this.w -= this.r;
                        this.r = 0;
                    }
                    if (this.w >= this.buf.byteLength) {
                        throw Error("bufio: tried to fill full buffer");
                    }
                    for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
                        const rr = await this.rd.read(this.buf.subarray(this.w));
                        if (rr === null) {
                            this.eof = true;
                            return;
                        }
                        assert_ts_1.assert(rr >= 0, "negative read");
                        this.w += rr;
                        if (rr > 0) {
                            return;
                        }
                    }
                    throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
                }
                reset(r) {
                    this._reset(this.buf, r);
                }
                _reset(buf, rd) {
                    this.buf = buf;
                    this.rd = rd;
                    this.eof = false;
                }
                async read(p) {
                    let rr = p.byteLength;
                    if (p.byteLength === 0)
                        return rr;
                    if (this.r === this.w) {
                        if (p.byteLength >= this.buf.byteLength) {
                            const rr = await this.rd.read(p);
                            const nread = rr ?? 0;
                            assert_ts_1.assert(nread >= 0, "negative read");
                            return rr;
                        }
                        this.r = 0;
                        this.w = 0;
                        rr = await this.rd.read(this.buf);
                        if (rr === 0 || rr === null)
                            return rr;
                        assert_ts_1.assert(rr >= 0, "negative read");
                        this.w += rr;
                    }
                    const copied = mod_ts_1.copyBytes(this.buf.subarray(this.r, this.w), p, 0);
                    this.r += copied;
                    return copied;
                }
                async readFull(p) {
                    let bytesRead = 0;
                    while (bytesRead < p.length) {
                        try {
                            const rr = await this.read(p.subarray(bytesRead));
                            if (rr === null) {
                                if (bytesRead === 0) {
                                    return null;
                                }
                                else {
                                    throw new PartialReadError();
                                }
                            }
                            bytesRead += rr;
                        }
                        catch (err) {
                            err.partial = p.subarray(0, bytesRead);
                            throw err;
                        }
                    }
                    return p;
                }
                async readByte() {
                    while (this.r === this.w) {
                        if (this.eof)
                            return null;
                        await this._fill();
                    }
                    const c = this.buf[this.r];
                    this.r++;
                    return c;
                }
                async readString(delim) {
                    if (delim.length !== 1) {
                        throw new Error("Delimiter should be a single character");
                    }
                    const buffer = await this.readSlice(delim.charCodeAt(0));
                    if (buffer === null)
                        return null;
                    return new TextDecoder().decode(buffer);
                }
                async readLine() {
                    let line;
                    try {
                        line = await this.readSlice(LF);
                    }
                    catch (err) {
                        let { partial } = err;
                        assert_ts_1.assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
                        if (!(err instanceof BufferFullError)) {
                            throw err;
                        }
                        if (!this.eof &&
                            partial.byteLength > 0 &&
                            partial[partial.byteLength - 1] === CR) {
                            assert_ts_1.assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                            this.r--;
                            partial = partial.subarray(0, partial.byteLength - 1);
                        }
                        return { line: partial, more: !this.eof };
                    }
                    if (line === null) {
                        return null;
                    }
                    if (line.byteLength === 0) {
                        return { line, more: false };
                    }
                    if (line[line.byteLength - 1] == LF) {
                        let drop = 1;
                        if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                            drop = 2;
                        }
                        line = line.subarray(0, line.byteLength - drop);
                    }
                    return { line, more: false };
                }
                async readSlice(delim) {
                    let s = 0;
                    let slice;
                    while (true) {
                        let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
                        if (i >= 0) {
                            i += s;
                            slice = this.buf.subarray(this.r, this.r + i + 1);
                            this.r += i + 1;
                            break;
                        }
                        if (this.eof) {
                            if (this.r === this.w) {
                                return null;
                            }
                            slice = this.buf.subarray(this.r, this.w);
                            this.r = this.w;
                            break;
                        }
                        if (this.buffered() >= this.buf.byteLength) {
                            this.r = this.w;
                            const oldbuf = this.buf;
                            const newbuf = this.buf.slice(0);
                            this.buf = newbuf;
                            throw new BufferFullError(oldbuf);
                        }
                        s = this.w - this.r;
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = slice;
                            throw err;
                        }
                    }
                    return slice;
                }
                async peek(n) {
                    if (n < 0) {
                        throw Error("negative count");
                    }
                    let avail = this.w - this.r;
                    while (avail < n && avail < this.buf.byteLength && !this.eof) {
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = this.buf.subarray(this.r, this.w);
                            throw err;
                        }
                        avail = this.w - this.r;
                    }
                    if (avail === 0 && this.eof) {
                        return null;
                    }
                    else if (avail < n && this.eof) {
                        return this.buf.subarray(this.r, this.r + avail);
                    }
                    else if (avail < n) {
                        throw new BufferFullError(this.buf.subarray(this.r, this.w));
                    }
                    return this.buf.subarray(this.r, this.r + n);
                }
            };
            exports_8("BufReader", BufReader);
            AbstractBufBase = class AbstractBufBase {
                constructor() {
                    this.usedBufferBytes = 0;
                    this.err = null;
                }
                size() {
                    return this.buf.byteLength;
                }
                available() {
                    return this.buf.byteLength - this.usedBufferBytes;
                }
                buffered() {
                    return this.usedBufferBytes;
                }
            };
            BufWriter = class BufWriter extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                async flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        await Deno.writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                async write(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = await this.writer.write(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            await this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_8("BufWriter", BufWriter);
            BufWriterSync = class BufWriterSync extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriterSync
                        ? writer
                        : new BufWriterSync(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        Deno.writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                writeSync(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = this.writer.writeSync(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_1.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_8("BufWriterSync", BufWriterSync);
        }
    };
});
System.register("https://deno.land/std@0.61.0/async/deferred", [], function (exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    function deferred() {
        let methods;
        const promise = new Promise((resolve, reject) => {
            methods = { resolve, reject };
        });
        return Object.assign(promise, methods);
    }
    exports_9("deferred", deferred);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/async/delay", [], function (exports_10, context_10) {
    "use strict";
    var __moduleName = context_10 && context_10.id;
    function delay(ms) {
        return new Promise((res) => setTimeout(() => {
            res();
        }, ms));
    }
    exports_10("delay", delay);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/async/mux_async_iterator", ["https://deno.land/std@0.61.0/async/deferred"], function (exports_11, context_11) {
    "use strict";
    var deferred_ts_1, MuxAsyncIterator;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (deferred_ts_1_1) {
                deferred_ts_1 = deferred_ts_1_1;
            }
        ],
        execute: function () {
            MuxAsyncIterator = class MuxAsyncIterator {
                constructor() {
                    this.iteratorCount = 0;
                    this.yields = [];
                    this.throws = [];
                    this.signal = deferred_ts_1.deferred();
                }
                add(iterator) {
                    ++this.iteratorCount;
                    this.callIteratorNext(iterator);
                }
                async callIteratorNext(iterator) {
                    try {
                        const { value, done } = await iterator.next();
                        if (done) {
                            --this.iteratorCount;
                        }
                        else {
                            this.yields.push({ iterator, value });
                        }
                    }
                    catch (e) {
                        this.throws.push(e);
                    }
                    this.signal.resolve();
                }
                async *iterate() {
                    while (this.iteratorCount > 0) {
                        await this.signal;
                        for (let i = 0; i < this.yields.length; i++) {
                            const { iterator, value } = this.yields[i];
                            yield value;
                            this.callIteratorNext(iterator);
                        }
                        if (this.throws.length) {
                            for (const e of this.throws) {
                                throw e;
                            }
                            this.throws.length = 0;
                        }
                        this.yields.length = 0;
                        this.signal = deferred_ts_1.deferred();
                    }
                }
                [Symbol.asyncIterator]() {
                    return this.iterate();
                }
            };
            exports_11("MuxAsyncIterator", MuxAsyncIterator);
        }
    };
});
System.register("https://deno.land/std@0.61.0/async/mod", ["https://deno.land/std@0.61.0/async/deferred", "https://deno.land/std@0.61.0/async/delay", "https://deno.land/std@0.61.0/async/mux_async_iterator"], function (exports_12, context_12) {
    "use strict";
    var __moduleName = context_12 && context_12.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_12(exports);
    }
    return {
        setters: [
            function (deferred_ts_2_1) {
                exportStar_1(deferred_ts_2_1);
            },
            function (delay_ts_1_1) {
                exportStar_1(delay_ts_1_1);
            },
            function (mux_async_iterator_ts_1_1) {
                exportStar_1(mux_async_iterator_ts_1_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/textproto/mod", ["https://deno.land/std@0.61.0/bytes/mod", "https://deno.land/std@0.61.0/encoding/utf8"], function (exports_13, context_13) {
    "use strict";
    var mod_ts_2, utf8_ts_1, invalidHeaderCharRegex, TextProtoReader;
    var __moduleName = context_13 && context_13.id;
    function str(buf) {
        if (buf == null) {
            return "";
        }
        else {
            return utf8_ts_1.decode(buf);
        }
    }
    function charCode(s) {
        return s.charCodeAt(0);
    }
    return {
        setters: [
            function (mod_ts_2_1) {
                mod_ts_2 = mod_ts_2_1;
            },
            function (utf8_ts_1_1) {
                utf8_ts_1 = utf8_ts_1_1;
            }
        ],
        execute: function () {
            invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
            TextProtoReader = class TextProtoReader {
                constructor(r) {
                    this.r = r;
                }
                async readLine() {
                    const s = await this.readLineSlice();
                    if (s === null)
                        return null;
                    return str(s);
                }
                async readMIMEHeader() {
                    const m = new Headers();
                    let line;
                    let buf = await this.r.peek(1);
                    if (buf === null) {
                        return null;
                    }
                    else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
                        line = (await this.readLineSlice());
                    }
                    buf = await this.r.peek(1);
                    if (buf === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    else if (buf[0] == charCode(" ") || buf[0] == charCode("\t")) {
                        throw new Deno.errors.InvalidData(`malformed MIME header initial line: ${str(line)}`);
                    }
                    while (true) {
                        const kv = await this.readLineSlice();
                        if (kv === null)
                            throw new Deno.errors.UnexpectedEof();
                        if (kv.byteLength === 0)
                            return m;
                        let i = kv.indexOf(charCode(":"));
                        if (i < 0) {
                            throw new Deno.errors.InvalidData(`malformed MIME header line: ${str(kv)}`);
                        }
                        const key = str(kv.subarray(0, i));
                        if (key == "") {
                            continue;
                        }
                        i++;
                        while (i < kv.byteLength &&
                            (kv[i] == charCode(" ") || kv[i] == charCode("\t"))) {
                            i++;
                        }
                        const value = str(kv.subarray(i)).replace(invalidHeaderCharRegex, encodeURI);
                        try {
                            m.append(key, value);
                        }
                        catch {
                        }
                    }
                }
                async readLineSlice() {
                    let line;
                    while (true) {
                        const r = await this.r.readLine();
                        if (r === null)
                            return null;
                        const { line: l, more } = r;
                        if (!line && !more) {
                            if (this.skipSpace(l) === 0) {
                                return new Uint8Array(0);
                            }
                            return l;
                        }
                        line = line ? mod_ts_2.concat(line, l) : l;
                        if (!more) {
                            break;
                        }
                    }
                    return line;
                }
                skipSpace(l) {
                    let n = 0;
                    for (let i = 0; i < l.length; i++) {
                        if (l[i] === charCode(" ") || l[i] === charCode("\t")) {
                            continue;
                        }
                        n++;
                    }
                    return n;
                }
            };
            exports_13("TextProtoReader", TextProtoReader);
        }
    };
});
System.register("https://deno.land/std@0.61.0/http/http_status", [], function (exports_14, context_14) {
    "use strict";
    var Status, STATUS_TEXT;
    var __moduleName = context_14 && context_14.id;
    return {
        setters: [],
        execute: function () {
            (function (Status) {
                Status[Status["Continue"] = 100] = "Continue";
                Status[Status["SwitchingProtocols"] = 101] = "SwitchingProtocols";
                Status[Status["Processing"] = 102] = "Processing";
                Status[Status["EarlyHints"] = 103] = "EarlyHints";
                Status[Status["OK"] = 200] = "OK";
                Status[Status["Created"] = 201] = "Created";
                Status[Status["Accepted"] = 202] = "Accepted";
                Status[Status["NonAuthoritativeInfo"] = 203] = "NonAuthoritativeInfo";
                Status[Status["NoContent"] = 204] = "NoContent";
                Status[Status["ResetContent"] = 205] = "ResetContent";
                Status[Status["PartialContent"] = 206] = "PartialContent";
                Status[Status["MultiStatus"] = 207] = "MultiStatus";
                Status[Status["AlreadyReported"] = 208] = "AlreadyReported";
                Status[Status["IMUsed"] = 226] = "IMUsed";
                Status[Status["MultipleChoices"] = 300] = "MultipleChoices";
                Status[Status["MovedPermanently"] = 301] = "MovedPermanently";
                Status[Status["Found"] = 302] = "Found";
                Status[Status["SeeOther"] = 303] = "SeeOther";
                Status[Status["NotModified"] = 304] = "NotModified";
                Status[Status["UseProxy"] = 305] = "UseProxy";
                Status[Status["TemporaryRedirect"] = 307] = "TemporaryRedirect";
                Status[Status["PermanentRedirect"] = 308] = "PermanentRedirect";
                Status[Status["BadRequest"] = 400] = "BadRequest";
                Status[Status["Unauthorized"] = 401] = "Unauthorized";
                Status[Status["PaymentRequired"] = 402] = "PaymentRequired";
                Status[Status["Forbidden"] = 403] = "Forbidden";
                Status[Status["NotFound"] = 404] = "NotFound";
                Status[Status["MethodNotAllowed"] = 405] = "MethodNotAllowed";
                Status[Status["NotAcceptable"] = 406] = "NotAcceptable";
                Status[Status["ProxyAuthRequired"] = 407] = "ProxyAuthRequired";
                Status[Status["RequestTimeout"] = 408] = "RequestTimeout";
                Status[Status["Conflict"] = 409] = "Conflict";
                Status[Status["Gone"] = 410] = "Gone";
                Status[Status["LengthRequired"] = 411] = "LengthRequired";
                Status[Status["PreconditionFailed"] = 412] = "PreconditionFailed";
                Status[Status["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
                Status[Status["RequestURITooLong"] = 414] = "RequestURITooLong";
                Status[Status["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
                Status[Status["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
                Status[Status["ExpectationFailed"] = 417] = "ExpectationFailed";
                Status[Status["Teapot"] = 418] = "Teapot";
                Status[Status["MisdirectedRequest"] = 421] = "MisdirectedRequest";
                Status[Status["UnprocessableEntity"] = 422] = "UnprocessableEntity";
                Status[Status["Locked"] = 423] = "Locked";
                Status[Status["FailedDependency"] = 424] = "FailedDependency";
                Status[Status["TooEarly"] = 425] = "TooEarly";
                Status[Status["UpgradeRequired"] = 426] = "UpgradeRequired";
                Status[Status["PreconditionRequired"] = 428] = "PreconditionRequired";
                Status[Status["TooManyRequests"] = 429] = "TooManyRequests";
                Status[Status["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
                Status[Status["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
                Status[Status["InternalServerError"] = 500] = "InternalServerError";
                Status[Status["NotImplemented"] = 501] = "NotImplemented";
                Status[Status["BadGateway"] = 502] = "BadGateway";
                Status[Status["ServiceUnavailable"] = 503] = "ServiceUnavailable";
                Status[Status["GatewayTimeout"] = 504] = "GatewayTimeout";
                Status[Status["HTTPVersionNotSupported"] = 505] = "HTTPVersionNotSupported";
                Status[Status["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
                Status[Status["InsufficientStorage"] = 507] = "InsufficientStorage";
                Status[Status["LoopDetected"] = 508] = "LoopDetected";
                Status[Status["NotExtended"] = 510] = "NotExtended";
                Status[Status["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
            })(Status || (Status = {}));
            exports_14("Status", Status);
            exports_14("STATUS_TEXT", STATUS_TEXT = new Map([
                [Status.Continue, "Continue"],
                [Status.SwitchingProtocols, "Switching Protocols"],
                [Status.Processing, "Processing"],
                [Status.EarlyHints, "Early Hints"],
                [Status.OK, "OK"],
                [Status.Created, "Created"],
                [Status.Accepted, "Accepted"],
                [Status.NonAuthoritativeInfo, "Non-Authoritative Information"],
                [Status.NoContent, "No Content"],
                [Status.ResetContent, "Reset Content"],
                [Status.PartialContent, "Partial Content"],
                [Status.MultiStatus, "Multi-Status"],
                [Status.AlreadyReported, "Already Reported"],
                [Status.IMUsed, "IM Used"],
                [Status.MultipleChoices, "Multiple Choices"],
                [Status.MovedPermanently, "Moved Permanently"],
                [Status.Found, "Found"],
                [Status.SeeOther, "See Other"],
                [Status.NotModified, "Not Modified"],
                [Status.UseProxy, "Use Proxy"],
                [Status.TemporaryRedirect, "Temporary Redirect"],
                [Status.PermanentRedirect, "Permanent Redirect"],
                [Status.BadRequest, "Bad Request"],
                [Status.Unauthorized, "Unauthorized"],
                [Status.PaymentRequired, "Payment Required"],
                [Status.Forbidden, "Forbidden"],
                [Status.NotFound, "Not Found"],
                [Status.MethodNotAllowed, "Method Not Allowed"],
                [Status.NotAcceptable, "Not Acceptable"],
                [Status.ProxyAuthRequired, "Proxy Authentication Required"],
                [Status.RequestTimeout, "Request Timeout"],
                [Status.Conflict, "Conflict"],
                [Status.Gone, "Gone"],
                [Status.LengthRequired, "Length Required"],
                [Status.PreconditionFailed, "Precondition Failed"],
                [Status.RequestEntityTooLarge, "Request Entity Too Large"],
                [Status.RequestURITooLong, "Request URI Too Long"],
                [Status.UnsupportedMediaType, "Unsupported Media Type"],
                [Status.RequestedRangeNotSatisfiable, "Requested Range Not Satisfiable"],
                [Status.ExpectationFailed, "Expectation Failed"],
                [Status.Teapot, "I'm a teapot"],
                [Status.MisdirectedRequest, "Misdirected Request"],
                [Status.UnprocessableEntity, "Unprocessable Entity"],
                [Status.Locked, "Locked"],
                [Status.FailedDependency, "Failed Dependency"],
                [Status.TooEarly, "Too Early"],
                [Status.UpgradeRequired, "Upgrade Required"],
                [Status.PreconditionRequired, "Precondition Required"],
                [Status.TooManyRequests, "Too Many Requests"],
                [Status.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large"],
                [Status.UnavailableForLegalReasons, "Unavailable For Legal Reasons"],
                [Status.InternalServerError, "Internal Server Error"],
                [Status.NotImplemented, "Not Implemented"],
                [Status.BadGateway, "Bad Gateway"],
                [Status.ServiceUnavailable, "Service Unavailable"],
                [Status.GatewayTimeout, "Gateway Timeout"],
                [Status.HTTPVersionNotSupported, "HTTP Version Not Supported"],
                [Status.VariantAlsoNegotiates, "Variant Also Negotiates"],
                [Status.InsufficientStorage, "Insufficient Storage"],
                [Status.LoopDetected, "Loop Detected"],
                [Status.NotExtended, "Not Extended"],
                [Status.NetworkAuthenticationRequired, "Network Authentication Required"],
            ]));
        }
    };
});
System.register("https://deno.land/std@0.61.0/http/_io", ["https://deno.land/std@0.61.0/io/bufio", "https://deno.land/std@0.61.0/textproto/mod", "https://deno.land/std@0.61.0/_util/assert", "https://deno.land/std@0.61.0/encoding/utf8", "https://deno.land/std@0.61.0/http/server", "https://deno.land/std@0.61.0/http/http_status"], function (exports_15, context_15) {
    "use strict";
    var bufio_ts_1, mod_ts_3, assert_ts_2, utf8_ts_2, server_ts_1, http_status_ts_1;
    var __moduleName = context_15 && context_15.id;
    function emptyReader() {
        return {
            read(_) {
                return Promise.resolve(null);
            },
        };
    }
    exports_15("emptyReader", emptyReader);
    function bodyReader(contentLength, r) {
        let totalRead = 0;
        let finished = false;
        async function read(buf) {
            if (finished)
                return null;
            let result;
            const remaining = contentLength - totalRead;
            if (remaining >= buf.byteLength) {
                result = await r.read(buf);
            }
            else {
                const readBuf = buf.subarray(0, remaining);
                result = await r.read(readBuf);
            }
            if (result !== null) {
                totalRead += result;
            }
            finished = totalRead === contentLength;
            return result;
        }
        return { read };
    }
    exports_15("bodyReader", bodyReader);
    function chunkedBodyReader(h, r) {
        const tp = new mod_ts_3.TextProtoReader(r);
        let finished = false;
        const chunks = [];
        async function read(buf) {
            if (finished)
                return null;
            const [chunk] = chunks;
            if (chunk) {
                const chunkRemaining = chunk.data.byteLength - chunk.offset;
                const readLength = Math.min(chunkRemaining, buf.byteLength);
                for (let i = 0; i < readLength; i++) {
                    buf[i] = chunk.data[chunk.offset + i];
                }
                chunk.offset += readLength;
                if (chunk.offset === chunk.data.byteLength) {
                    chunks.shift();
                    if ((await tp.readLine()) === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                }
                return readLength;
            }
            const line = await tp.readLine();
            if (line === null)
                throw new Deno.errors.UnexpectedEof();
            const [chunkSizeString] = line.split(";");
            const chunkSize = parseInt(chunkSizeString, 16);
            if (Number.isNaN(chunkSize) || chunkSize < 0) {
                throw new Error("Invalid chunk size");
            }
            if (chunkSize > 0) {
                if (chunkSize > buf.byteLength) {
                    let eof = await r.readFull(buf);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    const restChunk = new Uint8Array(chunkSize - buf.byteLength);
                    eof = await r.readFull(restChunk);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    else {
                        chunks.push({
                            offset: 0,
                            data: restChunk,
                        });
                    }
                    return buf.byteLength;
                }
                else {
                    const bufToFill = buf.subarray(0, chunkSize);
                    const eof = await r.readFull(bufToFill);
                    if (eof === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    if ((await tp.readLine()) === null) {
                        throw new Deno.errors.UnexpectedEof();
                    }
                    return chunkSize;
                }
            }
            else {
                assert_ts_2.assert(chunkSize === 0);
                if ((await r.readLine()) === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                await readTrailers(h, r);
                finished = true;
                return null;
            }
        }
        return { read };
    }
    exports_15("chunkedBodyReader", chunkedBodyReader);
    function isProhibidedForTrailer(key) {
        const s = new Set(["transfer-encoding", "content-length", "trailer"]);
        return s.has(key.toLowerCase());
    }
    async function readTrailers(headers, r) {
        const trailers = parseTrailer(headers.get("trailer"));
        if (trailers == null)
            return;
        const trailerNames = [...trailers.keys()];
        const tp = new mod_ts_3.TextProtoReader(r);
        const result = await tp.readMIMEHeader();
        if (result == null) {
            throw new Deno.errors.InvalidData("Missing trailer header.");
        }
        const undeclared = [...result.keys()].filter((k) => !trailerNames.includes(k));
        if (undeclared.length > 0) {
            throw new Deno.errors.InvalidData(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
        }
        for (const [k, v] of result) {
            headers.append(k, v);
        }
        const missingTrailers = trailerNames.filter((k) => !result.has(k));
        if (missingTrailers.length > 0) {
            throw new Deno.errors.InvalidData(`Missing trailers: ${Deno.inspect(missingTrailers)}.`);
        }
        headers.delete("trailer");
    }
    exports_15("readTrailers", readTrailers);
    function parseTrailer(field) {
        if (field == null) {
            return undefined;
        }
        const trailerNames = field.split(",").map((v) => v.trim().toLowerCase());
        if (trailerNames.length === 0) {
            throw new Deno.errors.InvalidData("Empty trailer header.");
        }
        const prohibited = trailerNames.filter((k) => isProhibidedForTrailer(k));
        if (prohibited.length > 0) {
            throw new Deno.errors.InvalidData(`Prohibited trailer names: ${Deno.inspect(prohibited)}.`);
        }
        return new Headers(trailerNames.map((key) => [key, ""]));
    }
    async function writeChunkedBody(w, r) {
        const writer = bufio_ts_1.BufWriter.create(w);
        for await (const chunk of Deno.iter(r)) {
            if (chunk.byteLength <= 0)
                continue;
            const start = utf8_ts_2.encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
            const end = utf8_ts_2.encoder.encode("\r\n");
            await writer.write(start);
            await writer.write(chunk);
            await writer.write(end);
        }
        const endChunk = utf8_ts_2.encoder.encode("0\r\n\r\n");
        await writer.write(endChunk);
    }
    exports_15("writeChunkedBody", writeChunkedBody);
    async function writeTrailers(w, headers, trailers) {
        const trailer = headers.get("trailer");
        if (trailer === null) {
            throw new TypeError("Missing trailer header.");
        }
        const transferEncoding = headers.get("transfer-encoding");
        if (transferEncoding === null || !transferEncoding.match(/^chunked/)) {
            throw new TypeError(`Trailers are only allowed for "transfer-encoding: chunked", got "transfer-encoding: ${transferEncoding}".`);
        }
        const writer = bufio_ts_1.BufWriter.create(w);
        const trailerNames = trailer.split(",").map((s) => s.trim().toLowerCase());
        const prohibitedTrailers = trailerNames.filter((k) => isProhibidedForTrailer(k));
        if (prohibitedTrailers.length > 0) {
            throw new TypeError(`Prohibited trailer names: ${Deno.inspect(prohibitedTrailers)}.`);
        }
        const undeclared = [...trailers.keys()].filter((k) => !trailerNames.includes(k));
        if (undeclared.length > 0) {
            throw new TypeError(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
        }
        for (const [key, value] of trailers) {
            await writer.write(utf8_ts_2.encoder.encode(`${key}: ${value}\r\n`));
        }
        await writer.write(utf8_ts_2.encoder.encode("\r\n"));
        await writer.flush();
    }
    exports_15("writeTrailers", writeTrailers);
    async function writeResponse(w, r) {
        const protoMajor = 1;
        const protoMinor = 1;
        const statusCode = r.status || 200;
        const statusText = http_status_ts_1.STATUS_TEXT.get(statusCode);
        const writer = bufio_ts_1.BufWriter.create(w);
        if (!statusText) {
            throw new Deno.errors.InvalidData("Bad status code");
        }
        if (!r.body) {
            r.body = new Uint8Array();
        }
        if (typeof r.body === "string") {
            r.body = utf8_ts_2.encoder.encode(r.body);
        }
        let out = `HTTP/${protoMajor}.${protoMinor} ${statusCode} ${statusText}\r\n`;
        const headers = r.headers ?? new Headers();
        if (r.body && !headers.get("content-length")) {
            if (r.body instanceof Uint8Array) {
                out += `content-length: ${r.body.byteLength}\r\n`;
            }
            else if (!headers.get("transfer-encoding")) {
                out += "transfer-encoding: chunked\r\n";
            }
        }
        for (const [key, value] of headers) {
            out += `${key}: ${value}\r\n`;
        }
        out += `\r\n`;
        const header = utf8_ts_2.encoder.encode(out);
        const n = await writer.write(header);
        assert_ts_2.assert(n === header.byteLength);
        if (r.body instanceof Uint8Array) {
            const n = await writer.write(r.body);
            assert_ts_2.assert(n === r.body.byteLength);
        }
        else if (headers.has("content-length")) {
            const contentLength = headers.get("content-length");
            assert_ts_2.assert(contentLength != null);
            const bodyLength = parseInt(contentLength);
            const n = await Deno.copy(r.body, writer);
            assert_ts_2.assert(n === bodyLength);
        }
        else {
            await writeChunkedBody(writer, r.body);
        }
        if (r.trailers) {
            const t = await r.trailers();
            await writeTrailers(writer, headers, t);
        }
        await writer.flush();
    }
    exports_15("writeResponse", writeResponse);
    function parseHTTPVersion(vers) {
        switch (vers) {
            case "HTTP/1.1":
                return [1, 1];
            case "HTTP/1.0":
                return [1, 0];
            default: {
                const Big = 1000000;
                if (!vers.startsWith("HTTP/")) {
                    break;
                }
                const dot = vers.indexOf(".");
                if (dot < 0) {
                    break;
                }
                const majorStr = vers.substring(vers.indexOf("/") + 1, dot);
                const major = Number(majorStr);
                if (!Number.isInteger(major) || major < 0 || major > Big) {
                    break;
                }
                const minorStr = vers.substring(dot + 1);
                const minor = Number(minorStr);
                if (!Number.isInteger(minor) || minor < 0 || minor > Big) {
                    break;
                }
                return [major, minor];
            }
        }
        throw new Error(`malformed HTTP version ${vers}`);
    }
    exports_15("parseHTTPVersion", parseHTTPVersion);
    async function readRequest(conn, bufr) {
        const tp = new mod_ts_3.TextProtoReader(bufr);
        const firstLine = await tp.readLine();
        if (firstLine === null)
            return null;
        const headers = await tp.readMIMEHeader();
        if (headers === null)
            throw new Deno.errors.UnexpectedEof();
        const req = new server_ts_1.ServerRequest();
        req.conn = conn;
        req.r = bufr;
        [req.method, req.url, req.proto] = firstLine.split(" ", 3);
        [req.protoMinor, req.protoMajor] = parseHTTPVersion(req.proto);
        req.headers = headers;
        fixLength(req);
        return req;
    }
    exports_15("readRequest", readRequest);
    function fixLength(req) {
        const contentLength = req.headers.get("Content-Length");
        if (contentLength) {
            const arrClen = contentLength.split(",");
            if (arrClen.length > 1) {
                const distinct = [...new Set(arrClen.map((e) => e.trim()))];
                if (distinct.length > 1) {
                    throw Error("cannot contain multiple Content-Length headers");
                }
                else {
                    req.headers.set("Content-Length", distinct[0]);
                }
            }
            const c = req.headers.get("Content-Length");
            if (req.method === "HEAD" && c && c !== "0") {
                throw Error("http: method cannot contain a Content-Length");
            }
            if (c && req.headers.has("transfer-encoding")) {
                throw new Error("http: Transfer-Encoding and Content-Length cannot be send together");
            }
        }
    }
    return {
        setters: [
            function (bufio_ts_1_1) {
                bufio_ts_1 = bufio_ts_1_1;
            },
            function (mod_ts_3_1) {
                mod_ts_3 = mod_ts_3_1;
            },
            function (assert_ts_2_1) {
                assert_ts_2 = assert_ts_2_1;
            },
            function (utf8_ts_2_1) {
                utf8_ts_2 = utf8_ts_2_1;
            },
            function (server_ts_1_1) {
                server_ts_1 = server_ts_1_1;
            },
            function (http_status_ts_1_1) {
                http_status_ts_1 = http_status_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/http/server", ["https://deno.land/std@0.61.0/encoding/utf8", "https://deno.land/std@0.61.0/io/bufio", "https://deno.land/std@0.61.0/_util/assert", "https://deno.land/std@0.61.0/async/mod", "https://deno.land/std@0.61.0/http/_io"], function (exports_16, context_16) {
    "use strict";
    var utf8_ts_3, bufio_ts_2, assert_ts_3, mod_ts_4, _io_ts_1, ServerRequest, Server;
    var __moduleName = context_16 && context_16.id;
    function _parseAddrFromStr(addr) {
        let url;
        try {
            const host = addr.startsWith(":") ? `0.0.0.0${addr}` : addr;
            url = new URL(`http://${host}`);
        }
        catch {
            throw new TypeError("Invalid address.");
        }
        if (url.username ||
            url.password ||
            url.pathname != "/" ||
            url.search ||
            url.hash) {
            throw new TypeError("Invalid address.");
        }
        return {
            hostname: url.hostname,
            port: url.port === "" ? 80 : Number(url.port),
        };
    }
    exports_16("_parseAddrFromStr", _parseAddrFromStr);
    function serve(addr) {
        if (typeof addr === "string") {
            addr = _parseAddrFromStr(addr);
        }
        const listener = Deno.listen(addr);
        return new Server(listener);
    }
    exports_16("serve", serve);
    async function listenAndServe(addr, handler) {
        const server = serve(addr);
        for await (const request of server) {
            handler(request);
        }
    }
    exports_16("listenAndServe", listenAndServe);
    function serveTLS(options) {
        const tlsOptions = {
            ...options,
            transport: "tcp",
        };
        const listener = Deno.listenTls(tlsOptions);
        return new Server(listener);
    }
    exports_16("serveTLS", serveTLS);
    async function listenAndServeTLS(options, handler) {
        const server = serveTLS(options);
        for await (const request of server) {
            handler(request);
        }
    }
    exports_16("listenAndServeTLS", listenAndServeTLS);
    return {
        setters: [
            function (utf8_ts_3_1) {
                utf8_ts_3 = utf8_ts_3_1;
            },
            function (bufio_ts_2_1) {
                bufio_ts_2 = bufio_ts_2_1;
            },
            function (assert_ts_3_1) {
                assert_ts_3 = assert_ts_3_1;
            },
            function (mod_ts_4_1) {
                mod_ts_4 = mod_ts_4_1;
            },
            function (_io_ts_1_1) {
                _io_ts_1 = _io_ts_1_1;
            }
        ],
        execute: function () {
            ServerRequest = class ServerRequest {
                constructor() {
                    this.done = mod_ts_4.deferred();
                    this._contentLength = undefined;
                    this._body = null;
                    this.finalized = false;
                }
                get contentLength() {
                    if (this._contentLength === undefined) {
                        const cl = this.headers.get("content-length");
                        if (cl) {
                            this._contentLength = parseInt(cl);
                            if (Number.isNaN(this._contentLength)) {
                                this._contentLength = null;
                            }
                        }
                        else {
                            this._contentLength = null;
                        }
                    }
                    return this._contentLength;
                }
                get body() {
                    if (!this._body) {
                        if (this.contentLength != null) {
                            this._body = _io_ts_1.bodyReader(this.contentLength, this.r);
                        }
                        else {
                            const transferEncoding = this.headers.get("transfer-encoding");
                            if (transferEncoding != null) {
                                const parts = transferEncoding
                                    .split(",")
                                    .map((e) => e.trim().toLowerCase());
                                assert_ts_3.assert(parts.includes("chunked"), 'transfer-encoding must include "chunked" if content-length is not set');
                                this._body = _io_ts_1.chunkedBodyReader(this.headers, this.r);
                            }
                            else {
                                this._body = _io_ts_1.emptyReader();
                            }
                        }
                    }
                    return this._body;
                }
                async respond(r) {
                    let err;
                    try {
                        await _io_ts_1.writeResponse(this.w, r);
                    }
                    catch (e) {
                        try {
                            this.conn.close();
                        }
                        catch {
                        }
                        err = e;
                    }
                    this.done.resolve(err);
                    if (err) {
                        throw err;
                    }
                }
                async finalize() {
                    if (this.finalized)
                        return;
                    const body = this.body;
                    const buf = new Uint8Array(1024);
                    while ((await body.read(buf)) !== null) {
                    }
                    this.finalized = true;
                }
            };
            exports_16("ServerRequest", ServerRequest);
            Server = class Server {
                constructor(listener) {
                    this.listener = listener;
                    this.closing = false;
                    this.connections = [];
                }
                close() {
                    this.closing = true;
                    this.listener.close();
                    for (const conn of this.connections) {
                        try {
                            conn.close();
                        }
                        catch (e) {
                            if (!(e instanceof Deno.errors.BadResource)) {
                                throw e;
                            }
                        }
                    }
                }
                async *iterateHttpRequests(conn) {
                    const reader = new bufio_ts_2.BufReader(conn);
                    const writer = new bufio_ts_2.BufWriter(conn);
                    while (!this.closing) {
                        let request;
                        try {
                            request = await _io_ts_1.readRequest(conn, reader);
                        }
                        catch (error) {
                            if (error instanceof Deno.errors.InvalidData ||
                                error instanceof Deno.errors.UnexpectedEof) {
                                await _io_ts_1.writeResponse(writer, {
                                    status: 400,
                                    body: utf8_ts_3.encode(`${error.message}\r\n\r\n`),
                                });
                            }
                            break;
                        }
                        if (request === null) {
                            break;
                        }
                        request.w = writer;
                        yield request;
                        const responseError = await request.done;
                        if (responseError) {
                            this.untrackConnection(request.conn);
                            return;
                        }
                        await request.finalize();
                    }
                    this.untrackConnection(conn);
                    try {
                        conn.close();
                    }
                    catch (e) {
                    }
                }
                trackConnection(conn) {
                    this.connections.push(conn);
                }
                untrackConnection(conn) {
                    const index = this.connections.indexOf(conn);
                    if (index !== -1) {
                        this.connections.splice(index, 1);
                    }
                }
                async *acceptConnAndIterateHttpRequests(mux) {
                    if (this.closing)
                        return;
                    let conn;
                    try {
                        conn = await this.listener.accept();
                    }
                    catch (error) {
                        if (error instanceof Deno.errors.BadResource ||
                            error instanceof Deno.errors.InvalidData ||
                            error instanceof Deno.errors.UnexpectedEof) {
                            return mux.add(this.acceptConnAndIterateHttpRequests(mux));
                        }
                        throw error;
                    }
                    this.trackConnection(conn);
                    mux.add(this.acceptConnAndIterateHttpRequests(mux));
                    yield* this.iterateHttpRequests(conn);
                }
                [Symbol.asyncIterator]() {
                    const mux = new mod_ts_4.MuxAsyncIterator();
                    mux.add(this.acceptConnAndIterateHttpRequests(mux));
                    return mux.iterate();
                }
            };
            exports_16("Server", Server);
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/_constants", [], function (exports_17, context_17) {
    "use strict";
    var CHAR_UPPERCASE_A, CHAR_LOWERCASE_A, CHAR_UPPERCASE_Z, CHAR_LOWERCASE_Z, CHAR_DOT, CHAR_FORWARD_SLASH, CHAR_BACKWARD_SLASH, CHAR_VERTICAL_LINE, CHAR_COLON, CHAR_QUESTION_MARK, CHAR_UNDERSCORE, CHAR_LINE_FEED, CHAR_CARRIAGE_RETURN, CHAR_TAB, CHAR_FORM_FEED, CHAR_EXCLAMATION_MARK, CHAR_HASH, CHAR_SPACE, CHAR_NO_BREAK_SPACE, CHAR_ZERO_WIDTH_NOBREAK_SPACE, CHAR_LEFT_SQUARE_BRACKET, CHAR_RIGHT_SQUARE_BRACKET, CHAR_LEFT_ANGLE_BRACKET, CHAR_RIGHT_ANGLE_BRACKET, CHAR_LEFT_CURLY_BRACKET, CHAR_RIGHT_CURLY_BRACKET, CHAR_HYPHEN_MINUS, CHAR_PLUS, CHAR_DOUBLE_QUOTE, CHAR_SINGLE_QUOTE, CHAR_PERCENT, CHAR_SEMICOLON, CHAR_CIRCUMFLEX_ACCENT, CHAR_GRAVE_ACCENT, CHAR_AT, CHAR_AMPERSAND, CHAR_EQUAL, CHAR_0, CHAR_9, navigator, isWindows;
    var __moduleName = context_17 && context_17.id;
    return {
        setters: [],
        execute: function () {
            exports_17("CHAR_UPPERCASE_A", CHAR_UPPERCASE_A = 65);
            exports_17("CHAR_LOWERCASE_A", CHAR_LOWERCASE_A = 97);
            exports_17("CHAR_UPPERCASE_Z", CHAR_UPPERCASE_Z = 90);
            exports_17("CHAR_LOWERCASE_Z", CHAR_LOWERCASE_Z = 122);
            exports_17("CHAR_DOT", CHAR_DOT = 46);
            exports_17("CHAR_FORWARD_SLASH", CHAR_FORWARD_SLASH = 47);
            exports_17("CHAR_BACKWARD_SLASH", CHAR_BACKWARD_SLASH = 92);
            exports_17("CHAR_VERTICAL_LINE", CHAR_VERTICAL_LINE = 124);
            exports_17("CHAR_COLON", CHAR_COLON = 58);
            exports_17("CHAR_QUESTION_MARK", CHAR_QUESTION_MARK = 63);
            exports_17("CHAR_UNDERSCORE", CHAR_UNDERSCORE = 95);
            exports_17("CHAR_LINE_FEED", CHAR_LINE_FEED = 10);
            exports_17("CHAR_CARRIAGE_RETURN", CHAR_CARRIAGE_RETURN = 13);
            exports_17("CHAR_TAB", CHAR_TAB = 9);
            exports_17("CHAR_FORM_FEED", CHAR_FORM_FEED = 12);
            exports_17("CHAR_EXCLAMATION_MARK", CHAR_EXCLAMATION_MARK = 33);
            exports_17("CHAR_HASH", CHAR_HASH = 35);
            exports_17("CHAR_SPACE", CHAR_SPACE = 32);
            exports_17("CHAR_NO_BREAK_SPACE", CHAR_NO_BREAK_SPACE = 160);
            exports_17("CHAR_ZERO_WIDTH_NOBREAK_SPACE", CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279);
            exports_17("CHAR_LEFT_SQUARE_BRACKET", CHAR_LEFT_SQUARE_BRACKET = 91);
            exports_17("CHAR_RIGHT_SQUARE_BRACKET", CHAR_RIGHT_SQUARE_BRACKET = 93);
            exports_17("CHAR_LEFT_ANGLE_BRACKET", CHAR_LEFT_ANGLE_BRACKET = 60);
            exports_17("CHAR_RIGHT_ANGLE_BRACKET", CHAR_RIGHT_ANGLE_BRACKET = 62);
            exports_17("CHAR_LEFT_CURLY_BRACKET", CHAR_LEFT_CURLY_BRACKET = 123);
            exports_17("CHAR_RIGHT_CURLY_BRACKET", CHAR_RIGHT_CURLY_BRACKET = 125);
            exports_17("CHAR_HYPHEN_MINUS", CHAR_HYPHEN_MINUS = 45);
            exports_17("CHAR_PLUS", CHAR_PLUS = 43);
            exports_17("CHAR_DOUBLE_QUOTE", CHAR_DOUBLE_QUOTE = 34);
            exports_17("CHAR_SINGLE_QUOTE", CHAR_SINGLE_QUOTE = 39);
            exports_17("CHAR_PERCENT", CHAR_PERCENT = 37);
            exports_17("CHAR_SEMICOLON", CHAR_SEMICOLON = 59);
            exports_17("CHAR_CIRCUMFLEX_ACCENT", CHAR_CIRCUMFLEX_ACCENT = 94);
            exports_17("CHAR_GRAVE_ACCENT", CHAR_GRAVE_ACCENT = 96);
            exports_17("CHAR_AT", CHAR_AT = 64);
            exports_17("CHAR_AMPERSAND", CHAR_AMPERSAND = 38);
            exports_17("CHAR_EQUAL", CHAR_EQUAL = 61);
            exports_17("CHAR_0", CHAR_0 = 48);
            exports_17("CHAR_9", CHAR_9 = 57);
            navigator = globalThis.navigator;
            isWindows = false;
            exports_17("isWindows", isWindows);
            if (globalThis.Deno != null) {
                exports_17("isWindows", isWindows = Deno.build.os == "windows");
            }
            else if (navigator?.appVersion != null) {
                exports_17("isWindows", isWindows = navigator.appVersion.includes("Win"));
            }
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/_interface", [], function (exports_18, context_18) {
    "use strict";
    var __moduleName = context_18 && context_18.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/_util", ["https://deno.land/std@0.61.0/path/_constants"], function (exports_19, context_19) {
    "use strict";
    var _constants_ts_1;
    var __moduleName = context_19 && context_19.id;
    function assertPath(path) {
        if (typeof path !== "string") {
            throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
        }
    }
    exports_19("assertPath", assertPath);
    function isPosixPathSeparator(code) {
        return code === _constants_ts_1.CHAR_FORWARD_SLASH;
    }
    exports_19("isPosixPathSeparator", isPosixPathSeparator);
    function isPathSeparator(code) {
        return isPosixPathSeparator(code) || code === _constants_ts_1.CHAR_BACKWARD_SLASH;
    }
    exports_19("isPathSeparator", isPathSeparator);
    function isWindowsDeviceRoot(code) {
        return ((code >= _constants_ts_1.CHAR_LOWERCASE_A && code <= _constants_ts_1.CHAR_LOWERCASE_Z) ||
            (code >= _constants_ts_1.CHAR_UPPERCASE_A && code <= _constants_ts_1.CHAR_UPPERCASE_Z));
    }
    exports_19("isWindowsDeviceRoot", isWindowsDeviceRoot);
    function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
        let res = "";
        let lastSegmentLength = 0;
        let lastSlash = -1;
        let dots = 0;
        let code;
        for (let i = 0, len = path.length; i <= len; ++i) {
            if (i < len)
                code = path.charCodeAt(i);
            else if (isPathSeparator(code))
                break;
            else
                code = _constants_ts_1.CHAR_FORWARD_SLASH;
            if (isPathSeparator(code)) {
                if (lastSlash === i - 1 || dots === 1) {
                }
                else if (lastSlash !== i - 1 && dots === 2) {
                    if (res.length < 2 ||
                        lastSegmentLength !== 2 ||
                        res.charCodeAt(res.length - 1) !== _constants_ts_1.CHAR_DOT ||
                        res.charCodeAt(res.length - 2) !== _constants_ts_1.CHAR_DOT) {
                        if (res.length > 2) {
                            const lastSlashIndex = res.lastIndexOf(separator);
                            if (lastSlashIndex === -1) {
                                res = "";
                                lastSegmentLength = 0;
                            }
                            else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                        else if (res.length === 2 || res.length === 1) {
                            res = "";
                            lastSegmentLength = 0;
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    }
                    if (allowAboveRoot) {
                        if (res.length > 0)
                            res += `${separator}..`;
                        else
                            res = "..";
                        lastSegmentLength = 2;
                    }
                }
                else {
                    if (res.length > 0)
                        res += separator + path.slice(lastSlash + 1, i);
                    else
                        res = path.slice(lastSlash + 1, i);
                    lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
            }
            else if (code === _constants_ts_1.CHAR_DOT && dots !== -1) {
                ++dots;
            }
            else {
                dots = -1;
            }
        }
        return res;
    }
    exports_19("normalizeString", normalizeString);
    function _format(sep, pathObject) {
        const dir = pathObject.dir || pathObject.root;
        const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
        if (!dir)
            return base;
        if (dir === pathObject.root)
            return dir + base;
        return dir + sep + base;
    }
    exports_19("_format", _format);
    return {
        setters: [
            function (_constants_ts_1_1) {
                _constants_ts_1 = _constants_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/win32", ["https://deno.land/std@0.61.0/path/_constants", "https://deno.land/std@0.61.0/path/_util", "https://deno.land/std@0.61.0/_util/assert"], function (exports_20, context_20) {
    "use strict";
    var _constants_ts_2, _util_ts_1, assert_ts_4, sep, delimiter;
    var __moduleName = context_20 && context_20.id;
    function resolve(...pathSegments) {
        let resolvedDevice = "";
        let resolvedTail = "";
        let resolvedAbsolute = false;
        for (let i = pathSegments.length - 1; i >= -1; i--) {
            let path;
            if (i >= 0) {
                path = pathSegments[i];
            }
            else if (!resolvedDevice) {
                if (globalThis.Deno == null) {
                    throw new TypeError("Resolved a drive-letter-less path without a CWD.");
                }
                path = Deno.cwd();
            }
            else {
                if (globalThis.Deno == null) {
                    throw new TypeError("Resolved a relative path without a CWD.");
                }
                path = Deno.env.get(`=${resolvedDevice}`) || Deno.cwd();
                if (path === undefined ||
                    path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                    path = `${resolvedDevice}\\`;
                }
            }
            _util_ts_1.assertPath(path);
            const len = path.length;
            if (len === 0)
                continue;
            let rootEnd = 0;
            let device = "";
            let isAbsolute = false;
            const code = path.charCodeAt(0);
            if (len > 1) {
                if (_util_ts_1.isPathSeparator(code)) {
                    isAbsolute = true;
                    if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
                        let j = 2;
                        let last = j;
                        for (; j < len; ++j) {
                            if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last) {
                            const firstPart = path.slice(last, j);
                            last = j;
                            for (; j < len; ++j) {
                                if (!_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j < len && j !== last) {
                                last = j;
                                for (; j < len; ++j) {
                                    if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                        break;
                                }
                                if (j === len) {
                                    device = `\\\\${firstPart}\\${path.slice(last)}`;
                                    rootEnd = j;
                                }
                                else if (j !== last) {
                                    device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                    rootEnd = j;
                                }
                            }
                        }
                    }
                    else {
                        rootEnd = 1;
                    }
                }
                else if (_util_ts_1.isWindowsDeviceRoot(code)) {
                    if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
                        device = path.slice(0, 2);
                        rootEnd = 2;
                        if (len > 2) {
                            if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                                isAbsolute = true;
                                rootEnd = 3;
                            }
                        }
                    }
                }
            }
            else if (_util_ts_1.isPathSeparator(code)) {
                rootEnd = 1;
                isAbsolute = true;
            }
            if (device.length > 0 &&
                resolvedDevice.length > 0 &&
                device.toLowerCase() !== resolvedDevice.toLowerCase()) {
                continue;
            }
            if (resolvedDevice.length === 0 && device.length > 0) {
                resolvedDevice = device;
            }
            if (!resolvedAbsolute) {
                resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
                resolvedAbsolute = isAbsolute;
            }
            if (resolvedAbsolute && resolvedDevice.length > 0)
                break;
        }
        resolvedTail = _util_ts_1.normalizeString(resolvedTail, !resolvedAbsolute, "\\", _util_ts_1.isPathSeparator);
        return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
    }
    exports_20("resolve", resolve);
    function normalize(path) {
        _util_ts_1.assertPath(path);
        const len = path.length;
        if (len === 0)
            return ".";
        let rootEnd = 0;
        let device;
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (_util_ts_1.isPathSeparator(code)) {
                isAbsolute = true;
                if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for (; j < len; ++j) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                            break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for (; j < len; ++j) {
                            if (!_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for (; j < len; ++j) {
                                if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j === len) {
                                return `\\\\${firstPart}\\${path.slice(last)}\\`;
                            }
                            else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                }
                else {
                    rootEnd = 1;
                }
            }
            else if (_util_ts_1.isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        }
        else if (_util_ts_1.isPathSeparator(code)) {
            return "\\";
        }
        let tail;
        if (rootEnd < len) {
            tail = _util_ts_1.normalizeString(path.slice(rootEnd), !isAbsolute, "\\", _util_ts_1.isPathSeparator);
        }
        else {
            tail = "";
        }
        if (tail.length === 0 && !isAbsolute)
            tail = ".";
        if (tail.length > 0 && _util_ts_1.isPathSeparator(path.charCodeAt(len - 1))) {
            tail += "\\";
        }
        if (device === undefined) {
            if (isAbsolute) {
                if (tail.length > 0)
                    return `\\${tail}`;
                else
                    return "\\";
            }
            else if (tail.length > 0) {
                return tail;
            }
            else {
                return "";
            }
        }
        else if (isAbsolute) {
            if (tail.length > 0)
                return `${device}\\${tail}`;
            else
                return `${device}\\`;
        }
        else if (tail.length > 0) {
            return device + tail;
        }
        else {
            return device;
        }
    }
    exports_20("normalize", normalize);
    function isAbsolute(path) {
        _util_ts_1.assertPath(path);
        const len = path.length;
        if (len === 0)
            return false;
        const code = path.charCodeAt(0);
        if (_util_ts_1.isPathSeparator(code)) {
            return true;
        }
        else if (_util_ts_1.isWindowsDeviceRoot(code)) {
            if (len > 2 && path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
                if (_util_ts_1.isPathSeparator(path.charCodeAt(2)))
                    return true;
            }
        }
        return false;
    }
    exports_20("isAbsolute", isAbsolute);
    function join(...paths) {
        const pathsCount = paths.length;
        if (pathsCount === 0)
            return ".";
        let joined;
        let firstPart = null;
        for (let i = 0; i < pathsCount; ++i) {
            const path = paths[i];
            _util_ts_1.assertPath(path);
            if (path.length > 0) {
                if (joined === undefined)
                    joined = firstPart = path;
                else
                    joined += `\\${path}`;
            }
        }
        if (joined === undefined)
            return ".";
        let needsReplace = true;
        let slashCount = 0;
        assert_ts_4.assert(firstPart != null);
        if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(0))) {
            ++slashCount;
            const firstLen = firstPart.length;
            if (firstLen > 1) {
                if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(1))) {
                    ++slashCount;
                    if (firstLen > 2) {
                        if (_util_ts_1.isPathSeparator(firstPart.charCodeAt(2)))
                            ++slashCount;
                        else {
                            needsReplace = false;
                        }
                    }
                }
            }
        }
        if (needsReplace) {
            for (; slashCount < joined.length; ++slashCount) {
                if (!_util_ts_1.isPathSeparator(joined.charCodeAt(slashCount)))
                    break;
            }
            if (slashCount >= 2)
                joined = `\\${joined.slice(slashCount)}`;
        }
        return normalize(joined);
    }
    exports_20("join", join);
    function relative(from, to) {
        _util_ts_1.assertPath(from);
        _util_ts_1.assertPath(to);
        if (from === to)
            return "";
        const fromOrig = resolve(from);
        const toOrig = resolve(to);
        if (fromOrig === toOrig)
            return "";
        from = fromOrig.toLowerCase();
        to = toOrig.toLowerCase();
        if (from === to)
            return "";
        let fromStart = 0;
        let fromEnd = from.length;
        for (; fromStart < fromEnd; ++fromStart) {
            if (from.charCodeAt(fromStart) !== _constants_ts_2.CHAR_BACKWARD_SLASH)
                break;
        }
        for (; fromEnd - 1 > fromStart; --fromEnd) {
            if (from.charCodeAt(fromEnd - 1) !== _constants_ts_2.CHAR_BACKWARD_SLASH)
                break;
        }
        const fromLen = fromEnd - fromStart;
        let toStart = 0;
        let toEnd = to.length;
        for (; toStart < toEnd; ++toStart) {
            if (to.charCodeAt(toStart) !== _constants_ts_2.CHAR_BACKWARD_SLASH)
                break;
        }
        for (; toEnd - 1 > toStart; --toEnd) {
            if (to.charCodeAt(toEnd - 1) !== _constants_ts_2.CHAR_BACKWARD_SLASH)
                break;
        }
        const toLen = toEnd - toStart;
        const length = fromLen < toLen ? fromLen : toLen;
        let lastCommonSep = -1;
        let i = 0;
        for (; i <= length; ++i) {
            if (i === length) {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                        return toOrig.slice(toStart + i + 1);
                    }
                    else if (i === 2) {
                        return toOrig.slice(toStart + i);
                    }
                }
                if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                        lastCommonSep = i;
                    }
                    else if (i === 2) {
                        lastCommonSep = 3;
                    }
                }
                break;
            }
            const fromCode = from.charCodeAt(fromStart + i);
            const toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
                break;
            else if (fromCode === _constants_ts_2.CHAR_BACKWARD_SLASH)
                lastCommonSep = i;
        }
        if (i !== length && lastCommonSep === -1) {
            return toOrig;
        }
        let out = "";
        if (lastCommonSep === -1)
            lastCommonSep = 0;
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                if (out.length === 0)
                    out += "..";
                else
                    out += "\\..";
            }
        }
        if (out.length > 0) {
            return out + toOrig.slice(toStart + lastCommonSep, toEnd);
        }
        else {
            toStart += lastCommonSep;
            if (toOrig.charCodeAt(toStart) === _constants_ts_2.CHAR_BACKWARD_SLASH)
                ++toStart;
            return toOrig.slice(toStart, toEnd);
        }
    }
    exports_20("relative", relative);
    function toNamespacedPath(path) {
        if (typeof path !== "string")
            return path;
        if (path.length === 0)
            return "";
        const resolvedPath = resolve(path);
        if (resolvedPath.length >= 3) {
            if (resolvedPath.charCodeAt(0) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                if (resolvedPath.charCodeAt(1) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                    const code = resolvedPath.charCodeAt(2);
                    if (code !== _constants_ts_2.CHAR_QUESTION_MARK && code !== _constants_ts_2.CHAR_DOT) {
                        return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                    }
                }
            }
            else if (_util_ts_1.isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
                if (resolvedPath.charCodeAt(1) === _constants_ts_2.CHAR_COLON &&
                    resolvedPath.charCodeAt(2) === _constants_ts_2.CHAR_BACKWARD_SLASH) {
                    return `\\\\?\\${resolvedPath}`;
                }
            }
        }
        return path;
    }
    exports_20("toNamespacedPath", toNamespacedPath);
    function dirname(path) {
        _util_ts_1.assertPath(path);
        const len = path.length;
        if (len === 0)
            return ".";
        let rootEnd = -1;
        let end = -1;
        let matchedSlash = true;
        let offset = 0;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (_util_ts_1.isPathSeparator(code)) {
                rootEnd = offset = 1;
                if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for (; j < len; ++j) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                            break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for (; j < len; ++j) {
                            if (!_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for (; j < len; ++j) {
                                if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j === len) {
                                return path;
                            }
                            if (j !== last) {
                                rootEnd = offset = j + 1;
                            }
                        }
                    }
                }
            }
            else if (_util_ts_1.isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
                    rootEnd = offset = 2;
                    if (len > 2) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(2)))
                            rootEnd = offset = 3;
                    }
                }
            }
        }
        else if (_util_ts_1.isPathSeparator(code)) {
            return path;
        }
        for (let i = len - 1; i >= offset; --i) {
            if (_util_ts_1.isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            }
            else {
                matchedSlash = false;
            }
        }
        if (end === -1) {
            if (rootEnd === -1)
                return ".";
            else
                end = rootEnd;
        }
        return path.slice(0, end);
    }
    exports_20("dirname", dirname);
    function basename(path, ext = "") {
        if (ext !== undefined && typeof ext !== "string") {
            throw new TypeError('"ext" argument must be a string');
        }
        _util_ts_1.assertPath(path);
        let start = 0;
        let end = -1;
        let matchedSlash = true;
        let i;
        if (path.length >= 2) {
            const drive = path.charCodeAt(0);
            if (_util_ts_1.isWindowsDeviceRoot(drive)) {
                if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON)
                    start = 2;
            }
        }
        if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path)
                return "";
            let extIdx = ext.length - 1;
            let firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= start; --i) {
                const code = path.charCodeAt(i);
                if (_util_ts_1.isPathSeparator(code)) {
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else {
                    if (firstNonSlashEnd === -1) {
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                        if (code === ext.charCodeAt(extIdx)) {
                            if (--extIdx === -1) {
                                end = i;
                            }
                        }
                        else {
                            extIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
            if (start === end)
                end = firstNonSlashEnd;
            else if (end === -1)
                end = path.length;
            return path.slice(start, end);
        }
        else {
            for (i = path.length - 1; i >= start; --i) {
                if (_util_ts_1.isPathSeparator(path.charCodeAt(i))) {
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else if (end === -1) {
                    matchedSlash = false;
                    end = i + 1;
                }
            }
            if (end === -1)
                return "";
            return path.slice(start, end);
        }
    }
    exports_20("basename", basename);
    function extname(path) {
        _util_ts_1.assertPath(path);
        let start = 0;
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let preDotState = 0;
        if (path.length >= 2 &&
            path.charCodeAt(1) === _constants_ts_2.CHAR_COLON &&
            _util_ts_1.isWindowsDeviceRoot(path.charCodeAt(0))) {
            start = startPart = 2;
        }
        for (let i = path.length - 1; i >= start; --i) {
            const code = path.charCodeAt(i);
            if (_util_ts_1.isPathSeparator(code)) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === _constants_ts_2.CHAR_DOT) {
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 ||
            end === -1 ||
            preDotState === 0 ||
            (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
            return "";
        }
        return path.slice(startDot, end);
    }
    exports_20("extname", extname);
    function format(pathObject) {
        if (pathObject === null || typeof pathObject !== "object") {
            throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
        }
        return _util_ts_1._format("\\", pathObject);
    }
    exports_20("format", format);
    function parse(path) {
        _util_ts_1.assertPath(path);
        const ret = { root: "", dir: "", base: "", ext: "", name: "" };
        const len = path.length;
        if (len === 0)
            return ret;
        let rootEnd = 0;
        let code = path.charCodeAt(0);
        if (len > 1) {
            if (_util_ts_1.isPathSeparator(code)) {
                rootEnd = 1;
                if (_util_ts_1.isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for (; j < len; ++j) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                            break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for (; j < len; ++j) {
                            if (!_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for (; j < len; ++j) {
                                if (_util_ts_1.isPathSeparator(path.charCodeAt(j)))
                                    break;
                            }
                            if (j === len) {
                                rootEnd = j;
                            }
                            else if (j !== last) {
                                rootEnd = j + 1;
                            }
                        }
                    }
                }
            }
            else if (_util_ts_1.isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === _constants_ts_2.CHAR_COLON) {
                    rootEnd = 2;
                    if (len > 2) {
                        if (_util_ts_1.isPathSeparator(path.charCodeAt(2))) {
                            if (len === 3) {
                                ret.root = ret.dir = path;
                                return ret;
                            }
                            rootEnd = 3;
                        }
                    }
                    else {
                        ret.root = ret.dir = path;
                        return ret;
                    }
                }
            }
        }
        else if (_util_ts_1.isPathSeparator(code)) {
            ret.root = ret.dir = path;
            return ret;
        }
        if (rootEnd > 0)
            ret.root = path.slice(0, rootEnd);
        let startDot = -1;
        let startPart = rootEnd;
        let end = -1;
        let matchedSlash = true;
        let i = path.length - 1;
        let preDotState = 0;
        for (; i >= rootEnd; --i) {
            code = path.charCodeAt(i);
            if (_util_ts_1.isPathSeparator(code)) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === _constants_ts_2.CHAR_DOT) {
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 ||
            end === -1 ||
            preDotState === 0 ||
            (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
            if (end !== -1) {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
            ret.ext = path.slice(startDot, end);
        }
        if (startPart > 0 && startPart !== rootEnd) {
            ret.dir = path.slice(0, startPart - 1);
        }
        else
            ret.dir = ret.root;
        return ret;
    }
    exports_20("parse", parse);
    function fromFileUrl(url) {
        return new URL(String(url)).pathname
            .replace(/^\/*([A-Za-z]:)(\/|$)/, "$1/")
            .replace(/\//g, "\\");
    }
    exports_20("fromFileUrl", fromFileUrl);
    return {
        setters: [
            function (_constants_ts_2_1) {
                _constants_ts_2 = _constants_ts_2_1;
            },
            function (_util_ts_1_1) {
                _util_ts_1 = _util_ts_1_1;
            },
            function (assert_ts_4_1) {
                assert_ts_4 = assert_ts_4_1;
            }
        ],
        execute: function () {
            exports_20("sep", sep = "\\");
            exports_20("delimiter", delimiter = ";");
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/posix", ["https://deno.land/std@0.61.0/path/_constants", "https://deno.land/std@0.61.0/path/_util"], function (exports_21, context_21) {
    "use strict";
    var _constants_ts_3, _util_ts_2, sep, delimiter;
    var __moduleName = context_21 && context_21.id;
    function resolve(...pathSegments) {
        let resolvedPath = "";
        let resolvedAbsolute = false;
        for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            let path;
            if (i >= 0)
                path = pathSegments[i];
            else {
                if (globalThis.Deno == null) {
                    throw new TypeError("Resolved a relative path without a CWD.");
                }
                path = Deno.cwd();
            }
            _util_ts_2.assertPath(path);
            if (path.length === 0) {
                continue;
            }
            resolvedPath = `${path}/${resolvedPath}`;
            resolvedAbsolute = path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
        }
        resolvedPath = _util_ts_2.normalizeString(resolvedPath, !resolvedAbsolute, "/", _util_ts_2.isPosixPathSeparator);
        if (resolvedAbsolute) {
            if (resolvedPath.length > 0)
                return `/${resolvedPath}`;
            else
                return "/";
        }
        else if (resolvedPath.length > 0)
            return resolvedPath;
        else
            return ".";
    }
    exports_21("resolve", resolve);
    function normalize(path) {
        _util_ts_2.assertPath(path);
        if (path.length === 0)
            return ".";
        const isAbsolute = path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
        const trailingSeparator = path.charCodeAt(path.length - 1) === _constants_ts_3.CHAR_FORWARD_SLASH;
        path = _util_ts_2.normalizeString(path, !isAbsolute, "/", _util_ts_2.isPosixPathSeparator);
        if (path.length === 0 && !isAbsolute)
            path = ".";
        if (path.length > 0 && trailingSeparator)
            path += "/";
        if (isAbsolute)
            return `/${path}`;
        return path;
    }
    exports_21("normalize", normalize);
    function isAbsolute(path) {
        _util_ts_2.assertPath(path);
        return path.length > 0 && path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
    }
    exports_21("isAbsolute", isAbsolute);
    function join(...paths) {
        if (paths.length === 0)
            return ".";
        let joined;
        for (let i = 0, len = paths.length; i < len; ++i) {
            const path = paths[i];
            _util_ts_2.assertPath(path);
            if (path.length > 0) {
                if (!joined)
                    joined = path;
                else
                    joined += `/${path}`;
            }
        }
        if (!joined)
            return ".";
        return normalize(joined);
    }
    exports_21("join", join);
    function relative(from, to) {
        _util_ts_2.assertPath(from);
        _util_ts_2.assertPath(to);
        if (from === to)
            return "";
        from = resolve(from);
        to = resolve(to);
        if (from === to)
            return "";
        let fromStart = 1;
        const fromEnd = from.length;
        for (; fromStart < fromEnd; ++fromStart) {
            if (from.charCodeAt(fromStart) !== _constants_ts_3.CHAR_FORWARD_SLASH)
                break;
        }
        const fromLen = fromEnd - fromStart;
        let toStart = 1;
        const toEnd = to.length;
        for (; toStart < toEnd; ++toStart) {
            if (to.charCodeAt(toStart) !== _constants_ts_3.CHAR_FORWARD_SLASH)
                break;
        }
        const toLen = toEnd - toStart;
        const length = fromLen < toLen ? fromLen : toLen;
        let lastCommonSep = -1;
        let i = 0;
        for (; i <= length; ++i) {
            if (i === length) {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
                        return to.slice(toStart + i + 1);
                    }
                    else if (i === 0) {
                        return to.slice(toStart + i);
                    }
                }
                else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
                        lastCommonSep = i;
                    }
                    else if (i === 0) {
                        lastCommonSep = 0;
                    }
                }
                break;
            }
            const fromCode = from.charCodeAt(fromStart + i);
            const toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
                break;
            else if (fromCode === _constants_ts_3.CHAR_FORWARD_SLASH)
                lastCommonSep = i;
        }
        let out = "";
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
                if (out.length === 0)
                    out += "..";
                else
                    out += "/..";
            }
        }
        if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
        else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === _constants_ts_3.CHAR_FORWARD_SLASH)
                ++toStart;
            return to.slice(toStart);
        }
    }
    exports_21("relative", relative);
    function toNamespacedPath(path) {
        return path;
    }
    exports_21("toNamespacedPath", toNamespacedPath);
    function dirname(path) {
        _util_ts_2.assertPath(path);
        if (path.length === 0)
            return ".";
        const hasRoot = path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
        let end = -1;
        let matchedSlash = true;
        for (let i = path.length - 1; i >= 1; --i) {
            if (path.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                    end = i;
                    break;
                }
            }
            else {
                matchedSlash = false;
            }
        }
        if (end === -1)
            return hasRoot ? "/" : ".";
        if (hasRoot && end === 1)
            return "//";
        return path.slice(0, end);
    }
    exports_21("dirname", dirname);
    function basename(path, ext = "") {
        if (ext !== undefined && typeof ext !== "string") {
            throw new TypeError('"ext" argument must be a string');
        }
        _util_ts_2.assertPath(path);
        let start = 0;
        let end = -1;
        let matchedSlash = true;
        let i;
        if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path)
                return "";
            let extIdx = ext.length - 1;
            let firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
                const code = path.charCodeAt(i);
                if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else {
                    if (firstNonSlashEnd === -1) {
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                        if (code === ext.charCodeAt(extIdx)) {
                            if (--extIdx === -1) {
                                end = i;
                            }
                        }
                        else {
                            extIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
            if (start === end)
                end = firstNonSlashEnd;
            else if (end === -1)
                end = path.length;
            return path.slice(start, end);
        }
        else {
            for (i = path.length - 1; i >= 0; --i) {
                if (path.charCodeAt(i) === _constants_ts_3.CHAR_FORWARD_SLASH) {
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else if (end === -1) {
                    matchedSlash = false;
                    end = i + 1;
                }
            }
            if (end === -1)
                return "";
            return path.slice(start, end);
        }
    }
    exports_21("basename", basename);
    function extname(path) {
        _util_ts_2.assertPath(path);
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let preDotState = 0;
        for (let i = path.length - 1; i >= 0; --i) {
            const code = path.charCodeAt(i);
            if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === _constants_ts_3.CHAR_DOT) {
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 ||
            end === -1 ||
            preDotState === 0 ||
            (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
            return "";
        }
        return path.slice(startDot, end);
    }
    exports_21("extname", extname);
    function format(pathObject) {
        if (pathObject === null || typeof pathObject !== "object") {
            throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
        }
        return _util_ts_2._format("/", pathObject);
    }
    exports_21("format", format);
    function parse(path) {
        _util_ts_2.assertPath(path);
        const ret = { root: "", dir: "", base: "", ext: "", name: "" };
        if (path.length === 0)
            return ret;
        const isAbsolute = path.charCodeAt(0) === _constants_ts_3.CHAR_FORWARD_SLASH;
        let start;
        if (isAbsolute) {
            ret.root = "/";
            start = 1;
        }
        else {
            start = 0;
        }
        let startDot = -1;
        let startPart = 0;
        let end = -1;
        let matchedSlash = true;
        let i = path.length - 1;
        let preDotState = 0;
        for (; i >= start; --i) {
            const code = path.charCodeAt(i);
            if (code === _constants_ts_3.CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
            if (code === _constants_ts_3.CHAR_DOT) {
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }
            else if (startDot !== -1) {
                preDotState = -1;
            }
        }
        if (startDot === -1 ||
            end === -1 ||
            preDotState === 0 ||
            (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
            if (end !== -1) {
                if (startPart === 0 && isAbsolute) {
                    ret.base = ret.name = path.slice(1, end);
                }
                else {
                    ret.base = ret.name = path.slice(startPart, end);
                }
            }
        }
        else {
            if (startPart === 0 && isAbsolute) {
                ret.name = path.slice(1, startDot);
                ret.base = path.slice(1, end);
            }
            else {
                ret.name = path.slice(startPart, startDot);
                ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
        }
        if (startPart > 0)
            ret.dir = path.slice(0, startPart - 1);
        else if (isAbsolute)
            ret.dir = "/";
        return ret;
    }
    exports_21("parse", parse);
    function fromFileUrl(url) {
        return new URL(String(url)).pathname;
    }
    exports_21("fromFileUrl", fromFileUrl);
    return {
        setters: [
            function (_constants_ts_3_1) {
                _constants_ts_3 = _constants_ts_3_1;
            },
            function (_util_ts_2_1) {
                _util_ts_2 = _util_ts_2_1;
            }
        ],
        execute: function () {
            exports_21("sep", sep = "/");
            exports_21("delimiter", delimiter = ":");
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/separator", ["https://deno.land/std@0.61.0/path/_constants"], function (exports_22, context_22) {
    "use strict";
    var _constants_ts_4, SEP, SEP_PATTERN;
    var __moduleName = context_22 && context_22.id;
    return {
        setters: [
            function (_constants_ts_4_1) {
                _constants_ts_4 = _constants_ts_4_1;
            }
        ],
        execute: function () {
            exports_22("SEP", SEP = _constants_ts_4.isWindows ? "\\" : "/");
            exports_22("SEP_PATTERN", SEP_PATTERN = _constants_ts_4.isWindows ? /[\\/]+/ : /\/+/);
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/common", ["https://deno.land/std@0.61.0/path/separator"], function (exports_23, context_23) {
    "use strict";
    var separator_ts_1;
    var __moduleName = context_23 && context_23.id;
    function common(paths, sep = separator_ts_1.SEP) {
        const [first = "", ...remaining] = paths;
        if (first === "" || remaining.length === 0) {
            return first.substring(0, first.lastIndexOf(sep) + 1);
        }
        const parts = first.split(sep);
        let endOfPrefix = parts.length;
        for (const path of remaining) {
            const compare = path.split(sep);
            for (let i = 0; i < endOfPrefix; i++) {
                if (compare[i] !== parts[i]) {
                    endOfPrefix = i;
                }
            }
            if (endOfPrefix === 0) {
                return "";
            }
        }
        const prefix = parts.slice(0, endOfPrefix).join(sep);
        return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
    }
    exports_23("common", common);
    return {
        setters: [
            function (separator_ts_1_1) {
                separator_ts_1 = separator_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/_globrex", ["https://deno.land/std@0.61.0/path/_constants"], function (exports_24, context_24) {
    "use strict";
    var _constants_ts_5, SEP, SEP_ESC, SEP_RAW, GLOBSTAR, WILDCARD, GLOBSTAR_SEGMENT, WILDCARD_SEGMENT;
    var __moduleName = context_24 && context_24.id;
    function globrex(glob, { extended = false, globstar = false, strict = false, filepath = false, flags = "", } = {}) {
        const sepPattern = new RegExp(`^${SEP}${strict ? "" : "+"}$`);
        let regex = "";
        let segment = "";
        let pathRegexStr = "";
        const pathSegments = [];
        let inGroup = false;
        let inRange = false;
        const ext = [];
        function add(str, options = { split: false, last: false, only: "" }) {
            const { split, last, only } = options;
            if (only !== "path")
                regex += str;
            if (filepath && only !== "regex") {
                pathRegexStr += str.match(sepPattern) ? SEP : str;
                if (split) {
                    if (last)
                        segment += str;
                    if (segment !== "") {
                        if (!flags.includes("g"))
                            segment = `^${segment}$`;
                        pathSegments.push(new RegExp(segment, flags));
                    }
                    segment = "";
                }
                else {
                    segment += str;
                }
            }
        }
        let c, n;
        for (let i = 0; i < glob.length; i++) {
            c = glob[i];
            n = glob[i + 1];
            if (["\\", "$", "^", ".", "="].includes(c)) {
                add(`\\${c}`);
                continue;
            }
            if (c.match(sepPattern)) {
                add(SEP, { split: true });
                if (n != null && n.match(sepPattern) && !strict)
                    regex += "?";
                continue;
            }
            if (c === "(") {
                if (ext.length) {
                    add(`${c}?:`);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === ")") {
                if (ext.length) {
                    add(c);
                    const type = ext.pop();
                    if (type === "@") {
                        add("{1}");
                    }
                    else if (type === "!") {
                        add(WILDCARD);
                    }
                    else {
                        add(type);
                    }
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "|") {
                if (ext.length) {
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "+") {
                if (n === "(" && extended) {
                    ext.push(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "@" && extended) {
                if (n === "(") {
                    ext.push(c);
                    continue;
                }
            }
            if (c === "!") {
                if (extended) {
                    if (inRange) {
                        add("^");
                        continue;
                    }
                    if (n === "(") {
                        ext.push(c);
                        add("(?!");
                        i++;
                        continue;
                    }
                    add(`\\${c}`);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "?") {
                if (extended) {
                    if (n === "(") {
                        ext.push(c);
                    }
                    else {
                        add(".");
                    }
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "[") {
                if (inRange && n === ":") {
                    i++;
                    let value = "";
                    while (glob[++i] !== ":")
                        value += glob[i];
                    if (value === "alnum")
                        add("(?:\\w|\\d)");
                    else if (value === "space")
                        add("\\s");
                    else if (value === "digit")
                        add("\\d");
                    i++;
                    continue;
                }
                if (extended) {
                    inRange = true;
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "]") {
                if (extended) {
                    inRange = false;
                    add(c);
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "{") {
                if (extended) {
                    inGroup = true;
                    add("(?:");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "}") {
                if (extended) {
                    inGroup = false;
                    add(")");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === ",") {
                if (inGroup) {
                    add("|");
                    continue;
                }
                add(`\\${c}`);
                continue;
            }
            if (c === "*") {
                if (n === "(" && extended) {
                    ext.push(c);
                    continue;
                }
                const prevChar = glob[i - 1];
                let starCount = 1;
                while (glob[i + 1] === "*") {
                    starCount++;
                    i++;
                }
                const nextChar = glob[i + 1];
                if (!globstar) {
                    add(".*");
                }
                else {
                    const isGlobstar = starCount > 1 &&
                        [SEP_RAW, "/", undefined].includes(prevChar) &&
                        [SEP_RAW, "/", undefined].includes(nextChar);
                    if (isGlobstar) {
                        add(GLOBSTAR, { only: "regex" });
                        add(GLOBSTAR_SEGMENT, { only: "path", last: true, split: true });
                        i++;
                    }
                    else {
                        add(WILDCARD, { only: "regex" });
                        add(WILDCARD_SEGMENT, { only: "path" });
                    }
                }
                continue;
            }
            add(c);
        }
        if (!flags.includes("g")) {
            regex = `^${regex}$`;
            segment = `^${segment}$`;
            if (filepath)
                pathRegexStr = `^${pathRegexStr}$`;
        }
        const result = { regex: new RegExp(regex, flags) };
        if (filepath) {
            pathSegments.push(new RegExp(segment, flags));
            result.path = {
                regex: new RegExp(pathRegexStr, flags),
                segments: pathSegments,
                globstar: new RegExp(!flags.includes("g") ? `^${GLOBSTAR_SEGMENT}$` : GLOBSTAR_SEGMENT, flags),
            };
        }
        return result;
    }
    exports_24("globrex", globrex);
    return {
        setters: [
            function (_constants_ts_5_1) {
                _constants_ts_5 = _constants_ts_5_1;
            }
        ],
        execute: function () {
            SEP = _constants_ts_5.isWindows ? `(?:\\\\|\\/)` : `\\/`;
            SEP_ESC = _constants_ts_5.isWindows ? `\\\\` : `/`;
            SEP_RAW = _constants_ts_5.isWindows ? `\\` : `/`;
            GLOBSTAR = `(?:(?:[^${SEP_ESC}/]*(?:${SEP_ESC}|\/|$))*)`;
            WILDCARD = `(?:[^${SEP_ESC}/]*)`;
            GLOBSTAR_SEGMENT = `((?:[^${SEP_ESC}/]*(?:${SEP_ESC}|\/|$))*)`;
            WILDCARD_SEGMENT = `(?:[^${SEP_ESC}/]*)`;
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/glob", ["https://deno.land/std@0.61.0/path/separator", "https://deno.land/std@0.61.0/path/_globrex", "https://deno.land/std@0.61.0/path/mod", "https://deno.land/std@0.61.0/_util/assert"], function (exports_25, context_25) {
    "use strict";
    var separator_ts_2, _globrex_ts_1, mod_ts_5, assert_ts_5;
    var __moduleName = context_25 && context_25.id;
    function globToRegExp(glob, { extended = false, globstar = true } = {}) {
        const result = _globrex_ts_1.globrex(glob, {
            extended,
            globstar,
            strict: false,
            filepath: true,
        });
        assert_ts_5.assert(result.path != null);
        return result.path.regex;
    }
    exports_25("globToRegExp", globToRegExp);
    function isGlob(str) {
        const chars = { "{": "}", "(": ")", "[": "]" };
        const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
        if (str === "") {
            return false;
        }
        let match;
        while ((match = regex.exec(str))) {
            if (match[2])
                return true;
            let idx = match.index + match[0].length;
            const open = match[1];
            const close = open ? chars[open] : null;
            if (open && close) {
                const n = str.indexOf(close, idx);
                if (n !== -1) {
                    idx = n + 1;
                }
            }
            str = str.slice(idx);
        }
        return false;
    }
    exports_25("isGlob", isGlob);
    function normalizeGlob(glob, { globstar = false } = {}) {
        if (glob.match(/\0/g)) {
            throw new Error(`Glob contains invalid characters: "${glob}"`);
        }
        if (!globstar) {
            return mod_ts_5.normalize(glob);
        }
        const s = separator_ts_2.SEP_PATTERN.source;
        const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
        return mod_ts_5.normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
    }
    exports_25("normalizeGlob", normalizeGlob);
    function joinGlobs(globs, { extended = false, globstar = false } = {}) {
        if (!globstar || globs.length == 0) {
            return mod_ts_5.join(...globs);
        }
        if (globs.length === 0)
            return ".";
        let joined;
        for (const glob of globs) {
            const path = glob;
            if (path.length > 0) {
                if (!joined)
                    joined = path;
                else
                    joined += `${separator_ts_2.SEP}${path}`;
            }
        }
        if (!joined)
            return ".";
        return normalizeGlob(joined, { extended, globstar });
    }
    exports_25("joinGlobs", joinGlobs);
    return {
        setters: [
            function (separator_ts_2_1) {
                separator_ts_2 = separator_ts_2_1;
            },
            function (_globrex_ts_1_1) {
                _globrex_ts_1 = _globrex_ts_1_1;
            },
            function (mod_ts_5_1) {
                mod_ts_5 = mod_ts_5_1;
            },
            function (assert_ts_5_1) {
                assert_ts_5 = assert_ts_5_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/path/mod", ["https://deno.land/std@0.61.0/path/_constants", "https://deno.land/std@0.61.0/path/win32", "https://deno.land/std@0.61.0/path/posix", "https://deno.land/std@0.61.0/path/common", "https://deno.land/std@0.61.0/path/separator", "https://deno.land/std@0.61.0/path/_interface", "https://deno.land/std@0.61.0/path/glob"], function (exports_26, context_26) {
    "use strict";
    var _constants_ts_6, _win32, _posix, path, win32, posix, basename, delimiter, dirname, extname, format, fromFileUrl, isAbsolute, join, normalize, parse, relative, resolve, sep, toNamespacedPath;
    var __moduleName = context_26 && context_26.id;
    var exportedNames_1 = {
        "win32": true,
        "posix": true,
        "basename": true,
        "delimiter": true,
        "dirname": true,
        "extname": true,
        "format": true,
        "fromFileUrl": true,
        "isAbsolute": true,
        "join": true,
        "normalize": true,
        "parse": true,
        "relative": true,
        "resolve": true,
        "sep": true,
        "toNamespacedPath": true,
        "SEP": true,
        "SEP_PATTERN": true
    };
    function exportStar_2(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default" && !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_26(exports);
    }
    return {
        setters: [
            function (_constants_ts_6_1) {
                _constants_ts_6 = _constants_ts_6_1;
            },
            function (_win32_1) {
                _win32 = _win32_1;
            },
            function (_posix_1) {
                _posix = _posix_1;
            },
            function (common_ts_1_1) {
                exportStar_2(common_ts_1_1);
            },
            function (separator_ts_3_1) {
                exports_26({
                    "SEP": separator_ts_3_1["SEP"],
                    "SEP_PATTERN": separator_ts_3_1["SEP_PATTERN"]
                });
            },
            function (_interface_ts_1_1) {
                exportStar_2(_interface_ts_1_1);
            },
            function (glob_ts_1_1) {
                exportStar_2(glob_ts_1_1);
            }
        ],
        execute: function () {
            path = _constants_ts_6.isWindows ? _win32 : _posix;
            exports_26("win32", win32 = _win32);
            exports_26("posix", posix = _posix);
            exports_26("basename", basename = path.basename), exports_26("delimiter", delimiter = path.delimiter), exports_26("dirname", dirname = path.dirname), exports_26("extname", extname = path.extname), exports_26("format", format = path.format), exports_26("fromFileUrl", fromFileUrl = path.fromFileUrl), exports_26("isAbsolute", isAbsolute = path.isAbsolute), exports_26("join", join = path.join), exports_26("normalize", normalize = path.normalize), exports_26("parse", parse = path.parse), exports_26("relative", relative = path.relative), exports_26("resolve", resolve = path.resolve), exports_26("sep", sep = path.sep), exports_26("toNamespacedPath", toNamespacedPath = path.toNamespacedPath);
        }
    };
});
System.register("https://deno.land/std@0.61.0/fmt/colors", [], function (exports_27, context_27) {
    "use strict";
    var noColor, enabled, ANSI_PATTERN;
    var __moduleName = context_27 && context_27.id;
    function setColorEnabled(value) {
        if (noColor) {
            return;
        }
        enabled = value;
    }
    exports_27("setColorEnabled", setColorEnabled);
    function getColorEnabled() {
        return enabled;
    }
    exports_27("getColorEnabled", getColorEnabled);
    function code(open, close) {
        return {
            open: `\x1b[${open.join(";")}m`,
            close: `\x1b[${close}m`,
            regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
        };
    }
    function run(str, code) {
        return enabled
            ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
            : str;
    }
    function reset(str) {
        return run(str, code([0], 0));
    }
    exports_27("reset", reset);
    function bold(str) {
        return run(str, code([1], 22));
    }
    exports_27("bold", bold);
    function dim(str) {
        return run(str, code([2], 22));
    }
    exports_27("dim", dim);
    function italic(str) {
        return run(str, code([3], 23));
    }
    exports_27("italic", italic);
    function underline(str) {
        return run(str, code([4], 24));
    }
    exports_27("underline", underline);
    function inverse(str) {
        return run(str, code([7], 27));
    }
    exports_27("inverse", inverse);
    function hidden(str) {
        return run(str, code([8], 28));
    }
    exports_27("hidden", hidden);
    function strikethrough(str) {
        return run(str, code([9], 29));
    }
    exports_27("strikethrough", strikethrough);
    function black(str) {
        return run(str, code([30], 39));
    }
    exports_27("black", black);
    function red(str) {
        return run(str, code([31], 39));
    }
    exports_27("red", red);
    function green(str) {
        return run(str, code([32], 39));
    }
    exports_27("green", green);
    function yellow(str) {
        return run(str, code([33], 39));
    }
    exports_27("yellow", yellow);
    function blue(str) {
        return run(str, code([34], 39));
    }
    exports_27("blue", blue);
    function magenta(str) {
        return run(str, code([35], 39));
    }
    exports_27("magenta", magenta);
    function cyan(str) {
        return run(str, code([36], 39));
    }
    exports_27("cyan", cyan);
    function white(str) {
        return run(str, code([37], 39));
    }
    exports_27("white", white);
    function gray(str) {
        return run(str, code([90], 39));
    }
    exports_27("gray", gray);
    function bgBlack(str) {
        return run(str, code([40], 49));
    }
    exports_27("bgBlack", bgBlack);
    function bgRed(str) {
        return run(str, code([41], 49));
    }
    exports_27("bgRed", bgRed);
    function bgGreen(str) {
        return run(str, code([42], 49));
    }
    exports_27("bgGreen", bgGreen);
    function bgYellow(str) {
        return run(str, code([43], 49));
    }
    exports_27("bgYellow", bgYellow);
    function bgBlue(str) {
        return run(str, code([44], 49));
    }
    exports_27("bgBlue", bgBlue);
    function bgMagenta(str) {
        return run(str, code([45], 49));
    }
    exports_27("bgMagenta", bgMagenta);
    function bgCyan(str) {
        return run(str, code([46], 49));
    }
    exports_27("bgCyan", bgCyan);
    function bgWhite(str) {
        return run(str, code([47], 49));
    }
    exports_27("bgWhite", bgWhite);
    function clampAndTruncate(n, max = 255, min = 0) {
        return Math.trunc(Math.max(Math.min(n, max), min));
    }
    function rgb8(str, color) {
        return run(str, code([38, 5, clampAndTruncate(color)], 39));
    }
    exports_27("rgb8", rgb8);
    function bgRgb8(str, color) {
        return run(str, code([48, 5, clampAndTruncate(color)], 49));
    }
    exports_27("bgRgb8", bgRgb8);
    function rgb24(str, color) {
        if (typeof color === "number") {
            return run(str, code([38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 39));
        }
        return run(str, code([
            38,
            2,
            clampAndTruncate(color.r),
            clampAndTruncate(color.g),
            clampAndTruncate(color.b),
        ], 39));
    }
    exports_27("rgb24", rgb24);
    function bgRgb24(str, color) {
        if (typeof color === "number") {
            return run(str, code([48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff], 49));
        }
        return run(str, code([
            48,
            2,
            clampAndTruncate(color.r),
            clampAndTruncate(color.g),
            clampAndTruncate(color.b),
        ], 49));
    }
    exports_27("bgRgb24", bgRgb24);
    function stripColor(string) {
        return string.replace(ANSI_PATTERN, "");
    }
    exports_27("stripColor", stripColor);
    return {
        setters: [],
        execute: function () {
            noColor = globalThis.Deno?.noColor ?? true;
            enabled = !noColor;
            ANSI_PATTERN = new RegExp([
                "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
                "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
            ].join("|"), "g");
        }
    };
});
System.register("https://deno.land/std@0.61.0/testing/diff", [], function (exports_28, context_28) {
    "use strict";
    var DiffType, REMOVED, COMMON, ADDED;
    var __moduleName = context_28 && context_28.id;
    function createCommon(A, B, reverse) {
        const common = [];
        if (A.length === 0 || B.length === 0)
            return [];
        for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
            if (A[reverse ? A.length - i - 1 : i] === B[reverse ? B.length - i - 1 : i]) {
                common.push(A[reverse ? A.length - i - 1 : i]);
            }
            else {
                return common;
            }
        }
        return common;
    }
    function diff(A, B) {
        const prefixCommon = createCommon(A, B);
        const suffixCommon = createCommon(A.slice(prefixCommon.length), B.slice(prefixCommon.length), true).reverse();
        A = suffixCommon.length
            ? A.slice(prefixCommon.length, -suffixCommon.length)
            : A.slice(prefixCommon.length);
        B = suffixCommon.length
            ? B.slice(prefixCommon.length, -suffixCommon.length)
            : B.slice(prefixCommon.length);
        const swapped = B.length > A.length;
        [A, B] = swapped ? [B, A] : [A, B];
        const M = A.length;
        const N = B.length;
        if (!M && !N && !suffixCommon.length && !prefixCommon.length)
            return [];
        if (!N) {
            return [
                ...prefixCommon.map((c) => ({ type: DiffType.common, value: c })),
                ...A.map((a) => ({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: a,
                })),
                ...suffixCommon.map((c) => ({ type: DiffType.common, value: c })),
            ];
        }
        const offset = N;
        const delta = M - N;
        const size = M + N + 1;
        const fp = new Array(size).fill({ y: -1 });
        const routes = new Uint32Array((M * N + size + 1) * 2);
        const diffTypesPtrOffset = routes.length / 2;
        let ptr = 0;
        let p = -1;
        function backTrace(A, B, current, swapped) {
            const M = A.length;
            const N = B.length;
            const result = [];
            let a = M - 1;
            let b = N - 1;
            let j = routes[current.id];
            let type = routes[current.id + diffTypesPtrOffset];
            while (true) {
                if (!j && !type)
                    break;
                const prev = j;
                if (type === REMOVED) {
                    result.unshift({
                        type: swapped ? DiffType.removed : DiffType.added,
                        value: B[b],
                    });
                    b -= 1;
                }
                else if (type === ADDED) {
                    result.unshift({
                        type: swapped ? DiffType.added : DiffType.removed,
                        value: A[a],
                    });
                    a -= 1;
                }
                else {
                    result.unshift({ type: DiffType.common, value: A[a] });
                    a -= 1;
                    b -= 1;
                }
                j = routes[prev];
                type = routes[prev + diffTypesPtrOffset];
            }
            return result;
        }
        function createFP(slide, down, k, M) {
            if (slide && slide.y === -1 && down && down.y === -1) {
                return { y: 0, id: 0 };
            }
            if ((down && down.y === -1) ||
                k === M ||
                (slide && slide.y) > (down && down.y) + 1) {
                const prev = slide.id;
                ptr++;
                routes[ptr] = prev;
                routes[ptr + diffTypesPtrOffset] = ADDED;
                return { y: slide.y, id: ptr };
            }
            else {
                const prev = down.id;
                ptr++;
                routes[ptr] = prev;
                routes[ptr + diffTypesPtrOffset] = REMOVED;
                return { y: down.y + 1, id: ptr };
            }
        }
        function snake(k, slide, down, _offset, A, B) {
            const M = A.length;
            const N = B.length;
            if (k < -N || M < k)
                return { y: -1, id: -1 };
            const fp = createFP(slide, down, k, M);
            while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
                const prev = fp.id;
                ptr++;
                fp.id = ptr;
                fp.y += 1;
                routes[ptr] = prev;
                routes[ptr + diffTypesPtrOffset] = COMMON;
            }
            return fp;
        }
        while (fp[delta + offset].y < N) {
            p = p + 1;
            for (let k = -p; k < delta; ++k) {
                fp[k + offset] = snake(k, fp[k - 1 + offset], fp[k + 1 + offset], offset, A, B);
            }
            for (let k = delta + p; k > delta; --k) {
                fp[k + offset] = snake(k, fp[k - 1 + offset], fp[k + 1 + offset], offset, A, B);
            }
            fp[delta + offset] = snake(delta, fp[delta - 1 + offset], fp[delta + 1 + offset], offset, A, B);
        }
        return [
            ...prefixCommon.map((c) => ({ type: DiffType.common, value: c })),
            ...backTrace(A, B, fp[delta + offset], swapped),
            ...suffixCommon.map((c) => ({ type: DiffType.common, value: c })),
        ];
    }
    exports_28("default", diff);
    return {
        setters: [],
        execute: function () {
            (function (DiffType) {
                DiffType["removed"] = "removed";
                DiffType["common"] = "common";
                DiffType["added"] = "added";
            })(DiffType || (DiffType = {}));
            exports_28("DiffType", DiffType);
            REMOVED = 1;
            COMMON = 2;
            ADDED = 3;
        }
    };
});
System.register("https://deno.land/std@0.61.0/testing/asserts", ["https://deno.land/std@0.61.0/fmt/colors", "https://deno.land/std@0.61.0/testing/diff"], function (exports_29, context_29) {
    "use strict";
    var colors_ts_1, diff_ts_1, CAN_NOT_DISPLAY, AssertionError;
    var __moduleName = context_29 && context_29.id;
    function _format(v) {
        let string = globalThis.Deno
            ? Deno.inspect(v, {
                depth: Infinity,
                sorted: true,
                trailingComma: true,
                compact: false,
                iterableLimit: Infinity,
            })
            : String(v);
        if (typeof v == "string") {
            string = `"${string.replace(/(?=["\\])/g, "\\")}"`;
        }
        return string;
    }
    exports_29("_format", _format);
    function createColor(diffType) {
        switch (diffType) {
            case diff_ts_1.DiffType.added:
                return (s) => colors_ts_1.green(colors_ts_1.bold(s));
            case diff_ts_1.DiffType.removed:
                return (s) => colors_ts_1.red(colors_ts_1.bold(s));
            default:
                return colors_ts_1.white;
        }
    }
    function createSign(diffType) {
        switch (diffType) {
            case diff_ts_1.DiffType.added:
                return "+   ";
            case diff_ts_1.DiffType.removed:
                return "-   ";
            default:
                return "    ";
        }
    }
    function buildMessage(diffResult) {
        const messages = [];
        messages.push("");
        messages.push("");
        messages.push(`    ${colors_ts_1.gray(colors_ts_1.bold("[Diff]"))} ${colors_ts_1.red(colors_ts_1.bold("Actual"))} / ${colors_ts_1.green(colors_ts_1.bold("Expected"))}`);
        messages.push("");
        messages.push("");
        diffResult.forEach((result) => {
            const c = createColor(result.type);
            messages.push(c(`${createSign(result.type)}${result.value}`));
        });
        messages.push("");
        return messages;
    }
    function isKeyedCollection(x) {
        return [Symbol.iterator, "size"].every((k) => k in x);
    }
    function equal(c, d) {
        const seen = new Map();
        return (function compare(a, b) {
            if (a &&
                b &&
                ((a instanceof RegExp && b instanceof RegExp) ||
                    (a instanceof URL && b instanceof URL))) {
                return String(a) === String(b);
            }
            if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime();
            }
            if (Object.is(a, b)) {
                return true;
            }
            if (a && typeof a === "object" && b && typeof b === "object") {
                if (seen.get(a) === b) {
                    return true;
                }
                if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
                    return false;
                }
                if (isKeyedCollection(a) && isKeyedCollection(b)) {
                    if (a.size !== b.size) {
                        return false;
                    }
                    let unmatchedEntries = a.size;
                    for (const [aKey, aValue] of a.entries()) {
                        for (const [bKey, bValue] of b.entries()) {
                            if ((aKey === aValue && bKey === bValue && compare(aKey, bKey)) ||
                                (compare(aKey, bKey) && compare(aValue, bValue))) {
                                unmatchedEntries--;
                            }
                        }
                    }
                    return unmatchedEntries === 0;
                }
                const merged = { ...a, ...b };
                for (const key in merged) {
                    if (!compare(a && a[key], b && b[key])) {
                        return false;
                    }
                }
                seen.set(a, b);
                return true;
            }
            return false;
        })(c, d);
    }
    exports_29("equal", equal);
    function assert(expr, msg = "") {
        if (!expr) {
            throw new AssertionError(msg);
        }
    }
    exports_29("assert", assert);
    function assertEquals(actual, expected, msg) {
        if (equal(actual, expected)) {
            return;
        }
        let message = "";
        const actualString = _format(actual);
        const expectedString = _format(expected);
        try {
            const diffResult = diff_ts_1.default(actualString.split("\n"), expectedString.split("\n"));
            const diffMsg = buildMessage(diffResult).join("\n");
            message = `Values are not equal:\n${diffMsg}`;
        }
        catch (e) {
            message = `\n${colors_ts_1.red(CAN_NOT_DISPLAY)} + \n\n`;
        }
        if (msg) {
            message = msg;
        }
        throw new AssertionError(message);
    }
    exports_29("assertEquals", assertEquals);
    function assertNotEquals(actual, expected, msg) {
        if (!equal(actual, expected)) {
            return;
        }
        let actualString;
        let expectedString;
        try {
            actualString = String(actual);
        }
        catch (e) {
            actualString = "[Cannot display]";
        }
        try {
            expectedString = String(expected);
        }
        catch (e) {
            expectedString = "[Cannot display]";
        }
        if (!msg) {
            msg = `actual: ${actualString} expected: ${expectedString}`;
        }
        throw new AssertionError(msg);
    }
    exports_29("assertNotEquals", assertNotEquals);
    function assertStrictEquals(actual, expected, msg) {
        if (actual === expected) {
            return;
        }
        let message;
        if (msg) {
            message = msg;
        }
        else {
            const actualString = _format(actual);
            const expectedString = _format(expected);
            if (actualString === expectedString) {
                const withOffset = actualString
                    .split("\n")
                    .map((l) => `    ${l}`)
                    .join("\n");
                message = `Values have the same structure but are not reference-equal:\n\n${colors_ts_1.red(withOffset)}\n`;
            }
            else {
                try {
                    const diffResult = diff_ts_1.default(actualString.split("\n"), expectedString.split("\n"));
                    const diffMsg = buildMessage(diffResult).join("\n");
                    message = `Values are not strictly equal:\n${diffMsg}`;
                }
                catch (e) {
                    message = `\n${colors_ts_1.red(CAN_NOT_DISPLAY)} + \n\n`;
                }
            }
        }
        throw new AssertionError(message);
    }
    exports_29("assertStrictEquals", assertStrictEquals);
    function assertStringContains(actual, expected, msg) {
        if (!actual.includes(expected)) {
            if (!msg) {
                msg = `actual: "${actual}" expected to contain: "${expected}"`;
            }
            throw new AssertionError(msg);
        }
    }
    exports_29("assertStringContains", assertStringContains);
    function assertArrayContains(actual, expected, msg) {
        const missing = [];
        for (let i = 0; i < expected.length; i++) {
            let found = false;
            for (let j = 0; j < actual.length; j++) {
                if (equal(expected[i], actual[j])) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                missing.push(expected[i]);
            }
        }
        if (missing.length === 0) {
            return;
        }
        if (!msg) {
            msg = `actual: "${_format(actual)}" expected to contain: "${_format(expected)}"\nmissing: ${_format(missing)}`;
        }
        throw new AssertionError(msg);
    }
    exports_29("assertArrayContains", assertArrayContains);
    function assertMatch(actual, expected, msg) {
        if (!expected.test(actual)) {
            if (!msg) {
                msg = `actual: "${actual}" expected to match: "${expected}"`;
            }
            throw new AssertionError(msg);
        }
    }
    exports_29("assertMatch", assertMatch);
    function fail(msg) {
        assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
    }
    exports_29("fail", fail);
    function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
        let doesThrow = false;
        let error = null;
        try {
            fn();
        }
        catch (e) {
            if (e instanceof Error === false) {
                throw new AssertionError("A non-Error object was thrown.");
            }
            if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
                msg = `Expected error to be instance of "${ErrorClass.name}", but was "${e.constructor.name}"${msg ? `: ${msg}` : "."}`;
                throw new AssertionError(msg);
            }
            if (msgIncludes &&
                !colors_ts_1.stripColor(e.message).includes(colors_ts_1.stripColor(msgIncludes))) {
                msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
                throw new AssertionError(msg);
            }
            doesThrow = true;
            error = e;
        }
        if (!doesThrow) {
            msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        return error;
    }
    exports_29("assertThrows", assertThrows);
    async function assertThrowsAsync(fn, ErrorClass, msgIncludes = "", msg) {
        let doesThrow = false;
        let error = null;
        try {
            await fn();
        }
        catch (e) {
            if (e instanceof Error === false) {
                throw new AssertionError("A non-Error object was thrown or rejected.");
            }
            if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
                msg = `Expected error to be instance of "${ErrorClass.name}", but got "${e.name}"${msg ? `: ${msg}` : "."}`;
                throw new AssertionError(msg);
            }
            if (msgIncludes &&
                !colors_ts_1.stripColor(e.message).includes(colors_ts_1.stripColor(msgIncludes))) {
                msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
                throw new AssertionError(msg);
            }
            doesThrow = true;
            error = e;
        }
        if (!doesThrow) {
            msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        return error;
    }
    exports_29("assertThrowsAsync", assertThrowsAsync);
    function unimplemented(msg) {
        throw new AssertionError(msg || "unimplemented");
    }
    exports_29("unimplemented", unimplemented);
    function unreachable() {
        throw new AssertionError("unreachable");
    }
    exports_29("unreachable", unreachable);
    return {
        setters: [
            function (colors_ts_1_1) {
                colors_ts_1 = colors_ts_1_1;
            },
            function (diff_ts_1_1) {
                diff_ts_1 = diff_ts_1_1;
            }
        ],
        execute: function () {
            CAN_NOT_DISPLAY = "[Cannot display]";
            AssertionError = class AssertionError extends Error {
                constructor(message) {
                    super(message);
                    this.name = "AssertionError";
                }
            };
            exports_29("AssertionError", AssertionError);
        }
    };
});
System.register("https://deno.land/std@0.61.0/_util/has_own_property", [], function (exports_30, context_30) {
    "use strict";
    var __moduleName = context_30 && context_30.id;
    function hasOwnProperty(obj, v) {
        if (obj == null) {
            return false;
        }
        return Object.prototype.hasOwnProperty.call(obj, v);
    }
    exports_30("hasOwnProperty", hasOwnProperty);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.61.0/io/ioutil", ["https://deno.land/std@0.61.0/_util/assert"], function (exports_31, context_31) {
    "use strict";
    var assert_ts_6, DEFAULT_BUFFER_SIZE, MAX_SAFE_INTEGER;
    var __moduleName = context_31 && context_31.id;
    async function copyN(r, dest, size) {
        let bytesRead = 0;
        let buf = new Uint8Array(DEFAULT_BUFFER_SIZE);
        while (bytesRead < size) {
            if (size - bytesRead < DEFAULT_BUFFER_SIZE) {
                buf = new Uint8Array(size - bytesRead);
            }
            const result = await r.read(buf);
            const nread = result ?? 0;
            bytesRead += nread;
            if (nread > 0) {
                let n = 0;
                while (n < nread) {
                    n += await dest.write(buf.slice(n, nread));
                }
                assert_ts_6.assert(n === nread, "could not write");
            }
            if (result === null) {
                break;
            }
        }
        return bytesRead;
    }
    exports_31("copyN", copyN);
    async function readShort(buf) {
        const high = await buf.readByte();
        if (high === null)
            return null;
        const low = await buf.readByte();
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        return (high << 8) | low;
    }
    exports_31("readShort", readShort);
    async function readInt(buf) {
        const high = await readShort(buf);
        if (high === null)
            return null;
        const low = await readShort(buf);
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        return (high << 16) | low;
    }
    exports_31("readInt", readInt);
    async function readLong(buf) {
        const high = await readInt(buf);
        if (high === null)
            return null;
        const low = await readInt(buf);
        if (low === null)
            throw new Deno.errors.UnexpectedEof();
        const big = (BigInt(high) << 32n) | BigInt(low);
        if (big > MAX_SAFE_INTEGER) {
            throw new RangeError("Long value too big to be represented as a JavaScript number.");
        }
        return Number(big);
    }
    exports_31("readLong", readLong);
    function sliceLongToBytes(d, dest = new Array(8)) {
        let big = BigInt(d);
        for (let i = 0; i < 8; i++) {
            dest[7 - i] = Number(big & 0xffn);
            big >>= 8n;
        }
        return dest;
    }
    exports_31("sliceLongToBytes", sliceLongToBytes);
    return {
        setters: [
            function (assert_ts_6_1) {
                assert_ts_6 = assert_ts_6_1;
            }
        ],
        execute: function () {
            DEFAULT_BUFFER_SIZE = 32 * 1024;
            MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
        }
    };
});
System.register("https://deno.land/std@0.61.0/ws/mod", ["https://deno.land/std@0.61.0/encoding/utf8", "https://deno.land/std@0.61.0/_util/has_own_property", "https://deno.land/std@0.61.0/io/bufio", "https://deno.land/std@0.61.0/io/ioutil", "https://deno.land/std@0.61.0/hash/sha1", "https://deno.land/std@0.61.0/http/_io", "https://deno.land/std@0.61.0/textproto/mod", "https://deno.land/std@0.61.0/async/deferred", "https://deno.land/std@0.61.0/_util/assert", "https://deno.land/std@0.61.0/bytes/mod"], function (exports_32, context_32) {
    "use strict";
    var utf8_ts_4, has_own_property_ts_1, bufio_ts_3, ioutil_ts_1, sha1_ts_1, _io_ts_2, mod_ts_6, deferred_ts_3, assert_ts_7, mod_ts_7, OpCode, WebSocketImpl, kGUID, kSecChars;
    var __moduleName = context_32 && context_32.id;
    function isWebSocketCloseEvent(a) {
        return has_own_property_ts_1.hasOwnProperty(a, "code");
    }
    exports_32("isWebSocketCloseEvent", isWebSocketCloseEvent);
    function isWebSocketPingEvent(a) {
        return Array.isArray(a) && a[0] === "ping" && a[1] instanceof Uint8Array;
    }
    exports_32("isWebSocketPingEvent", isWebSocketPingEvent);
    function isWebSocketPongEvent(a) {
        return Array.isArray(a) && a[0] === "pong" && a[1] instanceof Uint8Array;
    }
    exports_32("isWebSocketPongEvent", isWebSocketPongEvent);
    function unmask(payload, mask) {
        if (mask) {
            for (let i = 0, len = payload.length; i < len; i++) {
                payload[i] ^= mask[i & 3];
            }
        }
    }
    exports_32("unmask", unmask);
    async function writeFrame(frame, writer) {
        const payloadLength = frame.payload.byteLength;
        let header;
        const hasMask = frame.mask ? 0x80 : 0;
        if (frame.mask && frame.mask.byteLength !== 4) {
            throw new Error("invalid mask. mask must be 4 bytes: length=" + frame.mask.byteLength);
        }
        if (payloadLength < 126) {
            header = new Uint8Array([0x80 | frame.opcode, hasMask | payloadLength]);
        }
        else if (payloadLength < 0xffff) {
            header = new Uint8Array([
                0x80 | frame.opcode,
                hasMask | 0b01111110,
                payloadLength >>> 8,
                payloadLength & 0x00ff,
            ]);
        }
        else {
            header = new Uint8Array([
                0x80 | frame.opcode,
                hasMask | 0b01111111,
                ...ioutil_ts_1.sliceLongToBytes(payloadLength),
            ]);
        }
        if (frame.mask) {
            header = mod_ts_7.concat(header, frame.mask);
        }
        unmask(frame.payload, frame.mask);
        header = mod_ts_7.concat(header, frame.payload);
        const w = bufio_ts_3.BufWriter.create(writer);
        await w.write(header);
        await w.flush();
    }
    exports_32("writeFrame", writeFrame);
    async function readFrame(buf) {
        let b = await buf.readByte();
        assert_ts_7.assert(b !== null);
        let isLastFrame = false;
        switch (b >>> 4) {
            case 0b1000:
                isLastFrame = true;
                break;
            case 0b0000:
                isLastFrame = false;
                break;
            default:
                throw new Error("invalid signature");
        }
        const opcode = b & 0x0f;
        b = await buf.readByte();
        assert_ts_7.assert(b !== null);
        const hasMask = b >>> 7;
        let payloadLength = b & 0b01111111;
        if (payloadLength === 126) {
            const l = await ioutil_ts_1.readShort(buf);
            assert_ts_7.assert(l !== null);
            payloadLength = l;
        }
        else if (payloadLength === 127) {
            const l = await ioutil_ts_1.readLong(buf);
            assert_ts_7.assert(l !== null);
            payloadLength = Number(l);
        }
        let mask;
        if (hasMask) {
            mask = new Uint8Array(4);
            assert_ts_7.assert((await buf.readFull(mask)) !== null);
        }
        const payload = new Uint8Array(payloadLength);
        assert_ts_7.assert((await buf.readFull(payload)) !== null);
        return {
            isLastFrame,
            opcode,
            mask,
            payload,
        };
    }
    exports_32("readFrame", readFrame);
    function createMask() {
        return crypto.getRandomValues(new Uint8Array(4));
    }
    function acceptable(req) {
        const upgrade = req.headers.get("upgrade");
        if (!upgrade || upgrade.toLowerCase() !== "websocket") {
            return false;
        }
        const secKey = req.headers.get("sec-websocket-key");
        return (req.headers.has("sec-websocket-key") &&
            typeof secKey === "string" &&
            secKey.length > 0);
    }
    exports_32("acceptable", acceptable);
    function createSecAccept(nonce) {
        const sha1 = new sha1_ts_1.Sha1();
        sha1.update(nonce + kGUID);
        const bytes = sha1.digest();
        return btoa(String.fromCharCode(...bytes));
    }
    exports_32("createSecAccept", createSecAccept);
    async function acceptWebSocket(req) {
        const { conn, headers, bufReader, bufWriter } = req;
        if (acceptable(req)) {
            const sock = new WebSocketImpl({ conn, bufReader, bufWriter });
            const secKey = headers.get("sec-websocket-key");
            if (typeof secKey !== "string") {
                throw new Error("sec-websocket-key is not provided");
            }
            const secAccept = createSecAccept(secKey);
            await _io_ts_2.writeResponse(bufWriter, {
                status: 101,
                headers: new Headers({
                    Upgrade: "websocket",
                    Connection: "Upgrade",
                    "Sec-WebSocket-Accept": secAccept,
                }),
            });
            return sock;
        }
        throw new Error("request is not acceptable");
    }
    exports_32("acceptWebSocket", acceptWebSocket);
    function createSecKey() {
        let key = "";
        for (let i = 0; i < 16; i++) {
            const j = Math.floor(Math.random() * kSecChars.length);
            key += kSecChars[j];
        }
        return btoa(key);
    }
    exports_32("createSecKey", createSecKey);
    async function handshake(url, headers, bufReader, bufWriter) {
        const { hostname, pathname, search } = url;
        const key = createSecKey();
        if (!headers.has("host")) {
            headers.set("host", hostname);
        }
        headers.set("upgrade", "websocket");
        headers.set("connection", "upgrade");
        headers.set("sec-websocket-key", key);
        headers.set("sec-websocket-version", "13");
        let headerStr = `GET ${pathname}${search} HTTP/1.1\r\n`;
        for (const [key, value] of headers) {
            headerStr += `${key}: ${value}\r\n`;
        }
        headerStr += "\r\n";
        await bufWriter.write(utf8_ts_4.encode(headerStr));
        await bufWriter.flush();
        const tpReader = new mod_ts_6.TextProtoReader(bufReader);
        const statusLine = await tpReader.readLine();
        if (statusLine === null) {
            throw new Deno.errors.UnexpectedEof();
        }
        const m = statusLine.match(/^(?<version>\S+) (?<statusCode>\S+) /);
        if (!m) {
            throw new Error("ws: invalid status line: " + statusLine);
        }
        assert_ts_7.assert(m.groups);
        const { version, statusCode } = m.groups;
        if (version !== "HTTP/1.1" || statusCode !== "101") {
            throw new Error(`ws: server didn't accept handshake: ` +
                `version=${version}, statusCode=${statusCode}`);
        }
        const responseHeaders = await tpReader.readMIMEHeader();
        if (responseHeaders === null) {
            throw new Deno.errors.UnexpectedEof();
        }
        const expectedSecAccept = createSecAccept(key);
        const secAccept = responseHeaders.get("sec-websocket-accept");
        if (secAccept !== expectedSecAccept) {
            throw new Error(`ws: unexpected sec-websocket-accept header: ` +
                `expected=${expectedSecAccept}, actual=${secAccept}`);
        }
    }
    exports_32("handshake", handshake);
    async function connectWebSocket(endpoint, headers = new Headers()) {
        const url = new URL(endpoint);
        const { hostname } = url;
        let conn;
        if (url.protocol === "http:" || url.protocol === "ws:") {
            const port = parseInt(url.port || "80");
            conn = await Deno.connect({ hostname, port });
        }
        else if (url.protocol === "https:" || url.protocol === "wss:") {
            const port = parseInt(url.port || "443");
            conn = await Deno.connectTls({ hostname, port });
        }
        else {
            throw new Error("ws: unsupported protocol: " + url.protocol);
        }
        const bufWriter = new bufio_ts_3.BufWriter(conn);
        const bufReader = new bufio_ts_3.BufReader(conn);
        try {
            await handshake(url, headers, bufReader, bufWriter);
        }
        catch (err) {
            conn.close();
            throw err;
        }
        return new WebSocketImpl({
            conn,
            bufWriter,
            bufReader,
            mask: createMask(),
        });
    }
    exports_32("connectWebSocket", connectWebSocket);
    function createWebSocket(params) {
        return new WebSocketImpl(params);
    }
    exports_32("createWebSocket", createWebSocket);
    return {
        setters: [
            function (utf8_ts_4_1) {
                utf8_ts_4 = utf8_ts_4_1;
            },
            function (has_own_property_ts_1_1) {
                has_own_property_ts_1 = has_own_property_ts_1_1;
            },
            function (bufio_ts_3_1) {
                bufio_ts_3 = bufio_ts_3_1;
            },
            function (ioutil_ts_1_1) {
                ioutil_ts_1 = ioutil_ts_1_1;
            },
            function (sha1_ts_1_1) {
                sha1_ts_1 = sha1_ts_1_1;
            },
            function (_io_ts_2_1) {
                _io_ts_2 = _io_ts_2_1;
            },
            function (mod_ts_6_1) {
                mod_ts_6 = mod_ts_6_1;
            },
            function (deferred_ts_3_1) {
                deferred_ts_3 = deferred_ts_3_1;
            },
            function (assert_ts_7_1) {
                assert_ts_7 = assert_ts_7_1;
            },
            function (mod_ts_7_1) {
                mod_ts_7 = mod_ts_7_1;
            }
        ],
        execute: function () {
            (function (OpCode) {
                OpCode[OpCode["Continue"] = 0] = "Continue";
                OpCode[OpCode["TextFrame"] = 1] = "TextFrame";
                OpCode[OpCode["BinaryFrame"] = 2] = "BinaryFrame";
                OpCode[OpCode["Close"] = 8] = "Close";
                OpCode[OpCode["Ping"] = 9] = "Ping";
                OpCode[OpCode["Pong"] = 10] = "Pong";
            })(OpCode || (OpCode = {}));
            exports_32("OpCode", OpCode);
            WebSocketImpl = class WebSocketImpl {
                constructor({ conn, bufReader, bufWriter, mask, }) {
                    this.sendQueue = [];
                    this._isClosed = false;
                    this.conn = conn;
                    this.mask = mask;
                    this.bufReader = bufReader || new bufio_ts_3.BufReader(conn);
                    this.bufWriter = bufWriter || new bufio_ts_3.BufWriter(conn);
                }
                async *[Symbol.asyncIterator]() {
                    let frames = [];
                    let payloadsLength = 0;
                    while (!this._isClosed) {
                        let frame;
                        try {
                            frame = await readFrame(this.bufReader);
                        }
                        catch (e) {
                            this.ensureSocketClosed();
                            break;
                        }
                        unmask(frame.payload, frame.mask);
                        switch (frame.opcode) {
                            case OpCode.TextFrame:
                            case OpCode.BinaryFrame:
                            case OpCode.Continue:
                                frames.push(frame);
                                payloadsLength += frame.payload.length;
                                if (frame.isLastFrame) {
                                    const concat = new Uint8Array(payloadsLength);
                                    let offs = 0;
                                    for (const frame of frames) {
                                        concat.set(frame.payload, offs);
                                        offs += frame.payload.length;
                                    }
                                    if (frames[0].opcode === OpCode.TextFrame) {
                                        yield utf8_ts_4.decode(concat);
                                    }
                                    else {
                                        yield concat;
                                    }
                                    frames = [];
                                    payloadsLength = 0;
                                }
                                break;
                            case OpCode.Close: {
                                const code = (frame.payload[0] << 8) | frame.payload[1];
                                const reason = utf8_ts_4.decode(frame.payload.subarray(2, frame.payload.length));
                                await this.close(code, reason);
                                yield { code, reason };
                                return;
                            }
                            case OpCode.Ping:
                                await this.enqueue({
                                    opcode: OpCode.Pong,
                                    payload: frame.payload,
                                    isLastFrame: true,
                                });
                                yield ["ping", frame.payload];
                                break;
                            case OpCode.Pong:
                                yield ["pong", frame.payload];
                                break;
                            default:
                        }
                    }
                }
                dequeue() {
                    const [entry] = this.sendQueue;
                    if (!entry)
                        return;
                    if (this._isClosed)
                        return;
                    const { d, frame } = entry;
                    writeFrame(frame, this.bufWriter)
                        .then(() => d.resolve())
                        .catch((e) => d.reject(e))
                        .finally(() => {
                        this.sendQueue.shift();
                        this.dequeue();
                    });
                }
                enqueue(frame) {
                    if (this._isClosed) {
                        throw new Deno.errors.ConnectionReset("Socket has already been closed");
                    }
                    const d = deferred_ts_3.deferred();
                    this.sendQueue.push({ d, frame });
                    if (this.sendQueue.length === 1) {
                        this.dequeue();
                    }
                    return d;
                }
                send(data) {
                    const opcode = typeof data === "string" ? OpCode.TextFrame : OpCode.BinaryFrame;
                    const payload = typeof data === "string" ? utf8_ts_4.encode(data) : data;
                    const isLastFrame = true;
                    const frame = {
                        isLastFrame,
                        opcode,
                        payload,
                        mask: this.mask,
                    };
                    return this.enqueue(frame);
                }
                ping(data = "") {
                    const payload = typeof data === "string" ? utf8_ts_4.encode(data) : data;
                    const frame = {
                        isLastFrame: true,
                        opcode: OpCode.Ping,
                        mask: this.mask,
                        payload,
                    };
                    return this.enqueue(frame);
                }
                get isClosed() {
                    return this._isClosed;
                }
                async close(code = 1000, reason) {
                    try {
                        const header = [code >>> 8, code & 0x00ff];
                        let payload;
                        if (reason) {
                            const reasonBytes = utf8_ts_4.encode(reason);
                            payload = new Uint8Array(2 + reasonBytes.byteLength);
                            payload.set(header);
                            payload.set(reasonBytes, 2);
                        }
                        else {
                            payload = new Uint8Array(header);
                        }
                        await this.enqueue({
                            isLastFrame: true,
                            opcode: OpCode.Close,
                            mask: this.mask,
                            payload,
                        });
                    }
                    catch (e) {
                        throw e;
                    }
                    finally {
                        this.ensureSocketClosed();
                    }
                }
                closeForce() {
                    this.ensureSocketClosed();
                }
                ensureSocketClosed() {
                    if (this.isClosed)
                        return;
                    try {
                        this.conn.close();
                    }
                    catch (e) {
                        console.error(e);
                    }
                    finally {
                        this._isClosed = true;
                        const rest = this.sendQueue;
                        this.sendQueue = [];
                        rest.forEach((e) => e.d.reject(new Deno.errors.ConnectionReset("Socket has already been closed")));
                    }
                }
            };
            kGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            kSecChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-.~_";
        }
    };
});
System.register("https://deno.land/x/media_types@v2.4.2/db", [], function (exports_33, context_33) {
    "use strict";
    var db;
    var __moduleName = context_33 && context_33.id;
    return {
        setters: [],
        execute: function () {
            exports_33("db", db = {
                "application/1d-interleaved-parityfec": {
                    source: "iana",
                },
                "application/3gpdash-qoe-report+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/3gpp-ims+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/a2l": {
                    source: "iana",
                },
                "application/activemessage": {
                    source: "iana",
                },
                "application/activity+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-costmap+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-costmapfilter+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-directory+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-endpointcost+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-endpointcostparams+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-endpointprop+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-endpointpropparams+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-error+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-networkmap+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-networkmapfilter+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-updatestreamcontrol+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/alto-updatestreamparams+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/aml": {
                    source: "iana",
                },
                "application/andrew-inset": {
                    source: "iana",
                    extensions: ["ez"],
                },
                "application/applefile": {
                    source: "iana",
                },
                "application/applixware": {
                    source: "apache",
                    extensions: ["aw"],
                },
                "application/atf": {
                    source: "iana",
                },
                "application/atfx": {
                    source: "iana",
                },
                "application/atom+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["atom"],
                },
                "application/atomcat+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["atomcat"],
                },
                "application/atomdeleted+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["atomdeleted"],
                },
                "application/atomicmail": {
                    source: "iana",
                },
                "application/atomsvc+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["atomsvc"],
                },
                "application/atsc-dwd+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["dwd"],
                },
                "application/atsc-dynamic-event-message": {
                    source: "iana",
                },
                "application/atsc-held+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["held"],
                },
                "application/atsc-rdt+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/atsc-rsat+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rsat"],
                },
                "application/atxml": {
                    source: "iana",
                },
                "application/auth-policy+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/bacnet-xdd+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/batch-smtp": {
                    source: "iana",
                },
                "application/bdoc": {
                    compressible: false,
                    extensions: ["bdoc"],
                },
                "application/beep+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/calendar+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/calendar+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xcs"],
                },
                "application/call-completion": {
                    source: "iana",
                },
                "application/cals-1840": {
                    source: "iana",
                },
                "application/cap+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/cbor": {
                    source: "iana",
                },
                "application/cbor-seq": {
                    source: "iana",
                },
                "application/cccex": {
                    source: "iana",
                },
                "application/ccmp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/ccxml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ccxml"],
                },
                "application/cdfx+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["cdfx"],
                },
                "application/cdmi-capability": {
                    source: "iana",
                    extensions: ["cdmia"],
                },
                "application/cdmi-container": {
                    source: "iana",
                    extensions: ["cdmic"],
                },
                "application/cdmi-domain": {
                    source: "iana",
                    extensions: ["cdmid"],
                },
                "application/cdmi-object": {
                    source: "iana",
                    extensions: ["cdmio"],
                },
                "application/cdmi-queue": {
                    source: "iana",
                    extensions: ["cdmiq"],
                },
                "application/cdni": {
                    source: "iana",
                },
                "application/cea": {
                    source: "iana",
                },
                "application/cea-2018+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/cellml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/cfw": {
                    source: "iana",
                },
                "application/clue+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/clue_info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/cms": {
                    source: "iana",
                },
                "application/cnrp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/coap-group+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/coap-payload": {
                    source: "iana",
                },
                "application/commonground": {
                    source: "iana",
                },
                "application/conference-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/cose": {
                    source: "iana",
                },
                "application/cose-key": {
                    source: "iana",
                },
                "application/cose-key-set": {
                    source: "iana",
                },
                "application/cpl+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/csrattrs": {
                    source: "iana",
                },
                "application/csta+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/cstadata+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/csvm+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/cu-seeme": {
                    source: "apache",
                    extensions: ["cu"],
                },
                "application/cwt": {
                    source: "iana",
                },
                "application/cybercash": {
                    source: "iana",
                },
                "application/dart": {
                    compressible: true,
                },
                "application/dash+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mpd"],
                },
                "application/dashdelta": {
                    source: "iana",
                },
                "application/davmount+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["davmount"],
                },
                "application/dca-rft": {
                    source: "iana",
                },
                "application/dcd": {
                    source: "iana",
                },
                "application/dec-dx": {
                    source: "iana",
                },
                "application/dialog-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/dicom": {
                    source: "iana",
                },
                "application/dicom+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/dicom+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/dii": {
                    source: "iana",
                },
                "application/dit": {
                    source: "iana",
                },
                "application/dns": {
                    source: "iana",
                },
                "application/dns+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/dns-message": {
                    source: "iana",
                },
                "application/docbook+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["dbk"],
                },
                "application/dots+cbor": {
                    source: "iana",
                },
                "application/dskpp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/dssc+der": {
                    source: "iana",
                    extensions: ["dssc"],
                },
                "application/dssc+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xdssc"],
                },
                "application/dvcs": {
                    source: "iana",
                },
                "application/ecmascript": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ecma", "es"],
                },
                "application/edi-consent": {
                    source: "iana",
                },
                "application/edi-x12": {
                    source: "iana",
                    compressible: false,
                },
                "application/edifact": {
                    source: "iana",
                    compressible: false,
                },
                "application/efi": {
                    source: "iana",
                },
                "application/emergencycalldata.comment+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.control+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.deviceinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.ecall.msd": {
                    source: "iana",
                },
                "application/emergencycalldata.providerinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.serviceinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.subscriberinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emergencycalldata.veds+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/emma+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["emma"],
                },
                "application/emotionml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["emotionml"],
                },
                "application/encaprtp": {
                    source: "iana",
                },
                "application/epp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/epub+zip": {
                    source: "iana",
                    compressible: false,
                    extensions: ["epub"],
                },
                "application/eshop": {
                    source: "iana",
                },
                "application/exi": {
                    source: "iana",
                    extensions: ["exi"],
                },
                "application/expect-ct-report+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/fastinfoset": {
                    source: "iana",
                },
                "application/fastsoap": {
                    source: "iana",
                },
                "application/fdt+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["fdt"],
                },
                "application/fhir+json": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/fhir+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/fido.trusted-apps+json": {
                    compressible: true,
                },
                "application/fits": {
                    source: "iana",
                },
                "application/flexfec": {
                    source: "iana",
                },
                "application/font-sfnt": {
                    source: "iana",
                },
                "application/font-tdpfr": {
                    source: "iana",
                    extensions: ["pfr"],
                },
                "application/font-woff": {
                    source: "iana",
                    compressible: false,
                },
                "application/framework-attributes+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/geo+json": {
                    source: "iana",
                    compressible: true,
                    extensions: ["geojson"],
                },
                "application/geo+json-seq": {
                    source: "iana",
                },
                "application/geopackage+sqlite3": {
                    source: "iana",
                },
                "application/geoxacml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/gltf-buffer": {
                    source: "iana",
                },
                "application/gml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["gml"],
                },
                "application/gpx+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["gpx"],
                },
                "application/gxf": {
                    source: "apache",
                    extensions: ["gxf"],
                },
                "application/gzip": {
                    source: "iana",
                    compressible: false,
                    extensions: ["gz"],
                },
                "application/h224": {
                    source: "iana",
                },
                "application/held+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/hjson": {
                    extensions: ["hjson"],
                },
                "application/http": {
                    source: "iana",
                },
                "application/hyperstudio": {
                    source: "iana",
                    extensions: ["stk"],
                },
                "application/ibe-key-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/ibe-pkg-reply+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/ibe-pp-data": {
                    source: "iana",
                },
                "application/iges": {
                    source: "iana",
                },
                "application/im-iscomposing+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/index": {
                    source: "iana",
                },
                "application/index.cmd": {
                    source: "iana",
                },
                "application/index.obj": {
                    source: "iana",
                },
                "application/index.response": {
                    source: "iana",
                },
                "application/index.vnd": {
                    source: "iana",
                },
                "application/inkml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ink", "inkml"],
                },
                "application/iotp": {
                    source: "iana",
                },
                "application/ipfix": {
                    source: "iana",
                    extensions: ["ipfix"],
                },
                "application/ipp": {
                    source: "iana",
                },
                "application/isup": {
                    source: "iana",
                },
                "application/its+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["its"],
                },
                "application/java-archive": {
                    source: "apache",
                    compressible: false,
                    extensions: ["jar", "war", "ear"],
                },
                "application/java-serialized-object": {
                    source: "apache",
                    compressible: false,
                    extensions: ["ser"],
                },
                "application/java-vm": {
                    source: "apache",
                    compressible: false,
                    extensions: ["class"],
                },
                "application/javascript": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["js", "mjs"],
                },
                "application/jf2feed+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/jose": {
                    source: "iana",
                },
                "application/jose+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/jrd+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/json": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["json", "map"],
                },
                "application/json-patch+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/json-seq": {
                    source: "iana",
                },
                "application/json5": {
                    extensions: ["json5"],
                },
                "application/jsonml+json": {
                    source: "apache",
                    compressible: true,
                    extensions: ["jsonml"],
                },
                "application/jwk+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/jwk-set+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/jwt": {
                    source: "iana",
                },
                "application/kpml-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/kpml-response+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/ld+json": {
                    source: "iana",
                    compressible: true,
                    extensions: ["jsonld"],
                },
                "application/lgr+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["lgr"],
                },
                "application/link-format": {
                    source: "iana",
                },
                "application/load-control+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/lost+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["lostxml"],
                },
                "application/lostsync+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/lpf+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/lxf": {
                    source: "iana",
                },
                "application/mac-binhex40": {
                    source: "iana",
                    extensions: ["hqx"],
                },
                "application/mac-compactpro": {
                    source: "apache",
                    extensions: ["cpt"],
                },
                "application/macwriteii": {
                    source: "iana",
                },
                "application/mads+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mads"],
                },
                "application/manifest+json": {
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["webmanifest"],
                },
                "application/marc": {
                    source: "iana",
                    extensions: ["mrc"],
                },
                "application/marcxml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mrcx"],
                },
                "application/mathematica": {
                    source: "iana",
                    extensions: ["ma", "nb", "mb"],
                },
                "application/mathml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mathml"],
                },
                "application/mathml-content+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mathml-presentation+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-associated-procedure-description+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-deregister+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-envelope+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-msk+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-msk-response+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-protection-description+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-reception-report+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-register+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-register-response+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-schedule+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbms-user-service-description+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mbox": {
                    source: "iana",
                    extensions: ["mbox"],
                },
                "application/media-policy-dataset+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/media_control+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/mediaservercontrol+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mscml"],
                },
                "application/merge-patch+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/metalink+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["metalink"],
                },
                "application/metalink4+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["meta4"],
                },
                "application/mets+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mets"],
                },
                "application/mf4": {
                    source: "iana",
                },
                "application/mikey": {
                    source: "iana",
                },
                "application/mipc": {
                    source: "iana",
                },
                "application/mmt-aei+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["maei"],
                },
                "application/mmt-usd+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["musd"],
                },
                "application/mods+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mods"],
                },
                "application/moss-keys": {
                    source: "iana",
                },
                "application/moss-signature": {
                    source: "iana",
                },
                "application/mosskey-data": {
                    source: "iana",
                },
                "application/mosskey-request": {
                    source: "iana",
                },
                "application/mp21": {
                    source: "iana",
                    extensions: ["m21", "mp21"],
                },
                "application/mp4": {
                    source: "iana",
                    extensions: ["mp4s", "m4p"],
                },
                "application/mpeg4-generic": {
                    source: "iana",
                },
                "application/mpeg4-iod": {
                    source: "iana",
                },
                "application/mpeg4-iod-xmt": {
                    source: "iana",
                },
                "application/mrb-consumer+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xdf"],
                },
                "application/mrb-publish+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xdf"],
                },
                "application/msc-ivr+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/msc-mixer+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/msword": {
                    source: "iana",
                    compressible: false,
                    extensions: ["doc", "dot"],
                },
                "application/mud+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/multipart-core": {
                    source: "iana",
                },
                "application/mxf": {
                    source: "iana",
                    extensions: ["mxf"],
                },
                "application/n-quads": {
                    source: "iana",
                    extensions: ["nq"],
                },
                "application/n-triples": {
                    source: "iana",
                    extensions: ["nt"],
                },
                "application/nasdata": {
                    source: "iana",
                },
                "application/news-checkgroups": {
                    source: "iana",
                    charset: "US-ASCII",
                },
                "application/news-groupinfo": {
                    source: "iana",
                    charset: "US-ASCII",
                },
                "application/news-transmission": {
                    source: "iana",
                },
                "application/nlsml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/node": {
                    source: "iana",
                    extensions: ["cjs"],
                },
                "application/nss": {
                    source: "iana",
                },
                "application/ocsp-request": {
                    source: "iana",
                },
                "application/ocsp-response": {
                    source: "iana",
                },
                "application/octet-stream": {
                    source: "iana",
                    compressible: false,
                    extensions: [
                        "bin",
                        "dms",
                        "lrf",
                        "mar",
                        "so",
                        "dist",
                        "distz",
                        "pkg",
                        "bpk",
                        "dump",
                        "elc",
                        "deploy",
                        "exe",
                        "dll",
                        "deb",
                        "dmg",
                        "iso",
                        "img",
                        "msi",
                        "msp",
                        "msm",
                        "buffer",
                    ],
                },
                "application/oda": {
                    source: "iana",
                    extensions: ["oda"],
                },
                "application/odm+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/odx": {
                    source: "iana",
                },
                "application/oebps-package+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["opf"],
                },
                "application/ogg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["ogx"],
                },
                "application/omdoc+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["omdoc"],
                },
                "application/onenote": {
                    source: "apache",
                    extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"],
                },
                "application/oscore": {
                    source: "iana",
                },
                "application/oxps": {
                    source: "iana",
                    extensions: ["oxps"],
                },
                "application/p2p-overlay+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["relo"],
                },
                "application/parityfec": {
                    source: "iana",
                },
                "application/passport": {
                    source: "iana",
                },
                "application/patch-ops-error+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xer"],
                },
                "application/pdf": {
                    source: "iana",
                    compressible: false,
                    extensions: ["pdf"],
                },
                "application/pdx": {
                    source: "iana",
                },
                "application/pem-certificate-chain": {
                    source: "iana",
                },
                "application/pgp-encrypted": {
                    source: "iana",
                    compressible: false,
                    extensions: ["pgp"],
                },
                "application/pgp-keys": {
                    source: "iana",
                },
                "application/pgp-signature": {
                    source: "iana",
                    extensions: ["asc", "sig"],
                },
                "application/pics-rules": {
                    source: "apache",
                    extensions: ["prf"],
                },
                "application/pidf+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/pidf-diff+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/pkcs10": {
                    source: "iana",
                    extensions: ["p10"],
                },
                "application/pkcs12": {
                    source: "iana",
                },
                "application/pkcs7-mime": {
                    source: "iana",
                    extensions: ["p7m", "p7c"],
                },
                "application/pkcs7-signature": {
                    source: "iana",
                    extensions: ["p7s"],
                },
                "application/pkcs8": {
                    source: "iana",
                    extensions: ["p8"],
                },
                "application/pkcs8-encrypted": {
                    source: "iana",
                },
                "application/pkix-attr-cert": {
                    source: "iana",
                    extensions: ["ac"],
                },
                "application/pkix-cert": {
                    source: "iana",
                    extensions: ["cer"],
                },
                "application/pkix-crl": {
                    source: "iana",
                    extensions: ["crl"],
                },
                "application/pkix-pkipath": {
                    source: "iana",
                    extensions: ["pkipath"],
                },
                "application/pkixcmp": {
                    source: "iana",
                    extensions: ["pki"],
                },
                "application/pls+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["pls"],
                },
                "application/poc-settings+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/postscript": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ai", "eps", "ps"],
                },
                "application/ppsp-tracker+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/problem+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/problem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/provenance+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["provx"],
                },
                "application/prs.alvestrand.titrax-sheet": {
                    source: "iana",
                },
                "application/prs.cww": {
                    source: "iana",
                    extensions: ["cww"],
                },
                "application/prs.hpub+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/prs.nprend": {
                    source: "iana",
                },
                "application/prs.plucker": {
                    source: "iana",
                },
                "application/prs.rdf-xml-crypt": {
                    source: "iana",
                },
                "application/prs.xsf+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/pskc+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["pskcxml"],
                },
                "application/pvd+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/qsig": {
                    source: "iana",
                },
                "application/raml+yaml": {
                    compressible: true,
                    extensions: ["raml"],
                },
                "application/raptorfec": {
                    source: "iana",
                },
                "application/rdap+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/rdf+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rdf", "owl"],
                },
                "application/reginfo+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rif"],
                },
                "application/relax-ng-compact-syntax": {
                    source: "iana",
                    extensions: ["rnc"],
                },
                "application/remote-printing": {
                    source: "iana",
                },
                "application/reputon+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/resource-lists+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rl"],
                },
                "application/resource-lists-diff+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rld"],
                },
                "application/rfc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/riscos": {
                    source: "iana",
                },
                "application/rlmi+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/rls-services+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rs"],
                },
                "application/route-apd+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rapd"],
                },
                "application/route-s-tsid+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["sls"],
                },
                "application/route-usd+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rusd"],
                },
                "application/rpki-ghostbusters": {
                    source: "iana",
                    extensions: ["gbr"],
                },
                "application/rpki-manifest": {
                    source: "iana",
                    extensions: ["mft"],
                },
                "application/rpki-publication": {
                    source: "iana",
                },
                "application/rpki-roa": {
                    source: "iana",
                    extensions: ["roa"],
                },
                "application/rpki-updown": {
                    source: "iana",
                },
                "application/rsd+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["rsd"],
                },
                "application/rss+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["rss"],
                },
                "application/rtf": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rtf"],
                },
                "application/rtploopback": {
                    source: "iana",
                },
                "application/rtx": {
                    source: "iana",
                },
                "application/samlassertion+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/samlmetadata+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/sbe": {
                    source: "iana",
                },
                "application/sbml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["sbml"],
                },
                "application/scaip+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/scim+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/scvp-cv-request": {
                    source: "iana",
                    extensions: ["scq"],
                },
                "application/scvp-cv-response": {
                    source: "iana",
                    extensions: ["scs"],
                },
                "application/scvp-vp-request": {
                    source: "iana",
                    extensions: ["spq"],
                },
                "application/scvp-vp-response": {
                    source: "iana",
                    extensions: ["spp"],
                },
                "application/sdp": {
                    source: "iana",
                    extensions: ["sdp"],
                },
                "application/secevent+jwt": {
                    source: "iana",
                },
                "application/senml+cbor": {
                    source: "iana",
                },
                "application/senml+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/senml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["senmlx"],
                },
                "application/senml-etch+cbor": {
                    source: "iana",
                },
                "application/senml-etch+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/senml-exi": {
                    source: "iana",
                },
                "application/sensml+cbor": {
                    source: "iana",
                },
                "application/sensml+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/sensml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["sensmlx"],
                },
                "application/sensml-exi": {
                    source: "iana",
                },
                "application/sep+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/sep-exi": {
                    source: "iana",
                },
                "application/session-info": {
                    source: "iana",
                },
                "application/set-payment": {
                    source: "iana",
                },
                "application/set-payment-initiation": {
                    source: "iana",
                    extensions: ["setpay"],
                },
                "application/set-registration": {
                    source: "iana",
                },
                "application/set-registration-initiation": {
                    source: "iana",
                    extensions: ["setreg"],
                },
                "application/sgml": {
                    source: "iana",
                },
                "application/sgml-open-catalog": {
                    source: "iana",
                },
                "application/shf+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["shf"],
                },
                "application/sieve": {
                    source: "iana",
                    extensions: ["siv", "sieve"],
                },
                "application/simple-filter+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/simple-message-summary": {
                    source: "iana",
                },
                "application/simplesymbolcontainer": {
                    source: "iana",
                },
                "application/sipc": {
                    source: "iana",
                },
                "application/slate": {
                    source: "iana",
                },
                "application/smil": {
                    source: "iana",
                },
                "application/smil+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["smi", "smil"],
                },
                "application/smpte336m": {
                    source: "iana",
                },
                "application/soap+fastinfoset": {
                    source: "iana",
                },
                "application/soap+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/sparql-query": {
                    source: "iana",
                    extensions: ["rq"],
                },
                "application/sparql-results+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["srx"],
                },
                "application/spirits-event+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/sql": {
                    source: "iana",
                },
                "application/srgs": {
                    source: "iana",
                    extensions: ["gram"],
                },
                "application/srgs+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["grxml"],
                },
                "application/sru+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["sru"],
                },
                "application/ssdl+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["ssdl"],
                },
                "application/ssml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ssml"],
                },
                "application/stix+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/swid+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["swidtag"],
                },
                "application/tamp-apex-update": {
                    source: "iana",
                },
                "application/tamp-apex-update-confirm": {
                    source: "iana",
                },
                "application/tamp-community-update": {
                    source: "iana",
                },
                "application/tamp-community-update-confirm": {
                    source: "iana",
                },
                "application/tamp-error": {
                    source: "iana",
                },
                "application/tamp-sequence-adjust": {
                    source: "iana",
                },
                "application/tamp-sequence-adjust-confirm": {
                    source: "iana",
                },
                "application/tamp-status-query": {
                    source: "iana",
                },
                "application/tamp-status-response": {
                    source: "iana",
                },
                "application/tamp-update": {
                    source: "iana",
                },
                "application/tamp-update-confirm": {
                    source: "iana",
                },
                "application/tar": {
                    compressible: true,
                },
                "application/taxii+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/td+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/tei+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["tei", "teicorpus"],
                },
                "application/tetra_isi": {
                    source: "iana",
                },
                "application/thraud+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["tfi"],
                },
                "application/timestamp-query": {
                    source: "iana",
                },
                "application/timestamp-reply": {
                    source: "iana",
                },
                "application/timestamped-data": {
                    source: "iana",
                    extensions: ["tsd"],
                },
                "application/tlsrpt+gzip": {
                    source: "iana",
                },
                "application/tlsrpt+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/tnauthlist": {
                    source: "iana",
                },
                "application/toml": {
                    compressible: true,
                    extensions: ["toml"],
                },
                "application/trickle-ice-sdpfrag": {
                    source: "iana",
                },
                "application/trig": {
                    source: "iana",
                },
                "application/ttml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ttml"],
                },
                "application/tve-trigger": {
                    source: "iana",
                },
                "application/tzif": {
                    source: "iana",
                },
                "application/tzif-leap": {
                    source: "iana",
                },
                "application/ulpfec": {
                    source: "iana",
                },
                "application/urc-grpsheet+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/urc-ressheet+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rsheet"],
                },
                "application/urc-targetdesc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/urc-uisocketdesc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vcard+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vcard+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vemmi": {
                    source: "iana",
                },
                "application/vividence.scriptfile": {
                    source: "apache",
                },
                "application/vnd.1000minds.decision-model+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["1km"],
                },
                "application/vnd.3gpp-prose+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp-prose-pc3ch+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp-v2x-local-service-information": {
                    source: "iana",
                },
                "application/vnd.3gpp.access-transfer-events+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.bsf+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.gmop+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mc-signalling-ear": {
                    source: "iana",
                },
                "application/vnd.3gpp.mcdata-affiliation-command+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcdata-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcdata-payload": {
                    source: "iana",
                },
                "application/vnd.3gpp.mcdata-service-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcdata-signalling": {
                    source: "iana",
                },
                "application/vnd.3gpp.mcdata-ue-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcdata-user-profile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-affiliation-command+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-floor-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-location-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-service-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-signed+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-ue-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-ue-init-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcptt-user-profile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-location-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-service-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-transmission-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-ue-config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mcvideo-user-profile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.mid-call+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.pic-bw-large": {
                    source: "iana",
                    extensions: ["plb"],
                },
                "application/vnd.3gpp.pic-bw-small": {
                    source: "iana",
                    extensions: ["psb"],
                },
                "application/vnd.3gpp.pic-bw-var": {
                    source: "iana",
                    extensions: ["pvb"],
                },
                "application/vnd.3gpp.sms": {
                    source: "iana",
                },
                "application/vnd.3gpp.sms+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.srvcc-ext+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.srvcc-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.state-and-event-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp.ussd+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp2.bcmcsinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.3gpp2.sms": {
                    source: "iana",
                },
                "application/vnd.3gpp2.tcap": {
                    source: "iana",
                    extensions: ["tcap"],
                },
                "application/vnd.3lightssoftware.imagescal": {
                    source: "iana",
                },
                "application/vnd.3m.post-it-notes": {
                    source: "iana",
                    extensions: ["pwn"],
                },
                "application/vnd.accpac.simply.aso": {
                    source: "iana",
                    extensions: ["aso"],
                },
                "application/vnd.accpac.simply.imp": {
                    source: "iana",
                    extensions: ["imp"],
                },
                "application/vnd.acucobol": {
                    source: "iana",
                    extensions: ["acu"],
                },
                "application/vnd.acucorp": {
                    source: "iana",
                    extensions: ["atc", "acutc"],
                },
                "application/vnd.adobe.air-application-installer-package+zip": {
                    source: "apache",
                    compressible: false,
                    extensions: ["air"],
                },
                "application/vnd.adobe.flash.movie": {
                    source: "iana",
                },
                "application/vnd.adobe.formscentral.fcdt": {
                    source: "iana",
                    extensions: ["fcdt"],
                },
                "application/vnd.adobe.fxp": {
                    source: "iana",
                    extensions: ["fxp", "fxpl"],
                },
                "application/vnd.adobe.partial-upload": {
                    source: "iana",
                },
                "application/vnd.adobe.xdp+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xdp"],
                },
                "application/vnd.adobe.xfdf": {
                    source: "iana",
                    extensions: ["xfdf"],
                },
                "application/vnd.aether.imp": {
                    source: "iana",
                },
                "application/vnd.afpc.afplinedata": {
                    source: "iana",
                },
                "application/vnd.afpc.afplinedata-pagedef": {
                    source: "iana",
                },
                "application/vnd.afpc.foca-charset": {
                    source: "iana",
                },
                "application/vnd.afpc.foca-codedfont": {
                    source: "iana",
                },
                "application/vnd.afpc.foca-codepage": {
                    source: "iana",
                },
                "application/vnd.afpc.modca": {
                    source: "iana",
                },
                "application/vnd.afpc.modca-formdef": {
                    source: "iana",
                },
                "application/vnd.afpc.modca-mediummap": {
                    source: "iana",
                },
                "application/vnd.afpc.modca-objectcontainer": {
                    source: "iana",
                },
                "application/vnd.afpc.modca-overlay": {
                    source: "iana",
                },
                "application/vnd.afpc.modca-pagesegment": {
                    source: "iana",
                },
                "application/vnd.ah-barcode": {
                    source: "iana",
                },
                "application/vnd.ahead.space": {
                    source: "iana",
                    extensions: ["ahead"],
                },
                "application/vnd.airzip.filesecure.azf": {
                    source: "iana",
                    extensions: ["azf"],
                },
                "application/vnd.airzip.filesecure.azs": {
                    source: "iana",
                    extensions: ["azs"],
                },
                "application/vnd.amadeus+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.amazon.ebook": {
                    source: "apache",
                    extensions: ["azw"],
                },
                "application/vnd.amazon.mobi8-ebook": {
                    source: "iana",
                },
                "application/vnd.americandynamics.acc": {
                    source: "iana",
                    extensions: ["acc"],
                },
                "application/vnd.amiga.ami": {
                    source: "iana",
                    extensions: ["ami"],
                },
                "application/vnd.amundsen.maze+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.android.ota": {
                    source: "iana",
                },
                "application/vnd.android.package-archive": {
                    source: "apache",
                    compressible: false,
                    extensions: ["apk"],
                },
                "application/vnd.anki": {
                    source: "iana",
                },
                "application/vnd.anser-web-certificate-issue-initiation": {
                    source: "iana",
                    extensions: ["cii"],
                },
                "application/vnd.anser-web-funds-transfer-initiation": {
                    source: "apache",
                    extensions: ["fti"],
                },
                "application/vnd.antix.game-component": {
                    source: "iana",
                    extensions: ["atx"],
                },
                "application/vnd.apache.thrift.binary": {
                    source: "iana",
                },
                "application/vnd.apache.thrift.compact": {
                    source: "iana",
                },
                "application/vnd.apache.thrift.json": {
                    source: "iana",
                },
                "application/vnd.api+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.aplextor.warrp+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.apothekende.reservation+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.apple.installer+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mpkg"],
                },
                "application/vnd.apple.keynote": {
                    source: "iana",
                    extensions: ["keynote"],
                },
                "application/vnd.apple.mpegurl": {
                    source: "iana",
                    extensions: ["m3u8"],
                },
                "application/vnd.apple.numbers": {
                    source: "iana",
                    extensions: ["numbers"],
                },
                "application/vnd.apple.pages": {
                    source: "iana",
                    extensions: ["pages"],
                },
                "application/vnd.apple.pkpass": {
                    compressible: false,
                    extensions: ["pkpass"],
                },
                "application/vnd.arastra.swi": {
                    source: "iana",
                },
                "application/vnd.aristanetworks.swi": {
                    source: "iana",
                    extensions: ["swi"],
                },
                "application/vnd.artisan+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.artsquare": {
                    source: "iana",
                },
                "application/vnd.astraea-software.iota": {
                    source: "iana",
                    extensions: ["iota"],
                },
                "application/vnd.audiograph": {
                    source: "iana",
                    extensions: ["aep"],
                },
                "application/vnd.autopackage": {
                    source: "iana",
                },
                "application/vnd.avalon+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.avistar+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.balsamiq.bmml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["bmml"],
                },
                "application/vnd.balsamiq.bmpr": {
                    source: "iana",
                },
                "application/vnd.banana-accounting": {
                    source: "iana",
                },
                "application/vnd.bbf.usp.error": {
                    source: "iana",
                },
                "application/vnd.bbf.usp.msg": {
                    source: "iana",
                },
                "application/vnd.bbf.usp.msg+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.bekitzur-stech+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.bint.med-content": {
                    source: "iana",
                },
                "application/vnd.biopax.rdf+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.blink-idb-value-wrapper": {
                    source: "iana",
                },
                "application/vnd.blueice.multipass": {
                    source: "iana",
                    extensions: ["mpm"],
                },
                "application/vnd.bluetooth.ep.oob": {
                    source: "iana",
                },
                "application/vnd.bluetooth.le.oob": {
                    source: "iana",
                },
                "application/vnd.bmi": {
                    source: "iana",
                    extensions: ["bmi"],
                },
                "application/vnd.bpf": {
                    source: "iana",
                },
                "application/vnd.bpf3": {
                    source: "iana",
                },
                "application/vnd.businessobjects": {
                    source: "iana",
                    extensions: ["rep"],
                },
                "application/vnd.byu.uapi+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.cab-jscript": {
                    source: "iana",
                },
                "application/vnd.canon-cpdl": {
                    source: "iana",
                },
                "application/vnd.canon-lips": {
                    source: "iana",
                },
                "application/vnd.capasystems-pg+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.cendio.thinlinc.clientconf": {
                    source: "iana",
                },
                "application/vnd.century-systems.tcp_stream": {
                    source: "iana",
                },
                "application/vnd.chemdraw+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["cdxml"],
                },
                "application/vnd.chess-pgn": {
                    source: "iana",
                },
                "application/vnd.chipnuts.karaoke-mmd": {
                    source: "iana",
                    extensions: ["mmd"],
                },
                "application/vnd.ciedi": {
                    source: "iana",
                },
                "application/vnd.cinderella": {
                    source: "iana",
                    extensions: ["cdy"],
                },
                "application/vnd.cirpack.isdn-ext": {
                    source: "iana",
                },
                "application/vnd.citationstyles.style+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["csl"],
                },
                "application/vnd.claymore": {
                    source: "iana",
                    extensions: ["cla"],
                },
                "application/vnd.cloanto.rp9": {
                    source: "iana",
                    extensions: ["rp9"],
                },
                "application/vnd.clonk.c4group": {
                    source: "iana",
                    extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"],
                },
                "application/vnd.cluetrust.cartomobile-config": {
                    source: "iana",
                    extensions: ["c11amc"],
                },
                "application/vnd.cluetrust.cartomobile-config-pkg": {
                    source: "iana",
                    extensions: ["c11amz"],
                },
                "application/vnd.coffeescript": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.document": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.document-template": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.presentation": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.presentation-template": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.spreadsheet": {
                    source: "iana",
                },
                "application/vnd.collabio.xodocuments.spreadsheet-template": {
                    source: "iana",
                },
                "application/vnd.collection+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.collection.doc+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.collection.next+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.comicbook+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.comicbook-rar": {
                    source: "iana",
                },
                "application/vnd.commerce-battelle": {
                    source: "iana",
                },
                "application/vnd.commonspace": {
                    source: "iana",
                    extensions: ["csp"],
                },
                "application/vnd.contact.cmsg": {
                    source: "iana",
                    extensions: ["cdbcmsg"],
                },
                "application/vnd.coreos.ignition+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.cosmocaller": {
                    source: "iana",
                    extensions: ["cmc"],
                },
                "application/vnd.crick.clicker": {
                    source: "iana",
                    extensions: ["clkx"],
                },
                "application/vnd.crick.clicker.keyboard": {
                    source: "iana",
                    extensions: ["clkk"],
                },
                "application/vnd.crick.clicker.palette": {
                    source: "iana",
                    extensions: ["clkp"],
                },
                "application/vnd.crick.clicker.template": {
                    source: "iana",
                    extensions: ["clkt"],
                },
                "application/vnd.crick.clicker.wordbank": {
                    source: "iana",
                    extensions: ["clkw"],
                },
                "application/vnd.criticaltools.wbs+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["wbs"],
                },
                "application/vnd.cryptii.pipe+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.crypto-shade-file": {
                    source: "iana",
                },
                "application/vnd.ctc-posml": {
                    source: "iana",
                    extensions: ["pml"],
                },
                "application/vnd.ctct.ws+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.cups-pdf": {
                    source: "iana",
                },
                "application/vnd.cups-postscript": {
                    source: "iana",
                },
                "application/vnd.cups-ppd": {
                    source: "iana",
                    extensions: ["ppd"],
                },
                "application/vnd.cups-raster": {
                    source: "iana",
                },
                "application/vnd.cups-raw": {
                    source: "iana",
                },
                "application/vnd.curl": {
                    source: "iana",
                },
                "application/vnd.curl.car": {
                    source: "apache",
                    extensions: ["car"],
                },
                "application/vnd.curl.pcurl": {
                    source: "apache",
                    extensions: ["pcurl"],
                },
                "application/vnd.cyan.dean.root+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.cybank": {
                    source: "iana",
                },
                "application/vnd.d2l.coursepackage1p0+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.dart": {
                    source: "iana",
                    compressible: true,
                    extensions: ["dart"],
                },
                "application/vnd.data-vision.rdz": {
                    source: "iana",
                    extensions: ["rdz"],
                },
                "application/vnd.datapackage+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dataresource+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dbf": {
                    source: "iana",
                },
                "application/vnd.debian.binary-package": {
                    source: "iana",
                },
                "application/vnd.dece.data": {
                    source: "iana",
                    extensions: ["uvf", "uvvf", "uvd", "uvvd"],
                },
                "application/vnd.dece.ttml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["uvt", "uvvt"],
                },
                "application/vnd.dece.unspecified": {
                    source: "iana",
                    extensions: ["uvx", "uvvx"],
                },
                "application/vnd.dece.zip": {
                    source: "iana",
                    extensions: ["uvz", "uvvz"],
                },
                "application/vnd.denovo.fcselayout-link": {
                    source: "iana",
                    extensions: ["fe_launch"],
                },
                "application/vnd.desmume.movie": {
                    source: "iana",
                },
                "application/vnd.dir-bi.plate-dl-nosuffix": {
                    source: "iana",
                },
                "application/vnd.dm.delegation+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dna": {
                    source: "iana",
                    extensions: ["dna"],
                },
                "application/vnd.document+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dolby.mlp": {
                    source: "apache",
                    extensions: ["mlp"],
                },
                "application/vnd.dolby.mobile.1": {
                    source: "iana",
                },
                "application/vnd.dolby.mobile.2": {
                    source: "iana",
                },
                "application/vnd.doremir.scorecloud-binary-document": {
                    source: "iana",
                },
                "application/vnd.dpgraph": {
                    source: "iana",
                    extensions: ["dpg"],
                },
                "application/vnd.dreamfactory": {
                    source: "iana",
                    extensions: ["dfac"],
                },
                "application/vnd.drive+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ds-keypoint": {
                    source: "apache",
                    extensions: ["kpxx"],
                },
                "application/vnd.dtg.local": {
                    source: "iana",
                },
                "application/vnd.dtg.local.flash": {
                    source: "iana",
                },
                "application/vnd.dtg.local.html": {
                    source: "iana",
                },
                "application/vnd.dvb.ait": {
                    source: "iana",
                    extensions: ["ait"],
                },
                "application/vnd.dvb.dvbisl+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.dvbj": {
                    source: "iana",
                },
                "application/vnd.dvb.esgcontainer": {
                    source: "iana",
                },
                "application/vnd.dvb.ipdcdftnotifaccess": {
                    source: "iana",
                },
                "application/vnd.dvb.ipdcesgaccess": {
                    source: "iana",
                },
                "application/vnd.dvb.ipdcesgaccess2": {
                    source: "iana",
                },
                "application/vnd.dvb.ipdcesgpdd": {
                    source: "iana",
                },
                "application/vnd.dvb.ipdcroaming": {
                    source: "iana",
                },
                "application/vnd.dvb.iptv.alfec-base": {
                    source: "iana",
                },
                "application/vnd.dvb.iptv.alfec-enhancement": {
                    source: "iana",
                },
                "application/vnd.dvb.notif-aggregate-root+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-container+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-generic+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-ia-msglist+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-ia-registration-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-ia-registration-response+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.notif-init+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.dvb.pfr": {
                    source: "iana",
                },
                "application/vnd.dvb.service": {
                    source: "iana",
                    extensions: ["svc"],
                },
                "application/vnd.dxr": {
                    source: "iana",
                },
                "application/vnd.dynageo": {
                    source: "iana",
                    extensions: ["geo"],
                },
                "application/vnd.dzr": {
                    source: "iana",
                },
                "application/vnd.easykaraoke.cdgdownload": {
                    source: "iana",
                },
                "application/vnd.ecdis-update": {
                    source: "iana",
                },
                "application/vnd.ecip.rlp": {
                    source: "iana",
                },
                "application/vnd.ecowin.chart": {
                    source: "iana",
                    extensions: ["mag"],
                },
                "application/vnd.ecowin.filerequest": {
                    source: "iana",
                },
                "application/vnd.ecowin.fileupdate": {
                    source: "iana",
                },
                "application/vnd.ecowin.series": {
                    source: "iana",
                },
                "application/vnd.ecowin.seriesrequest": {
                    source: "iana",
                },
                "application/vnd.ecowin.seriesupdate": {
                    source: "iana",
                },
                "application/vnd.efi.img": {
                    source: "iana",
                },
                "application/vnd.efi.iso": {
                    source: "iana",
                },
                "application/vnd.emclient.accessrequest+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.enliven": {
                    source: "iana",
                    extensions: ["nml"],
                },
                "application/vnd.enphase.envoy": {
                    source: "iana",
                },
                "application/vnd.eprints.data+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.epson.esf": {
                    source: "iana",
                    extensions: ["esf"],
                },
                "application/vnd.epson.msf": {
                    source: "iana",
                    extensions: ["msf"],
                },
                "application/vnd.epson.quickanime": {
                    source: "iana",
                    extensions: ["qam"],
                },
                "application/vnd.epson.salt": {
                    source: "iana",
                    extensions: ["slt"],
                },
                "application/vnd.epson.ssf": {
                    source: "iana",
                    extensions: ["ssf"],
                },
                "application/vnd.ericsson.quickcall": {
                    source: "iana",
                },
                "application/vnd.espass-espass+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.eszigno3+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["es3", "et3"],
                },
                "application/vnd.etsi.aoc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.asic-e+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.etsi.asic-s+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.etsi.cug+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvcommand+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvdiscovery+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvprofile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvsad-bc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvsad-cod+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvsad-npvr+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvservice+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvsync+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.iptvueprofile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.mcid+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.mheg5": {
                    source: "iana",
                },
                "application/vnd.etsi.overload-control-policy-dataset+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.pstn+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.sci+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.simservs+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.timestamp-token": {
                    source: "iana",
                },
                "application/vnd.etsi.tsl+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.etsi.tsl.der": {
                    source: "iana",
                },
                "application/vnd.eudora.data": {
                    source: "iana",
                },
                "application/vnd.evolv.ecig.profile": {
                    source: "iana",
                },
                "application/vnd.evolv.ecig.settings": {
                    source: "iana",
                },
                "application/vnd.evolv.ecig.theme": {
                    source: "iana",
                },
                "application/vnd.exstream-empower+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.exstream-package": {
                    source: "iana",
                },
                "application/vnd.ezpix-album": {
                    source: "iana",
                    extensions: ["ez2"],
                },
                "application/vnd.ezpix-package": {
                    source: "iana",
                    extensions: ["ez3"],
                },
                "application/vnd.f-secure.mobile": {
                    source: "iana",
                },
                "application/vnd.fastcopy-disk-image": {
                    source: "iana",
                },
                "application/vnd.fdf": {
                    source: "iana",
                    extensions: ["fdf"],
                },
                "application/vnd.fdsn.mseed": {
                    source: "iana",
                    extensions: ["mseed"],
                },
                "application/vnd.fdsn.seed": {
                    source: "iana",
                    extensions: ["seed", "dataless"],
                },
                "application/vnd.ffsns": {
                    source: "iana",
                },
                "application/vnd.ficlab.flb+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.filmit.zfc": {
                    source: "iana",
                },
                "application/vnd.fints": {
                    source: "iana",
                },
                "application/vnd.firemonkeys.cloudcell": {
                    source: "iana",
                },
                "application/vnd.flographit": {
                    source: "iana",
                    extensions: ["gph"],
                },
                "application/vnd.fluxtime.clip": {
                    source: "iana",
                    extensions: ["ftc"],
                },
                "application/vnd.font-fontforge-sfd": {
                    source: "iana",
                },
                "application/vnd.framemaker": {
                    source: "iana",
                    extensions: ["fm", "frame", "maker", "book"],
                },
                "application/vnd.frogans.fnc": {
                    source: "iana",
                    extensions: ["fnc"],
                },
                "application/vnd.frogans.ltf": {
                    source: "iana",
                    extensions: ["ltf"],
                },
                "application/vnd.fsc.weblaunch": {
                    source: "iana",
                    extensions: ["fsc"],
                },
                "application/vnd.fujitsu.oasys": {
                    source: "iana",
                    extensions: ["oas"],
                },
                "application/vnd.fujitsu.oasys2": {
                    source: "iana",
                    extensions: ["oa2"],
                },
                "application/vnd.fujitsu.oasys3": {
                    source: "iana",
                    extensions: ["oa3"],
                },
                "application/vnd.fujitsu.oasysgp": {
                    source: "iana",
                    extensions: ["fg5"],
                },
                "application/vnd.fujitsu.oasysprs": {
                    source: "iana",
                    extensions: ["bh2"],
                },
                "application/vnd.fujixerox.art-ex": {
                    source: "iana",
                },
                "application/vnd.fujixerox.art4": {
                    source: "iana",
                },
                "application/vnd.fujixerox.ddd": {
                    source: "iana",
                    extensions: ["ddd"],
                },
                "application/vnd.fujixerox.docuworks": {
                    source: "iana",
                    extensions: ["xdw"],
                },
                "application/vnd.fujixerox.docuworks.binder": {
                    source: "iana",
                    extensions: ["xbd"],
                },
                "application/vnd.fujixerox.docuworks.container": {
                    source: "iana",
                },
                "application/vnd.fujixerox.hbpl": {
                    source: "iana",
                },
                "application/vnd.fut-misnet": {
                    source: "iana",
                },
                "application/vnd.futoin+cbor": {
                    source: "iana",
                },
                "application/vnd.futoin+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.fuzzysheet": {
                    source: "iana",
                    extensions: ["fzs"],
                },
                "application/vnd.genomatix.tuxedo": {
                    source: "iana",
                    extensions: ["txd"],
                },
                "application/vnd.gentics.grd+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.geo+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.geocube+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.geogebra.file": {
                    source: "iana",
                    extensions: ["ggb"],
                },
                "application/vnd.geogebra.tool": {
                    source: "iana",
                    extensions: ["ggt"],
                },
                "application/vnd.geometry-explorer": {
                    source: "iana",
                    extensions: ["gex", "gre"],
                },
                "application/vnd.geonext": {
                    source: "iana",
                    extensions: ["gxt"],
                },
                "application/vnd.geoplan": {
                    source: "iana",
                    extensions: ["g2w"],
                },
                "application/vnd.geospace": {
                    source: "iana",
                    extensions: ["g3w"],
                },
                "application/vnd.gerber": {
                    source: "iana",
                },
                "application/vnd.globalplatform.card-content-mgt": {
                    source: "iana",
                },
                "application/vnd.globalplatform.card-content-mgt-response": {
                    source: "iana",
                },
                "application/vnd.gmx": {
                    source: "iana",
                    extensions: ["gmx"],
                },
                "application/vnd.google-apps.document": {
                    compressible: false,
                    extensions: ["gdoc"],
                },
                "application/vnd.google-apps.presentation": {
                    compressible: false,
                    extensions: ["gslides"],
                },
                "application/vnd.google-apps.spreadsheet": {
                    compressible: false,
                    extensions: ["gsheet"],
                },
                "application/vnd.google-earth.kml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["kml"],
                },
                "application/vnd.google-earth.kmz": {
                    source: "iana",
                    compressible: false,
                    extensions: ["kmz"],
                },
                "application/vnd.gov.sk.e-form+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.gov.sk.e-form+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.gov.sk.xmldatacontainer+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.grafeq": {
                    source: "iana",
                    extensions: ["gqf", "gqs"],
                },
                "application/vnd.gridmp": {
                    source: "iana",
                },
                "application/vnd.groove-account": {
                    source: "iana",
                    extensions: ["gac"],
                },
                "application/vnd.groove-help": {
                    source: "iana",
                    extensions: ["ghf"],
                },
                "application/vnd.groove-identity-message": {
                    source: "iana",
                    extensions: ["gim"],
                },
                "application/vnd.groove-injector": {
                    source: "iana",
                    extensions: ["grv"],
                },
                "application/vnd.groove-tool-message": {
                    source: "iana",
                    extensions: ["gtm"],
                },
                "application/vnd.groove-tool-template": {
                    source: "iana",
                    extensions: ["tpl"],
                },
                "application/vnd.groove-vcard": {
                    source: "iana",
                    extensions: ["vcg"],
                },
                "application/vnd.hal+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hal+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["hal"],
                },
                "application/vnd.handheld-entertainment+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["zmm"],
                },
                "application/vnd.hbci": {
                    source: "iana",
                    extensions: ["hbci"],
                },
                "application/vnd.hc+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hcl-bireports": {
                    source: "iana",
                },
                "application/vnd.hdt": {
                    source: "iana",
                },
                "application/vnd.heroku+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hhe.lesson-player": {
                    source: "iana",
                    extensions: ["les"],
                },
                "application/vnd.hp-hpgl": {
                    source: "iana",
                    extensions: ["hpgl"],
                },
                "application/vnd.hp-hpid": {
                    source: "iana",
                    extensions: ["hpid"],
                },
                "application/vnd.hp-hps": {
                    source: "iana",
                    extensions: ["hps"],
                },
                "application/vnd.hp-jlyt": {
                    source: "iana",
                    extensions: ["jlt"],
                },
                "application/vnd.hp-pcl": {
                    source: "iana",
                    extensions: ["pcl"],
                },
                "application/vnd.hp-pclxl": {
                    source: "iana",
                    extensions: ["pclxl"],
                },
                "application/vnd.httphone": {
                    source: "iana",
                },
                "application/vnd.hydrostatix.sof-data": {
                    source: "iana",
                    extensions: ["sfd-hdstx"],
                },
                "application/vnd.hyper+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hyper-item+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hyperdrive+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.hzn-3d-crossword": {
                    source: "iana",
                },
                "application/vnd.ibm.afplinedata": {
                    source: "iana",
                },
                "application/vnd.ibm.electronic-media": {
                    source: "iana",
                },
                "application/vnd.ibm.minipay": {
                    source: "iana",
                    extensions: ["mpy"],
                },
                "application/vnd.ibm.modcap": {
                    source: "iana",
                    extensions: ["afp", "listafp", "list3820"],
                },
                "application/vnd.ibm.rights-management": {
                    source: "iana",
                    extensions: ["irm"],
                },
                "application/vnd.ibm.secure-container": {
                    source: "iana",
                    extensions: ["sc"],
                },
                "application/vnd.iccprofile": {
                    source: "iana",
                    extensions: ["icc", "icm"],
                },
                "application/vnd.ieee.1905": {
                    source: "iana",
                },
                "application/vnd.igloader": {
                    source: "iana",
                    extensions: ["igl"],
                },
                "application/vnd.imagemeter.folder+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.imagemeter.image+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.immervision-ivp": {
                    source: "iana",
                    extensions: ["ivp"],
                },
                "application/vnd.immervision-ivu": {
                    source: "iana",
                    extensions: ["ivu"],
                },
                "application/vnd.ims.imsccv1p1": {
                    source: "iana",
                },
                "application/vnd.ims.imsccv1p2": {
                    source: "iana",
                },
                "application/vnd.ims.imsccv1p3": {
                    source: "iana",
                },
                "application/vnd.ims.lis.v2.result+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ims.lti.v2.toolproxy+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ims.lti.v2.toolproxy.id+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ims.lti.v2.toolsettings+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ims.lti.v2.toolsettings.simple+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.informedcontrol.rms+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.informix-visionary": {
                    source: "iana",
                },
                "application/vnd.infotech.project": {
                    source: "iana",
                },
                "application/vnd.infotech.project+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.innopath.wamp.notification": {
                    source: "iana",
                },
                "application/vnd.insors.igm": {
                    source: "iana",
                    extensions: ["igm"],
                },
                "application/vnd.intercon.formnet": {
                    source: "iana",
                    extensions: ["xpw", "xpx"],
                },
                "application/vnd.intergeo": {
                    source: "iana",
                    extensions: ["i2g"],
                },
                "application/vnd.intertrust.digibox": {
                    source: "iana",
                },
                "application/vnd.intertrust.nncp": {
                    source: "iana",
                },
                "application/vnd.intu.qbo": {
                    source: "iana",
                    extensions: ["qbo"],
                },
                "application/vnd.intu.qfx": {
                    source: "iana",
                    extensions: ["qfx"],
                },
                "application/vnd.iptc.g2.catalogitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.conceptitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.knowledgeitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.newsitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.newsmessage+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.packageitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.iptc.g2.planningitem+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ipunplugged.rcprofile": {
                    source: "iana",
                    extensions: ["rcprofile"],
                },
                "application/vnd.irepository.package+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["irp"],
                },
                "application/vnd.is-xpr": {
                    source: "iana",
                    extensions: ["xpr"],
                },
                "application/vnd.isac.fcs": {
                    source: "iana",
                    extensions: ["fcs"],
                },
                "application/vnd.iso11783-10+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.jam": {
                    source: "iana",
                    extensions: ["jam"],
                },
                "application/vnd.japannet-directory-service": {
                    source: "iana",
                },
                "application/vnd.japannet-jpnstore-wakeup": {
                    source: "iana",
                },
                "application/vnd.japannet-payment-wakeup": {
                    source: "iana",
                },
                "application/vnd.japannet-registration": {
                    source: "iana",
                },
                "application/vnd.japannet-registration-wakeup": {
                    source: "iana",
                },
                "application/vnd.japannet-setstore-wakeup": {
                    source: "iana",
                },
                "application/vnd.japannet-verification": {
                    source: "iana",
                },
                "application/vnd.japannet-verification-wakeup": {
                    source: "iana",
                },
                "application/vnd.jcp.javame.midlet-rms": {
                    source: "iana",
                    extensions: ["rms"],
                },
                "application/vnd.jisp": {
                    source: "iana",
                    extensions: ["jisp"],
                },
                "application/vnd.joost.joda-archive": {
                    source: "iana",
                    extensions: ["joda"],
                },
                "application/vnd.jsk.isdn-ngn": {
                    source: "iana",
                },
                "application/vnd.kahootz": {
                    source: "iana",
                    extensions: ["ktz", "ktr"],
                },
                "application/vnd.kde.karbon": {
                    source: "iana",
                    extensions: ["karbon"],
                },
                "application/vnd.kde.kchart": {
                    source: "iana",
                    extensions: ["chrt"],
                },
                "application/vnd.kde.kformula": {
                    source: "iana",
                    extensions: ["kfo"],
                },
                "application/vnd.kde.kivio": {
                    source: "iana",
                    extensions: ["flw"],
                },
                "application/vnd.kde.kontour": {
                    source: "iana",
                    extensions: ["kon"],
                },
                "application/vnd.kde.kpresenter": {
                    source: "iana",
                    extensions: ["kpr", "kpt"],
                },
                "application/vnd.kde.kspread": {
                    source: "iana",
                    extensions: ["ksp"],
                },
                "application/vnd.kde.kword": {
                    source: "iana",
                    extensions: ["kwd", "kwt"],
                },
                "application/vnd.kenameaapp": {
                    source: "iana",
                    extensions: ["htke"],
                },
                "application/vnd.kidspiration": {
                    source: "iana",
                    extensions: ["kia"],
                },
                "application/vnd.kinar": {
                    source: "iana",
                    extensions: ["kne", "knp"],
                },
                "application/vnd.koan": {
                    source: "iana",
                    extensions: ["skp", "skd", "skt", "skm"],
                },
                "application/vnd.kodak-descriptor": {
                    source: "iana",
                    extensions: ["sse"],
                },
                "application/vnd.las": {
                    source: "iana",
                },
                "application/vnd.las.las+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.las.las+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["lasxml"],
                },
                "application/vnd.laszip": {
                    source: "iana",
                },
                "application/vnd.leap+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.liberty-request+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.llamagraphics.life-balance.desktop": {
                    source: "iana",
                    extensions: ["lbd"],
                },
                "application/vnd.llamagraphics.life-balance.exchange+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["lbe"],
                },
                "application/vnd.logipipe.circuit+zip": {
                    source: "iana",
                    compressible: false,
                },
                "application/vnd.loom": {
                    source: "iana",
                },
                "application/vnd.lotus-1-2-3": {
                    source: "iana",
                    extensions: ["123"],
                },
                "application/vnd.lotus-approach": {
                    source: "iana",
                    extensions: ["apr"],
                },
                "application/vnd.lotus-freelance": {
                    source: "iana",
                    extensions: ["pre"],
                },
                "application/vnd.lotus-notes": {
                    source: "iana",
                    extensions: ["nsf"],
                },
                "application/vnd.lotus-organizer": {
                    source: "iana",
                    extensions: ["org"],
                },
                "application/vnd.lotus-screencam": {
                    source: "iana",
                    extensions: ["scm"],
                },
                "application/vnd.lotus-wordpro": {
                    source: "iana",
                    extensions: ["lwp"],
                },
                "application/vnd.macports.portpkg": {
                    source: "iana",
                    extensions: ["portpkg"],
                },
                "application/vnd.mapbox-vector-tile": {
                    source: "iana",
                },
                "application/vnd.marlin.drm.actiontoken+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.marlin.drm.conftoken+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.marlin.drm.license+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.marlin.drm.mdcf": {
                    source: "iana",
                },
                "application/vnd.mason+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.maxmind.maxmind-db": {
                    source: "iana",
                },
                "application/vnd.mcd": {
                    source: "iana",
                    extensions: ["mcd"],
                },
                "application/vnd.medcalcdata": {
                    source: "iana",
                    extensions: ["mc1"],
                },
                "application/vnd.mediastation.cdkey": {
                    source: "iana",
                    extensions: ["cdkey"],
                },
                "application/vnd.meridian-slingshot": {
                    source: "iana",
                },
                "application/vnd.mfer": {
                    source: "iana",
                    extensions: ["mwf"],
                },
                "application/vnd.mfmp": {
                    source: "iana",
                    extensions: ["mfm"],
                },
                "application/vnd.micro+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.micrografx.flo": {
                    source: "iana",
                    extensions: ["flo"],
                },
                "application/vnd.micrografx.igx": {
                    source: "iana",
                    extensions: ["igx"],
                },
                "application/vnd.microsoft.portable-executable": {
                    source: "iana",
                },
                "application/vnd.microsoft.windows.thumbnail-cache": {
                    source: "iana",
                },
                "application/vnd.miele+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.mif": {
                    source: "iana",
                    extensions: ["mif"],
                },
                "application/vnd.minisoft-hp3000-save": {
                    source: "iana",
                },
                "application/vnd.mitsubishi.misty-guard.trustweb": {
                    source: "iana",
                },
                "application/vnd.mobius.daf": {
                    source: "iana",
                    extensions: ["daf"],
                },
                "application/vnd.mobius.dis": {
                    source: "iana",
                    extensions: ["dis"],
                },
                "application/vnd.mobius.mbk": {
                    source: "iana",
                    extensions: ["mbk"],
                },
                "application/vnd.mobius.mqy": {
                    source: "iana",
                    extensions: ["mqy"],
                },
                "application/vnd.mobius.msl": {
                    source: "iana",
                    extensions: ["msl"],
                },
                "application/vnd.mobius.plc": {
                    source: "iana",
                    extensions: ["plc"],
                },
                "application/vnd.mobius.txf": {
                    source: "iana",
                    extensions: ["txf"],
                },
                "application/vnd.mophun.application": {
                    source: "iana",
                    extensions: ["mpn"],
                },
                "application/vnd.mophun.certificate": {
                    source: "iana",
                    extensions: ["mpc"],
                },
                "application/vnd.motorola.flexsuite": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.adsi": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.fis": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.gotap": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.kmr": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.ttc": {
                    source: "iana",
                },
                "application/vnd.motorola.flexsuite.wem": {
                    source: "iana",
                },
                "application/vnd.motorola.iprm": {
                    source: "iana",
                },
                "application/vnd.mozilla.xul+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xul"],
                },
                "application/vnd.ms-3mfdocument": {
                    source: "iana",
                },
                "application/vnd.ms-artgalry": {
                    source: "iana",
                    extensions: ["cil"],
                },
                "application/vnd.ms-asf": {
                    source: "iana",
                },
                "application/vnd.ms-cab-compressed": {
                    source: "iana",
                    extensions: ["cab"],
                },
                "application/vnd.ms-color.iccprofile": {
                    source: "apache",
                },
                "application/vnd.ms-excel": {
                    source: "iana",
                    compressible: false,
                    extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"],
                },
                "application/vnd.ms-excel.addin.macroenabled.12": {
                    source: "iana",
                    extensions: ["xlam"],
                },
                "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
                    source: "iana",
                    extensions: ["xlsb"],
                },
                "application/vnd.ms-excel.sheet.macroenabled.12": {
                    source: "iana",
                    extensions: ["xlsm"],
                },
                "application/vnd.ms-excel.template.macroenabled.12": {
                    source: "iana",
                    extensions: ["xltm"],
                },
                "application/vnd.ms-fontobject": {
                    source: "iana",
                    compressible: true,
                    extensions: ["eot"],
                },
                "application/vnd.ms-htmlhelp": {
                    source: "iana",
                    extensions: ["chm"],
                },
                "application/vnd.ms-ims": {
                    source: "iana",
                    extensions: ["ims"],
                },
                "application/vnd.ms-lrm": {
                    source: "iana",
                    extensions: ["lrm"],
                },
                "application/vnd.ms-office.activex+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ms-officetheme": {
                    source: "iana",
                    extensions: ["thmx"],
                },
                "application/vnd.ms-opentype": {
                    source: "apache",
                    compressible: true,
                },
                "application/vnd.ms-outlook": {
                    compressible: false,
                    extensions: ["msg"],
                },
                "application/vnd.ms-package.obfuscated-opentype": {
                    source: "apache",
                },
                "application/vnd.ms-pki.seccat": {
                    source: "apache",
                    extensions: ["cat"],
                },
                "application/vnd.ms-pki.stl": {
                    source: "apache",
                    extensions: ["stl"],
                },
                "application/vnd.ms-playready.initiator+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ms-powerpoint": {
                    source: "iana",
                    compressible: false,
                    extensions: ["ppt", "pps", "pot"],
                },
                "application/vnd.ms-powerpoint.addin.macroenabled.12": {
                    source: "iana",
                    extensions: ["ppam"],
                },
                "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
                    source: "iana",
                    extensions: ["pptm"],
                },
                "application/vnd.ms-powerpoint.slide.macroenabled.12": {
                    source: "iana",
                    extensions: ["sldm"],
                },
                "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
                    source: "iana",
                    extensions: ["ppsm"],
                },
                "application/vnd.ms-powerpoint.template.macroenabled.12": {
                    source: "iana",
                    extensions: ["potm"],
                },
                "application/vnd.ms-printdevicecapabilities+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ms-printing.printticket+xml": {
                    source: "apache",
                    compressible: true,
                },
                "application/vnd.ms-printschematicket+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.ms-project": {
                    source: "iana",
                    extensions: ["mpp", "mpt"],
                },
                "application/vnd.ms-tnef": {
                    source: "iana",
                },
                "application/vnd.ms-windows.devicepairing": {
                    source: "iana",
                },
                "application/vnd.ms-windows.nwprinting.oob": {
                    source: "iana",
                },
                "application/vnd.ms-windows.printerpairing": {
                    source: "iana",
                },
                "application/vnd.ms-windows.wsd.oob": {
                    source: "iana",
                },
                "application/vnd.ms-wmdrm.lic-chlg-req": {
                    source: "iana",
                },
                "application/vnd.ms-wmdrm.lic-resp": {
                    source: "iana",
                },
                "application/vnd.ms-wmdrm.meter-chlg-req": {
                    source: "iana",
                },
                "application/vnd.ms-wmdrm.meter-resp": {
                    source: "iana",
                },
                "application/vnd.ms-word.document.macroenabled.12": {
                    source: "iana",
                    extensions: ["docm"],
                },
                "application/vnd.ms-word.template.macroenabled.12": {
                    source: "iana",
                    extensions: ["dotm"],
                },
                "application/vnd.ms-works": {
                    source: "iana",
                    extensions: ["wps", "wks", "wcm", "wdb"],
                },
                "application/vnd.ms-wpl": {
                    source: "iana",
                    extensions: ["wpl"],
                },
                "application/vnd.ms-xpsdocument": {
                    source: "iana",
                    compressible: false,
                    extensions: ["xps"],
                },
                "application/vnd.msa-disk-image": {
                    source: "iana",
                },
                "application/vnd.mseq": {
                    source: "iana",
                    extensions: ["mseq"],
                },
                "application/vnd.msign": {
                    source: "iana",
                },
                "application/vnd.multiad.creator": {
                    source: "iana",
                },
                "application/vnd.multiad.creator.cif": {
                    source: "iana",
                },
                "application/vnd.music-niff": {
                    source: "iana",
                },
                "application/vnd.musician": {
                    source: "iana",
                    extensions: ["mus"],
                },
                "application/vnd.muvee.style": {
                    source: "iana",
                    extensions: ["msty"],
                },
                "application/vnd.mynfc": {
                    source: "iana",
                    extensions: ["taglet"],
                },
                "application/vnd.ncd.control": {
                    source: "iana",
                },
                "application/vnd.ncd.reference": {
                    source: "iana",
                },
                "application/vnd.nearst.inv+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nervana": {
                    source: "iana",
                },
                "application/vnd.netfpx": {
                    source: "iana",
                },
                "application/vnd.neurolanguage.nlu": {
                    source: "iana",
                    extensions: ["nlu"],
                },
                "application/vnd.nimn": {
                    source: "iana",
                },
                "application/vnd.nintendo.nitro.rom": {
                    source: "iana",
                },
                "application/vnd.nintendo.snes.rom": {
                    source: "iana",
                },
                "application/vnd.nitf": {
                    source: "iana",
                    extensions: ["ntf", "nitf"],
                },
                "application/vnd.noblenet-directory": {
                    source: "iana",
                    extensions: ["nnd"],
                },
                "application/vnd.noblenet-sealer": {
                    source: "iana",
                    extensions: ["nns"],
                },
                "application/vnd.noblenet-web": {
                    source: "iana",
                    extensions: ["nnw"],
                },
                "application/vnd.nokia.catalogs": {
                    source: "iana",
                },
                "application/vnd.nokia.conml+wbxml": {
                    source: "iana",
                },
                "application/vnd.nokia.conml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nokia.iptv.config+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nokia.isds-radio-presets": {
                    source: "iana",
                },
                "application/vnd.nokia.landmark+wbxml": {
                    source: "iana",
                },
                "application/vnd.nokia.landmark+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nokia.landmarkcollection+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nokia.n-gage.ac+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ac"],
                },
                "application/vnd.nokia.n-gage.data": {
                    source: "iana",
                    extensions: ["ngdat"],
                },
                "application/vnd.nokia.n-gage.symbian.install": {
                    source: "iana",
                    extensions: ["n-gage"],
                },
                "application/vnd.nokia.ncd": {
                    source: "iana",
                },
                "application/vnd.nokia.pcd+wbxml": {
                    source: "iana",
                },
                "application/vnd.nokia.pcd+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.nokia.radio-preset": {
                    source: "iana",
                    extensions: ["rpst"],
                },
                "application/vnd.nokia.radio-presets": {
                    source: "iana",
                    extensions: ["rpss"],
                },
                "application/vnd.novadigm.edm": {
                    source: "iana",
                    extensions: ["edm"],
                },
                "application/vnd.novadigm.edx": {
                    source: "iana",
                    extensions: ["edx"],
                },
                "application/vnd.novadigm.ext": {
                    source: "iana",
                    extensions: ["ext"],
                },
                "application/vnd.ntt-local.content-share": {
                    source: "iana",
                },
                "application/vnd.ntt-local.file-transfer": {
                    source: "iana",
                },
                "application/vnd.ntt-local.ogw_remote-access": {
                    source: "iana",
                },
                "application/vnd.ntt-local.sip-ta_remote": {
                    source: "iana",
                },
                "application/vnd.ntt-local.sip-ta_tcp_stream": {
                    source: "iana",
                },
                "application/vnd.oasis.opendocument.chart": {
                    source: "iana",
                    extensions: ["odc"],
                },
                "application/vnd.oasis.opendocument.chart-template": {
                    source: "iana",
                    extensions: ["otc"],
                },
                "application/vnd.oasis.opendocument.database": {
                    source: "iana",
                    extensions: ["odb"],
                },
                "application/vnd.oasis.opendocument.formula": {
                    source: "iana",
                    extensions: ["odf"],
                },
                "application/vnd.oasis.opendocument.formula-template": {
                    source: "iana",
                    extensions: ["odft"],
                },
                "application/vnd.oasis.opendocument.graphics": {
                    source: "iana",
                    compressible: false,
                    extensions: ["odg"],
                },
                "application/vnd.oasis.opendocument.graphics-template": {
                    source: "iana",
                    extensions: ["otg"],
                },
                "application/vnd.oasis.opendocument.image": {
                    source: "iana",
                    extensions: ["odi"],
                },
                "application/vnd.oasis.opendocument.image-template": {
                    source: "iana",
                    extensions: ["oti"],
                },
                "application/vnd.oasis.opendocument.presentation": {
                    source: "iana",
                    compressible: false,
                    extensions: ["odp"],
                },
                "application/vnd.oasis.opendocument.presentation-template": {
                    source: "iana",
                    extensions: ["otp"],
                },
                "application/vnd.oasis.opendocument.spreadsheet": {
                    source: "iana",
                    compressible: false,
                    extensions: ["ods"],
                },
                "application/vnd.oasis.opendocument.spreadsheet-template": {
                    source: "iana",
                    extensions: ["ots"],
                },
                "application/vnd.oasis.opendocument.text": {
                    source: "iana",
                    compressible: false,
                    extensions: ["odt"],
                },
                "application/vnd.oasis.opendocument.text-master": {
                    source: "iana",
                    extensions: ["odm"],
                },
                "application/vnd.oasis.opendocument.text-template": {
                    source: "iana",
                    extensions: ["ott"],
                },
                "application/vnd.oasis.opendocument.text-web": {
                    source: "iana",
                    extensions: ["oth"],
                },
                "application/vnd.obn": {
                    source: "iana",
                },
                "application/vnd.ocf+cbor": {
                    source: "iana",
                },
                "application/vnd.oci.image.manifest.v1+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oftn.l10n+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.contentaccessdownload+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.contentaccessstreaming+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.cspg-hexbinary": {
                    source: "iana",
                },
                "application/vnd.oipf.dae.svg+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.dae.xhtml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.mippvcontrolmessage+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.pae.gem": {
                    source: "iana",
                },
                "application/vnd.oipf.spdiscovery+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.spdlist+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.ueprofile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oipf.userprofile+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.olpc-sugar": {
                    source: "iana",
                    extensions: ["xo"],
                },
                "application/vnd.oma-scws-config": {
                    source: "iana",
                },
                "application/vnd.oma-scws-http-request": {
                    source: "iana",
                },
                "application/vnd.oma-scws-http-response": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.drm-trigger+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.imd+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.ltkm": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.notification+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.provisioningtrigger": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.sgboot": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.sgdd+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.sgdu": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.simple-symbol-container": {
                    source: "iana",
                },
                "application/vnd.oma.bcast.smartcard-trigger+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.sprov+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.bcast.stkm": {
                    source: "iana",
                },
                "application/vnd.oma.cab-address-book+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.cab-feature-handler+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.cab-pcc+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.cab-subs-invite+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.cab-user-prefs+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.dcd": {
                    source: "iana",
                },
                "application/vnd.oma.dcdc": {
                    source: "iana",
                },
                "application/vnd.oma.dd2+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["dd2"],
                },
                "application/vnd.oma.drm.risd+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.group-usage-list+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.lwm2m+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.lwm2m+tlv": {
                    source: "iana",
                },
                "application/vnd.oma.pal+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.poc.detailed-progress-report+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.poc.final-report+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.poc.groups+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.poc.invocation-descriptor+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.poc.optimized-progress-report+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.push": {
                    source: "iana",
                },
                "application/vnd.oma.scidm.messages+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oma.xcap-directory+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.omads-email+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/vnd.omads-file+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/vnd.omads-folder+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/vnd.omaloc-supl-init": {
                    source: "iana",
                },
                "application/vnd.onepager": {
                    source: "iana",
                },
                "application/vnd.onepagertamp": {
                    source: "iana",
                },
                "application/vnd.onepagertamx": {
                    source: "iana",
                },
                "application/vnd.onepagertat": {
                    source: "iana",
                },
                "application/vnd.onepagertatp": {
                    source: "iana",
                },
                "application/vnd.onepagertatx": {
                    source: "iana",
                },
                "application/vnd.openblox.game+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["obgx"],
                },
                "application/vnd.openblox.game-binary": {
                    source: "iana",
                },
                "application/vnd.openeye.oeb": {
                    source: "iana",
                },
                "application/vnd.openofficeorg.extension": {
                    source: "apache",
                    extensions: ["oxt"],
                },
                "application/vnd.openstreetmap.data+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["osm"],
                },
                "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawing+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
                    source: "iana",
                    compressible: false,
                    extensions: ["pptx"],
                },
                "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slide": {
                    source: "iana",
                    extensions: ["sldx"],
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
                    source: "iana",
                    extensions: ["ppsx"],
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.template": {
                    source: "iana",
                    extensions: ["potx"],
                },
                "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                    source: "iana",
                    compressible: false,
                    extensions: ["xlsx"],
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
                    source: "iana",
                    extensions: ["xltx"],
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.theme+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.vmldrawing": {
                    source: "iana",
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
                    source: "iana",
                    compressible: false,
                    extensions: ["docx"],
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
                    source: "iana",
                    extensions: ["dotx"],
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-package.core-properties+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.openxmlformats-package.relationships+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oracle.resource+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.orange.indata": {
                    source: "iana",
                },
                "application/vnd.osa.netdeploy": {
                    source: "iana",
                },
                "application/vnd.osgeo.mapguide.package": {
                    source: "iana",
                    extensions: ["mgp"],
                },
                "application/vnd.osgi.bundle": {
                    source: "iana",
                },
                "application/vnd.osgi.dp": {
                    source: "iana",
                    extensions: ["dp"],
                },
                "application/vnd.osgi.subsystem": {
                    source: "iana",
                    extensions: ["esa"],
                },
                "application/vnd.otps.ct-kip+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.oxli.countgraph": {
                    source: "iana",
                },
                "application/vnd.pagerduty+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.palm": {
                    source: "iana",
                    extensions: ["pdb", "pqa", "oprc"],
                },
                "application/vnd.panoply": {
                    source: "iana",
                },
                "application/vnd.paos.xml": {
                    source: "iana",
                },
                "application/vnd.patentdive": {
                    source: "iana",
                },
                "application/vnd.patientecommsdoc": {
                    source: "iana",
                },
                "application/vnd.pawaafile": {
                    source: "iana",
                    extensions: ["paw"],
                },
                "application/vnd.pcos": {
                    source: "iana",
                },
                "application/vnd.pg.format": {
                    source: "iana",
                    extensions: ["str"],
                },
                "application/vnd.pg.osasli": {
                    source: "iana",
                    extensions: ["ei6"],
                },
                "application/vnd.piaccess.application-licence": {
                    source: "iana",
                },
                "application/vnd.picsel": {
                    source: "iana",
                    extensions: ["efif"],
                },
                "application/vnd.pmi.widget": {
                    source: "iana",
                    extensions: ["wg"],
                },
                "application/vnd.poc.group-advertisement+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.pocketlearn": {
                    source: "iana",
                    extensions: ["plf"],
                },
                "application/vnd.powerbuilder6": {
                    source: "iana",
                    extensions: ["pbd"],
                },
                "application/vnd.powerbuilder6-s": {
                    source: "iana",
                },
                "application/vnd.powerbuilder7": {
                    source: "iana",
                },
                "application/vnd.powerbuilder7-s": {
                    source: "iana",
                },
                "application/vnd.powerbuilder75": {
                    source: "iana",
                },
                "application/vnd.powerbuilder75-s": {
                    source: "iana",
                },
                "application/vnd.preminet": {
                    source: "iana",
                },
                "application/vnd.previewsystems.box": {
                    source: "iana",
                    extensions: ["box"],
                },
                "application/vnd.proteus.magazine": {
                    source: "iana",
                    extensions: ["mgz"],
                },
                "application/vnd.psfs": {
                    source: "iana",
                },
                "application/vnd.publishare-delta-tree": {
                    source: "iana",
                    extensions: ["qps"],
                },
                "application/vnd.pvi.ptid1": {
                    source: "iana",
                    extensions: ["ptid"],
                },
                "application/vnd.pwg-multiplexed": {
                    source: "iana",
                },
                "application/vnd.pwg-xhtml-print+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.qualcomm.brew-app-res": {
                    source: "iana",
                },
                "application/vnd.quarantainenet": {
                    source: "iana",
                },
                "application/vnd.quark.quarkxpress": {
                    source: "iana",
                    extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"],
                },
                "application/vnd.quobject-quoxdocument": {
                    source: "iana",
                },
                "application/vnd.radisys.moml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-audit+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-audit-conf+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-audit-conn+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-audit-dialog+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-audit-stream+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-conf+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-base+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-fax-detect+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-group+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-speech+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.radisys.msml-dialog-transform+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.rainstor.data": {
                    source: "iana",
                },
                "application/vnd.rapid": {
                    source: "iana",
                },
                "application/vnd.rar": {
                    source: "iana",
                },
                "application/vnd.realvnc.bed": {
                    source: "iana",
                    extensions: ["bed"],
                },
                "application/vnd.recordare.musicxml": {
                    source: "iana",
                    extensions: ["mxl"],
                },
                "application/vnd.recordare.musicxml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["musicxml"],
                },
                "application/vnd.renlearn.rlprint": {
                    source: "iana",
                },
                "application/vnd.restful+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.rig.cryptonote": {
                    source: "iana",
                    extensions: ["cryptonote"],
                },
                "application/vnd.rim.cod": {
                    source: "apache",
                    extensions: ["cod"],
                },
                "application/vnd.rn-realmedia": {
                    source: "apache",
                    extensions: ["rm"],
                },
                "application/vnd.rn-realmedia-vbr": {
                    source: "apache",
                    extensions: ["rmvb"],
                },
                "application/vnd.route66.link66+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["link66"],
                },
                "application/vnd.rs-274x": {
                    source: "iana",
                },
                "application/vnd.ruckus.download": {
                    source: "iana",
                },
                "application/vnd.s3sms": {
                    source: "iana",
                },
                "application/vnd.sailingtracker.track": {
                    source: "iana",
                    extensions: ["st"],
                },
                "application/vnd.sar": {
                    source: "iana",
                },
                "application/vnd.sbm.cid": {
                    source: "iana",
                },
                "application/vnd.sbm.mid2": {
                    source: "iana",
                },
                "application/vnd.scribus": {
                    source: "iana",
                },
                "application/vnd.sealed.3df": {
                    source: "iana",
                },
                "application/vnd.sealed.csf": {
                    source: "iana",
                },
                "application/vnd.sealed.doc": {
                    source: "iana",
                },
                "application/vnd.sealed.eml": {
                    source: "iana",
                },
                "application/vnd.sealed.mht": {
                    source: "iana",
                },
                "application/vnd.sealed.net": {
                    source: "iana",
                },
                "application/vnd.sealed.ppt": {
                    source: "iana",
                },
                "application/vnd.sealed.tiff": {
                    source: "iana",
                },
                "application/vnd.sealed.xls": {
                    source: "iana",
                },
                "application/vnd.sealedmedia.softseal.html": {
                    source: "iana",
                },
                "application/vnd.sealedmedia.softseal.pdf": {
                    source: "iana",
                },
                "application/vnd.seemail": {
                    source: "iana",
                    extensions: ["see"],
                },
                "application/vnd.sema": {
                    source: "iana",
                    extensions: ["sema"],
                },
                "application/vnd.semd": {
                    source: "iana",
                    extensions: ["semd"],
                },
                "application/vnd.semf": {
                    source: "iana",
                    extensions: ["semf"],
                },
                "application/vnd.shade-save-file": {
                    source: "iana",
                },
                "application/vnd.shana.informed.formdata": {
                    source: "iana",
                    extensions: ["ifm"],
                },
                "application/vnd.shana.informed.formtemplate": {
                    source: "iana",
                    extensions: ["itp"],
                },
                "application/vnd.shana.informed.interchange": {
                    source: "iana",
                    extensions: ["iif"],
                },
                "application/vnd.shana.informed.package": {
                    source: "iana",
                    extensions: ["ipk"],
                },
                "application/vnd.shootproof+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.shopkick+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.shp": {
                    source: "iana",
                },
                "application/vnd.shx": {
                    source: "iana",
                },
                "application/vnd.sigrok.session": {
                    source: "iana",
                },
                "application/vnd.simtech-mindmapper": {
                    source: "iana",
                    extensions: ["twd", "twds"],
                },
                "application/vnd.siren+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.smaf": {
                    source: "iana",
                    extensions: ["mmf"],
                },
                "application/vnd.smart.notebook": {
                    source: "iana",
                },
                "application/vnd.smart.teacher": {
                    source: "iana",
                    extensions: ["teacher"],
                },
                "application/vnd.snesdev-page-table": {
                    source: "iana",
                },
                "application/vnd.software602.filler.form+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["fo"],
                },
                "application/vnd.software602.filler.form-xml-zip": {
                    source: "iana",
                },
                "application/vnd.solent.sdkm+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["sdkm", "sdkd"],
                },
                "application/vnd.spotfire.dxp": {
                    source: "iana",
                    extensions: ["dxp"],
                },
                "application/vnd.spotfire.sfs": {
                    source: "iana",
                    extensions: ["sfs"],
                },
                "application/vnd.sqlite3": {
                    source: "iana",
                },
                "application/vnd.sss-cod": {
                    source: "iana",
                },
                "application/vnd.sss-dtf": {
                    source: "iana",
                },
                "application/vnd.sss-ntf": {
                    source: "iana",
                },
                "application/vnd.stardivision.calc": {
                    source: "apache",
                    extensions: ["sdc"],
                },
                "application/vnd.stardivision.draw": {
                    source: "apache",
                    extensions: ["sda"],
                },
                "application/vnd.stardivision.impress": {
                    source: "apache",
                    extensions: ["sdd"],
                },
                "application/vnd.stardivision.math": {
                    source: "apache",
                    extensions: ["smf"],
                },
                "application/vnd.stardivision.writer": {
                    source: "apache",
                    extensions: ["sdw", "vor"],
                },
                "application/vnd.stardivision.writer-global": {
                    source: "apache",
                    extensions: ["sgl"],
                },
                "application/vnd.stepmania.package": {
                    source: "iana",
                    extensions: ["smzip"],
                },
                "application/vnd.stepmania.stepchart": {
                    source: "iana",
                    extensions: ["sm"],
                },
                "application/vnd.street-stream": {
                    source: "iana",
                },
                "application/vnd.sun.wadl+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["wadl"],
                },
                "application/vnd.sun.xml.calc": {
                    source: "apache",
                    extensions: ["sxc"],
                },
                "application/vnd.sun.xml.calc.template": {
                    source: "apache",
                    extensions: ["stc"],
                },
                "application/vnd.sun.xml.draw": {
                    source: "apache",
                    extensions: ["sxd"],
                },
                "application/vnd.sun.xml.draw.template": {
                    source: "apache",
                    extensions: ["std"],
                },
                "application/vnd.sun.xml.impress": {
                    source: "apache",
                    extensions: ["sxi"],
                },
                "application/vnd.sun.xml.impress.template": {
                    source: "apache",
                    extensions: ["sti"],
                },
                "application/vnd.sun.xml.math": {
                    source: "apache",
                    extensions: ["sxm"],
                },
                "application/vnd.sun.xml.writer": {
                    source: "apache",
                    extensions: ["sxw"],
                },
                "application/vnd.sun.xml.writer.global": {
                    source: "apache",
                    extensions: ["sxg"],
                },
                "application/vnd.sun.xml.writer.template": {
                    source: "apache",
                    extensions: ["stw"],
                },
                "application/vnd.sus-calendar": {
                    source: "iana",
                    extensions: ["sus", "susp"],
                },
                "application/vnd.svd": {
                    source: "iana",
                    extensions: ["svd"],
                },
                "application/vnd.swiftview-ics": {
                    source: "iana",
                },
                "application/vnd.symbian.install": {
                    source: "apache",
                    extensions: ["sis", "sisx"],
                },
                "application/vnd.syncml+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["xsm"],
                },
                "application/vnd.syncml.dm+wbxml": {
                    source: "iana",
                    charset: "UTF-8",
                    extensions: ["bdm"],
                },
                "application/vnd.syncml.dm+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["xdm"],
                },
                "application/vnd.syncml.dm.notification": {
                    source: "iana",
                },
                "application/vnd.syncml.dmddf+wbxml": {
                    source: "iana",
                },
                "application/vnd.syncml.dmddf+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["ddf"],
                },
                "application/vnd.syncml.dmtnds+wbxml": {
                    source: "iana",
                },
                "application/vnd.syncml.dmtnds+xml": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                },
                "application/vnd.syncml.ds.notification": {
                    source: "iana",
                },
                "application/vnd.tableschema+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.tao.intent-module-archive": {
                    source: "iana",
                    extensions: ["tao"],
                },
                "application/vnd.tcpdump.pcap": {
                    source: "iana",
                    extensions: ["pcap", "cap", "dmp"],
                },
                "application/vnd.think-cell.ppttc+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.tmd.mediaflex.api+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.tml": {
                    source: "iana",
                },
                "application/vnd.tmobile-livetv": {
                    source: "iana",
                    extensions: ["tmo"],
                },
                "application/vnd.tri.onesource": {
                    source: "iana",
                },
                "application/vnd.trid.tpt": {
                    source: "iana",
                    extensions: ["tpt"],
                },
                "application/vnd.triscape.mxs": {
                    source: "iana",
                    extensions: ["mxs"],
                },
                "application/vnd.trueapp": {
                    source: "iana",
                    extensions: ["tra"],
                },
                "application/vnd.truedoc": {
                    source: "iana",
                },
                "application/vnd.ubisoft.webplayer": {
                    source: "iana",
                },
                "application/vnd.ufdl": {
                    source: "iana",
                    extensions: ["ufd", "ufdl"],
                },
                "application/vnd.uiq.theme": {
                    source: "iana",
                    extensions: ["utz"],
                },
                "application/vnd.umajin": {
                    source: "iana",
                    extensions: ["umj"],
                },
                "application/vnd.unity": {
                    source: "iana",
                    extensions: ["unityweb"],
                },
                "application/vnd.uoml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["uoml"],
                },
                "application/vnd.uplanet.alert": {
                    source: "iana",
                },
                "application/vnd.uplanet.alert-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.bearer-choice": {
                    source: "iana",
                },
                "application/vnd.uplanet.bearer-choice-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.cacheop": {
                    source: "iana",
                },
                "application/vnd.uplanet.cacheop-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.channel": {
                    source: "iana",
                },
                "application/vnd.uplanet.channel-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.list": {
                    source: "iana",
                },
                "application/vnd.uplanet.list-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.listcmd": {
                    source: "iana",
                },
                "application/vnd.uplanet.listcmd-wbxml": {
                    source: "iana",
                },
                "application/vnd.uplanet.signal": {
                    source: "iana",
                },
                "application/vnd.uri-map": {
                    source: "iana",
                },
                "application/vnd.valve.source.material": {
                    source: "iana",
                },
                "application/vnd.vcx": {
                    source: "iana",
                    extensions: ["vcx"],
                },
                "application/vnd.vd-study": {
                    source: "iana",
                },
                "application/vnd.vectorworks": {
                    source: "iana",
                },
                "application/vnd.vel+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.verimatrix.vcas": {
                    source: "iana",
                },
                "application/vnd.veryant.thin": {
                    source: "iana",
                },
                "application/vnd.ves.encrypted": {
                    source: "iana",
                },
                "application/vnd.vidsoft.vidconference": {
                    source: "iana",
                },
                "application/vnd.visio": {
                    source: "iana",
                    extensions: ["vsd", "vst", "vss", "vsw"],
                },
                "application/vnd.visionary": {
                    source: "iana",
                    extensions: ["vis"],
                },
                "application/vnd.vividence.scriptfile": {
                    source: "iana",
                },
                "application/vnd.vsf": {
                    source: "iana",
                    extensions: ["vsf"],
                },
                "application/vnd.wap.sic": {
                    source: "iana",
                },
                "application/vnd.wap.slc": {
                    source: "iana",
                },
                "application/vnd.wap.wbxml": {
                    source: "iana",
                    charset: "UTF-8",
                    extensions: ["wbxml"],
                },
                "application/vnd.wap.wmlc": {
                    source: "iana",
                    extensions: ["wmlc"],
                },
                "application/vnd.wap.wmlscriptc": {
                    source: "iana",
                    extensions: ["wmlsc"],
                },
                "application/vnd.webturbo": {
                    source: "iana",
                    extensions: ["wtb"],
                },
                "application/vnd.wfa.p2p": {
                    source: "iana",
                },
                "application/vnd.wfa.wsc": {
                    source: "iana",
                },
                "application/vnd.windows.devicepairing": {
                    source: "iana",
                },
                "application/vnd.wmc": {
                    source: "iana",
                },
                "application/vnd.wmf.bootstrap": {
                    source: "iana",
                },
                "application/vnd.wolfram.mathematica": {
                    source: "iana",
                },
                "application/vnd.wolfram.mathematica.package": {
                    source: "iana",
                },
                "application/vnd.wolfram.player": {
                    source: "iana",
                    extensions: ["nbp"],
                },
                "application/vnd.wordperfect": {
                    source: "iana",
                    extensions: ["wpd"],
                },
                "application/vnd.wqd": {
                    source: "iana",
                    extensions: ["wqd"],
                },
                "application/vnd.wrq-hp3000-labelled": {
                    source: "iana",
                },
                "application/vnd.wt.stf": {
                    source: "iana",
                    extensions: ["stf"],
                },
                "application/vnd.wv.csp+wbxml": {
                    source: "iana",
                },
                "application/vnd.wv.csp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.wv.ssp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.xacml+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.xara": {
                    source: "iana",
                    extensions: ["xar"],
                },
                "application/vnd.xfdl": {
                    source: "iana",
                    extensions: ["xfdl"],
                },
                "application/vnd.xfdl.webform": {
                    source: "iana",
                },
                "application/vnd.xmi+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/vnd.xmpie.cpkg": {
                    source: "iana",
                },
                "application/vnd.xmpie.dpkg": {
                    source: "iana",
                },
                "application/vnd.xmpie.plan": {
                    source: "iana",
                },
                "application/vnd.xmpie.ppkg": {
                    source: "iana",
                },
                "application/vnd.xmpie.xlim": {
                    source: "iana",
                },
                "application/vnd.yamaha.hv-dic": {
                    source: "iana",
                    extensions: ["hvd"],
                },
                "application/vnd.yamaha.hv-script": {
                    source: "iana",
                    extensions: ["hvs"],
                },
                "application/vnd.yamaha.hv-voice": {
                    source: "iana",
                    extensions: ["hvp"],
                },
                "application/vnd.yamaha.openscoreformat": {
                    source: "iana",
                    extensions: ["osf"],
                },
                "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["osfpvg"],
                },
                "application/vnd.yamaha.remote-setup": {
                    source: "iana",
                },
                "application/vnd.yamaha.smaf-audio": {
                    source: "iana",
                    extensions: ["saf"],
                },
                "application/vnd.yamaha.smaf-phrase": {
                    source: "iana",
                    extensions: ["spf"],
                },
                "application/vnd.yamaha.through-ngn": {
                    source: "iana",
                },
                "application/vnd.yamaha.tunnel-udpencap": {
                    source: "iana",
                },
                "application/vnd.yaoweme": {
                    source: "iana",
                },
                "application/vnd.yellowriver-custom-menu": {
                    source: "iana",
                    extensions: ["cmp"],
                },
                "application/vnd.youtube.yt": {
                    source: "iana",
                },
                "application/vnd.zul": {
                    source: "iana",
                    extensions: ["zir", "zirz"],
                },
                "application/vnd.zzazz.deck+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["zaz"],
                },
                "application/voicexml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["vxml"],
                },
                "application/voucher-cms+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/vq-rtcpxr": {
                    source: "iana",
                },
                "application/wasm": {
                    compressible: true,
                    extensions: ["wasm"],
                },
                "application/watcherinfo+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/webpush-options+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/whoispp-query": {
                    source: "iana",
                },
                "application/whoispp-response": {
                    source: "iana",
                },
                "application/widget": {
                    source: "iana",
                    extensions: ["wgt"],
                },
                "application/winhlp": {
                    source: "apache",
                    extensions: ["hlp"],
                },
                "application/wita": {
                    source: "iana",
                },
                "application/wordperfect5.1": {
                    source: "iana",
                },
                "application/wsdl+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["wsdl"],
                },
                "application/wspolicy+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["wspolicy"],
                },
                "application/x-7z-compressed": {
                    source: "apache",
                    compressible: false,
                    extensions: ["7z"],
                },
                "application/x-abiword": {
                    source: "apache",
                    extensions: ["abw"],
                },
                "application/x-ace-compressed": {
                    source: "apache",
                    extensions: ["ace"],
                },
                "application/x-amf": {
                    source: "apache",
                },
                "application/x-apple-diskimage": {
                    source: "apache",
                    extensions: ["dmg"],
                },
                "application/x-arj": {
                    compressible: false,
                    extensions: ["arj"],
                },
                "application/x-authorware-bin": {
                    source: "apache",
                    extensions: ["aab", "x32", "u32", "vox"],
                },
                "application/x-authorware-map": {
                    source: "apache",
                    extensions: ["aam"],
                },
                "application/x-authorware-seg": {
                    source: "apache",
                    extensions: ["aas"],
                },
                "application/x-bcpio": {
                    source: "apache",
                    extensions: ["bcpio"],
                },
                "application/x-bdoc": {
                    compressible: false,
                    extensions: ["bdoc"],
                },
                "application/x-bittorrent": {
                    source: "apache",
                    extensions: ["torrent"],
                },
                "application/x-blorb": {
                    source: "apache",
                    extensions: ["blb", "blorb"],
                },
                "application/x-bzip": {
                    source: "apache",
                    compressible: false,
                    extensions: ["bz"],
                },
                "application/x-bzip2": {
                    source: "apache",
                    compressible: false,
                    extensions: ["bz2", "boz"],
                },
                "application/x-cbr": {
                    source: "apache",
                    extensions: ["cbr", "cba", "cbt", "cbz", "cb7"],
                },
                "application/x-cdlink": {
                    source: "apache",
                    extensions: ["vcd"],
                },
                "application/x-cfs-compressed": {
                    source: "apache",
                    extensions: ["cfs"],
                },
                "application/x-chat": {
                    source: "apache",
                    extensions: ["chat"],
                },
                "application/x-chess-pgn": {
                    source: "apache",
                    extensions: ["pgn"],
                },
                "application/x-chrome-extension": {
                    extensions: ["crx"],
                },
                "application/x-cocoa": {
                    source: "nginx",
                    extensions: ["cco"],
                },
                "application/x-compress": {
                    source: "apache",
                },
                "application/x-conference": {
                    source: "apache",
                    extensions: ["nsc"],
                },
                "application/x-cpio": {
                    source: "apache",
                    extensions: ["cpio"],
                },
                "application/x-csh": {
                    source: "apache",
                    extensions: ["csh"],
                },
                "application/x-deb": {
                    compressible: false,
                },
                "application/x-debian-package": {
                    source: "apache",
                    extensions: ["deb", "udeb"],
                },
                "application/x-dgc-compressed": {
                    source: "apache",
                    extensions: ["dgc"],
                },
                "application/x-director": {
                    source: "apache",
                    extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"],
                },
                "application/x-doom": {
                    source: "apache",
                    extensions: ["wad"],
                },
                "application/x-dtbncx+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["ncx"],
                },
                "application/x-dtbook+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["dtb"],
                },
                "application/x-dtbresource+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["res"],
                },
                "application/x-dvi": {
                    source: "apache",
                    compressible: false,
                    extensions: ["dvi"],
                },
                "application/x-envoy": {
                    source: "apache",
                    extensions: ["evy"],
                },
                "application/x-eva": {
                    source: "apache",
                    extensions: ["eva"],
                },
                "application/x-font-bdf": {
                    source: "apache",
                    extensions: ["bdf"],
                },
                "application/x-font-dos": {
                    source: "apache",
                },
                "application/x-font-framemaker": {
                    source: "apache",
                },
                "application/x-font-ghostscript": {
                    source: "apache",
                    extensions: ["gsf"],
                },
                "application/x-font-libgrx": {
                    source: "apache",
                },
                "application/x-font-linux-psf": {
                    source: "apache",
                    extensions: ["psf"],
                },
                "application/x-font-pcf": {
                    source: "apache",
                    extensions: ["pcf"],
                },
                "application/x-font-snf": {
                    source: "apache",
                    extensions: ["snf"],
                },
                "application/x-font-speedo": {
                    source: "apache",
                },
                "application/x-font-sunos-news": {
                    source: "apache",
                },
                "application/x-font-type1": {
                    source: "apache",
                    extensions: ["pfa", "pfb", "pfm", "afm"],
                },
                "application/x-font-vfont": {
                    source: "apache",
                },
                "application/x-freearc": {
                    source: "apache",
                    extensions: ["arc"],
                },
                "application/x-futuresplash": {
                    source: "apache",
                    extensions: ["spl"],
                },
                "application/x-gca-compressed": {
                    source: "apache",
                    extensions: ["gca"],
                },
                "application/x-glulx": {
                    source: "apache",
                    extensions: ["ulx"],
                },
                "application/x-gnumeric": {
                    source: "apache",
                    extensions: ["gnumeric"],
                },
                "application/x-gramps-xml": {
                    source: "apache",
                    extensions: ["gramps"],
                },
                "application/x-gtar": {
                    source: "apache",
                    extensions: ["gtar"],
                },
                "application/x-gzip": {
                    source: "apache",
                },
                "application/x-hdf": {
                    source: "apache",
                    extensions: ["hdf"],
                },
                "application/x-httpd-php": {
                    compressible: true,
                    extensions: ["php"],
                },
                "application/x-install-instructions": {
                    source: "apache",
                    extensions: ["install"],
                },
                "application/x-iso9660-image": {
                    source: "apache",
                    extensions: ["iso"],
                },
                "application/x-java-archive-diff": {
                    source: "nginx",
                    extensions: ["jardiff"],
                },
                "application/x-java-jnlp-file": {
                    source: "apache",
                    compressible: false,
                    extensions: ["jnlp"],
                },
                "application/x-javascript": {
                    compressible: true,
                },
                "application/x-keepass2": {
                    extensions: ["kdbx"],
                },
                "application/x-latex": {
                    source: "apache",
                    compressible: false,
                    extensions: ["latex"],
                },
                "application/x-lua-bytecode": {
                    extensions: ["luac"],
                },
                "application/x-lzh-compressed": {
                    source: "apache",
                    extensions: ["lzh", "lha"],
                },
                "application/x-makeself": {
                    source: "nginx",
                    extensions: ["run"],
                },
                "application/x-mie": {
                    source: "apache",
                    extensions: ["mie"],
                },
                "application/x-mobipocket-ebook": {
                    source: "apache",
                    extensions: ["prc", "mobi"],
                },
                "application/x-mpegurl": {
                    compressible: false,
                },
                "application/x-ms-application": {
                    source: "apache",
                    extensions: ["application"],
                },
                "application/x-ms-shortcut": {
                    source: "apache",
                    extensions: ["lnk"],
                },
                "application/x-ms-wmd": {
                    source: "apache",
                    extensions: ["wmd"],
                },
                "application/x-ms-wmz": {
                    source: "apache",
                    extensions: ["wmz"],
                },
                "application/x-ms-xbap": {
                    source: "apache",
                    extensions: ["xbap"],
                },
                "application/x-msaccess": {
                    source: "apache",
                    extensions: ["mdb"],
                },
                "application/x-msbinder": {
                    source: "apache",
                    extensions: ["obd"],
                },
                "application/x-mscardfile": {
                    source: "apache",
                    extensions: ["crd"],
                },
                "application/x-msclip": {
                    source: "apache",
                    extensions: ["clp"],
                },
                "application/x-msdos-program": {
                    extensions: ["exe"],
                },
                "application/x-msdownload": {
                    source: "apache",
                    extensions: ["exe", "dll", "com", "bat", "msi"],
                },
                "application/x-msmediaview": {
                    source: "apache",
                    extensions: ["mvb", "m13", "m14"],
                },
                "application/x-msmetafile": {
                    source: "apache",
                    extensions: ["wmf", "wmz", "emf", "emz"],
                },
                "application/x-msmoney": {
                    source: "apache",
                    extensions: ["mny"],
                },
                "application/x-mspublisher": {
                    source: "apache",
                    extensions: ["pub"],
                },
                "application/x-msschedule": {
                    source: "apache",
                    extensions: ["scd"],
                },
                "application/x-msterminal": {
                    source: "apache",
                    extensions: ["trm"],
                },
                "application/x-mswrite": {
                    source: "apache",
                    extensions: ["wri"],
                },
                "application/x-netcdf": {
                    source: "apache",
                    extensions: ["nc", "cdf"],
                },
                "application/x-ns-proxy-autoconfig": {
                    compressible: true,
                    extensions: ["pac"],
                },
                "application/x-nzb": {
                    source: "apache",
                    extensions: ["nzb"],
                },
                "application/x-perl": {
                    source: "nginx",
                    extensions: ["pl", "pm"],
                },
                "application/x-pilot": {
                    source: "nginx",
                    extensions: ["prc", "pdb"],
                },
                "application/x-pkcs12": {
                    source: "apache",
                    compressible: false,
                    extensions: ["p12", "pfx"],
                },
                "application/x-pkcs7-certificates": {
                    source: "apache",
                    extensions: ["p7b", "spc"],
                },
                "application/x-pkcs7-certreqresp": {
                    source: "apache",
                    extensions: ["p7r"],
                },
                "application/x-pki-message": {
                    source: "iana",
                },
                "application/x-rar-compressed": {
                    source: "apache",
                    compressible: false,
                    extensions: ["rar"],
                },
                "application/x-redhat-package-manager": {
                    source: "nginx",
                    extensions: ["rpm"],
                },
                "application/x-research-info-systems": {
                    source: "apache",
                    extensions: ["ris"],
                },
                "application/x-sea": {
                    source: "nginx",
                    extensions: ["sea"],
                },
                "application/x-sh": {
                    source: "apache",
                    compressible: true,
                    extensions: ["sh"],
                },
                "application/x-shar": {
                    source: "apache",
                    extensions: ["shar"],
                },
                "application/x-shockwave-flash": {
                    source: "apache",
                    compressible: false,
                    extensions: ["swf"],
                },
                "application/x-silverlight-app": {
                    source: "apache",
                    extensions: ["xap"],
                },
                "application/x-sql": {
                    source: "apache",
                    extensions: ["sql"],
                },
                "application/x-stuffit": {
                    source: "apache",
                    compressible: false,
                    extensions: ["sit"],
                },
                "application/x-stuffitx": {
                    source: "apache",
                    extensions: ["sitx"],
                },
                "application/x-subrip": {
                    source: "apache",
                    extensions: ["srt"],
                },
                "application/x-sv4cpio": {
                    source: "apache",
                    extensions: ["sv4cpio"],
                },
                "application/x-sv4crc": {
                    source: "apache",
                    extensions: ["sv4crc"],
                },
                "application/x-t3vm-image": {
                    source: "apache",
                    extensions: ["t3"],
                },
                "application/x-tads": {
                    source: "apache",
                    extensions: ["gam"],
                },
                "application/x-tar": {
                    source: "apache",
                    compressible: true,
                    extensions: ["tar"],
                },
                "application/x-tcl": {
                    source: "apache",
                    extensions: ["tcl", "tk"],
                },
                "application/x-tex": {
                    source: "apache",
                    extensions: ["tex"],
                },
                "application/x-tex-tfm": {
                    source: "apache",
                    extensions: ["tfm"],
                },
                "application/x-texinfo": {
                    source: "apache",
                    extensions: ["texinfo", "texi"],
                },
                "application/x-tgif": {
                    source: "apache",
                    extensions: ["obj"],
                },
                "application/x-ustar": {
                    source: "apache",
                    extensions: ["ustar"],
                },
                "application/x-virtualbox-hdd": {
                    compressible: true,
                    extensions: ["hdd"],
                },
                "application/x-virtualbox-ova": {
                    compressible: true,
                    extensions: ["ova"],
                },
                "application/x-virtualbox-ovf": {
                    compressible: true,
                    extensions: ["ovf"],
                },
                "application/x-virtualbox-vbox": {
                    compressible: true,
                    extensions: ["vbox"],
                },
                "application/x-virtualbox-vbox-extpack": {
                    compressible: false,
                    extensions: ["vbox-extpack"],
                },
                "application/x-virtualbox-vdi": {
                    compressible: true,
                    extensions: ["vdi"],
                },
                "application/x-virtualbox-vhd": {
                    compressible: true,
                    extensions: ["vhd"],
                },
                "application/x-virtualbox-vmdk": {
                    compressible: true,
                    extensions: ["vmdk"],
                },
                "application/x-wais-source": {
                    source: "apache",
                    extensions: ["src"],
                },
                "application/x-web-app-manifest+json": {
                    compressible: true,
                    extensions: ["webapp"],
                },
                "application/x-www-form-urlencoded": {
                    source: "iana",
                    compressible: true,
                },
                "application/x-x509-ca-cert": {
                    source: "iana",
                    extensions: ["der", "crt", "pem"],
                },
                "application/x-x509-ca-ra-cert": {
                    source: "iana",
                },
                "application/x-x509-next-ca-cert": {
                    source: "iana",
                },
                "application/x-xfig": {
                    source: "apache",
                    extensions: ["fig"],
                },
                "application/x-xliff+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["xlf"],
                },
                "application/x-xpinstall": {
                    source: "apache",
                    compressible: false,
                    extensions: ["xpi"],
                },
                "application/x-xz": {
                    source: "apache",
                    extensions: ["xz"],
                },
                "application/x-zmachine": {
                    source: "apache",
                    extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"],
                },
                "application/x400-bp": {
                    source: "iana",
                },
                "application/xacml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/xaml+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["xaml"],
                },
                "application/xcap-att+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xav"],
                },
                "application/xcap-caps+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xca"],
                },
                "application/xcap-diff+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xdf"],
                },
                "application/xcap-el+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xel"],
                },
                "application/xcap-error+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xer"],
                },
                "application/xcap-ns+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xns"],
                },
                "application/xcon-conference-info+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/xcon-conference-info-diff+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/xenc+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xenc"],
                },
                "application/xhtml+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xhtml", "xht"],
                },
                "application/xhtml-voice+xml": {
                    source: "apache",
                    compressible: true,
                },
                "application/xliff+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xlf"],
                },
                "application/xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xml", "xsl", "xsd", "rng"],
                },
                "application/xml-dtd": {
                    source: "iana",
                    compressible: true,
                    extensions: ["dtd"],
                },
                "application/xml-external-parsed-entity": {
                    source: "iana",
                },
                "application/xml-patch+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/xmpp+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/xop+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xop"],
                },
                "application/xproc+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["xpl"],
                },
                "application/xslt+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xslt"],
                },
                "application/xspf+xml": {
                    source: "apache",
                    compressible: true,
                    extensions: ["xspf"],
                },
                "application/xv+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["mxml", "xhvml", "xvml", "xvm"],
                },
                "application/yang": {
                    source: "iana",
                    extensions: ["yang"],
                },
                "application/yang-data+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/yang-data+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/yang-patch+json": {
                    source: "iana",
                    compressible: true,
                },
                "application/yang-patch+xml": {
                    source: "iana",
                    compressible: true,
                },
                "application/yin+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["yin"],
                },
                "application/zip": {
                    source: "iana",
                    compressible: false,
                    extensions: ["zip"],
                },
                "application/zlib": {
                    source: "iana",
                },
                "application/zstd": {
                    source: "iana",
                },
                "audio/1d-interleaved-parityfec": {
                    source: "iana",
                },
                "audio/32kadpcm": {
                    source: "iana",
                },
                "audio/3gpp": {
                    source: "iana",
                    compressible: false,
                    extensions: ["3gpp"],
                },
                "audio/3gpp2": {
                    source: "iana",
                },
                "audio/aac": {
                    source: "iana",
                },
                "audio/ac3": {
                    source: "iana",
                },
                "audio/adpcm": {
                    source: "apache",
                    extensions: ["adp"],
                },
                "audio/amr": {
                    source: "iana",
                },
                "audio/amr-wb": {
                    source: "iana",
                },
                "audio/amr-wb+": {
                    source: "iana",
                },
                "audio/aptx": {
                    source: "iana",
                },
                "audio/asc": {
                    source: "iana",
                },
                "audio/atrac-advanced-lossless": {
                    source: "iana",
                },
                "audio/atrac-x": {
                    source: "iana",
                },
                "audio/atrac3": {
                    source: "iana",
                },
                "audio/basic": {
                    source: "iana",
                    compressible: false,
                    extensions: ["au", "snd"],
                },
                "audio/bv16": {
                    source: "iana",
                },
                "audio/bv32": {
                    source: "iana",
                },
                "audio/clearmode": {
                    source: "iana",
                },
                "audio/cn": {
                    source: "iana",
                },
                "audio/dat12": {
                    source: "iana",
                },
                "audio/dls": {
                    source: "iana",
                },
                "audio/dsr-es201108": {
                    source: "iana",
                },
                "audio/dsr-es202050": {
                    source: "iana",
                },
                "audio/dsr-es202211": {
                    source: "iana",
                },
                "audio/dsr-es202212": {
                    source: "iana",
                },
                "audio/dv": {
                    source: "iana",
                },
                "audio/dvi4": {
                    source: "iana",
                },
                "audio/eac3": {
                    source: "iana",
                },
                "audio/encaprtp": {
                    source: "iana",
                },
                "audio/evrc": {
                    source: "iana",
                },
                "audio/evrc-qcp": {
                    source: "iana",
                },
                "audio/evrc0": {
                    source: "iana",
                },
                "audio/evrc1": {
                    source: "iana",
                },
                "audio/evrcb": {
                    source: "iana",
                },
                "audio/evrcb0": {
                    source: "iana",
                },
                "audio/evrcb1": {
                    source: "iana",
                },
                "audio/evrcnw": {
                    source: "iana",
                },
                "audio/evrcnw0": {
                    source: "iana",
                },
                "audio/evrcnw1": {
                    source: "iana",
                },
                "audio/evrcwb": {
                    source: "iana",
                },
                "audio/evrcwb0": {
                    source: "iana",
                },
                "audio/evrcwb1": {
                    source: "iana",
                },
                "audio/evs": {
                    source: "iana",
                },
                "audio/flexfec": {
                    source: "iana",
                },
                "audio/fwdred": {
                    source: "iana",
                },
                "audio/g711-0": {
                    source: "iana",
                },
                "audio/g719": {
                    source: "iana",
                },
                "audio/g722": {
                    source: "iana",
                },
                "audio/g7221": {
                    source: "iana",
                },
                "audio/g723": {
                    source: "iana",
                },
                "audio/g726-16": {
                    source: "iana",
                },
                "audio/g726-24": {
                    source: "iana",
                },
                "audio/g726-32": {
                    source: "iana",
                },
                "audio/g726-40": {
                    source: "iana",
                },
                "audio/g728": {
                    source: "iana",
                },
                "audio/g729": {
                    source: "iana",
                },
                "audio/g7291": {
                    source: "iana",
                },
                "audio/g729d": {
                    source: "iana",
                },
                "audio/g729e": {
                    source: "iana",
                },
                "audio/gsm": {
                    source: "iana",
                },
                "audio/gsm-efr": {
                    source: "iana",
                },
                "audio/gsm-hr-08": {
                    source: "iana",
                },
                "audio/ilbc": {
                    source: "iana",
                },
                "audio/ip-mr_v2.5": {
                    source: "iana",
                },
                "audio/isac": {
                    source: "apache",
                },
                "audio/l16": {
                    source: "iana",
                },
                "audio/l20": {
                    source: "iana",
                },
                "audio/l24": {
                    source: "iana",
                    compressible: false,
                },
                "audio/l8": {
                    source: "iana",
                },
                "audio/lpc": {
                    source: "iana",
                },
                "audio/melp": {
                    source: "iana",
                },
                "audio/melp1200": {
                    source: "iana",
                },
                "audio/melp2400": {
                    source: "iana",
                },
                "audio/melp600": {
                    source: "iana",
                },
                "audio/mhas": {
                    source: "iana",
                },
                "audio/midi": {
                    source: "apache",
                    extensions: ["mid", "midi", "kar", "rmi"],
                },
                "audio/mobile-xmf": {
                    source: "iana",
                    extensions: ["mxmf"],
                },
                "audio/mp3": {
                    compressible: false,
                    extensions: ["mp3"],
                },
                "audio/mp4": {
                    source: "iana",
                    compressible: false,
                    extensions: ["m4a", "mp4a"],
                },
                "audio/mp4a-latm": {
                    source: "iana",
                },
                "audio/mpa": {
                    source: "iana",
                },
                "audio/mpa-robust": {
                    source: "iana",
                },
                "audio/mpeg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"],
                },
                "audio/mpeg4-generic": {
                    source: "iana",
                },
                "audio/musepack": {
                    source: "apache",
                },
                "audio/ogg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["oga", "ogg", "spx"],
                },
                "audio/opus": {
                    source: "iana",
                },
                "audio/parityfec": {
                    source: "iana",
                },
                "audio/pcma": {
                    source: "iana",
                },
                "audio/pcma-wb": {
                    source: "iana",
                },
                "audio/pcmu": {
                    source: "iana",
                },
                "audio/pcmu-wb": {
                    source: "iana",
                },
                "audio/prs.sid": {
                    source: "iana",
                },
                "audio/qcelp": {
                    source: "iana",
                },
                "audio/raptorfec": {
                    source: "iana",
                },
                "audio/red": {
                    source: "iana",
                },
                "audio/rtp-enc-aescm128": {
                    source: "iana",
                },
                "audio/rtp-midi": {
                    source: "iana",
                },
                "audio/rtploopback": {
                    source: "iana",
                },
                "audio/rtx": {
                    source: "iana",
                },
                "audio/s3m": {
                    source: "apache",
                    extensions: ["s3m"],
                },
                "audio/silk": {
                    source: "apache",
                    extensions: ["sil"],
                },
                "audio/smv": {
                    source: "iana",
                },
                "audio/smv-qcp": {
                    source: "iana",
                },
                "audio/smv0": {
                    source: "iana",
                },
                "audio/sp-midi": {
                    source: "iana",
                },
                "audio/speex": {
                    source: "iana",
                },
                "audio/t140c": {
                    source: "iana",
                },
                "audio/t38": {
                    source: "iana",
                },
                "audio/telephone-event": {
                    source: "iana",
                },
                "audio/tetra_acelp": {
                    source: "iana",
                },
                "audio/tetra_acelp_bb": {
                    source: "iana",
                },
                "audio/tone": {
                    source: "iana",
                },
                "audio/uemclip": {
                    source: "iana",
                },
                "audio/ulpfec": {
                    source: "iana",
                },
                "audio/usac": {
                    source: "iana",
                },
                "audio/vdvi": {
                    source: "iana",
                },
                "audio/vmr-wb": {
                    source: "iana",
                },
                "audio/vnd.3gpp.iufp": {
                    source: "iana",
                },
                "audio/vnd.4sb": {
                    source: "iana",
                },
                "audio/vnd.audiokoz": {
                    source: "iana",
                },
                "audio/vnd.celp": {
                    source: "iana",
                },
                "audio/vnd.cisco.nse": {
                    source: "iana",
                },
                "audio/vnd.cmles.radio-events": {
                    source: "iana",
                },
                "audio/vnd.cns.anp1": {
                    source: "iana",
                },
                "audio/vnd.cns.inf1": {
                    source: "iana",
                },
                "audio/vnd.dece.audio": {
                    source: "iana",
                    extensions: ["uva", "uvva"],
                },
                "audio/vnd.digital-winds": {
                    source: "iana",
                    extensions: ["eol"],
                },
                "audio/vnd.dlna.adts": {
                    source: "iana",
                },
                "audio/vnd.dolby.heaac.1": {
                    source: "iana",
                },
                "audio/vnd.dolby.heaac.2": {
                    source: "iana",
                },
                "audio/vnd.dolby.mlp": {
                    source: "iana",
                },
                "audio/vnd.dolby.mps": {
                    source: "iana",
                },
                "audio/vnd.dolby.pl2": {
                    source: "iana",
                },
                "audio/vnd.dolby.pl2x": {
                    source: "iana",
                },
                "audio/vnd.dolby.pl2z": {
                    source: "iana",
                },
                "audio/vnd.dolby.pulse.1": {
                    source: "iana",
                },
                "audio/vnd.dra": {
                    source: "iana",
                    extensions: ["dra"],
                },
                "audio/vnd.dts": {
                    source: "iana",
                    extensions: ["dts"],
                },
                "audio/vnd.dts.hd": {
                    source: "iana",
                    extensions: ["dtshd"],
                },
                "audio/vnd.dts.uhd": {
                    source: "iana",
                },
                "audio/vnd.dvb.file": {
                    source: "iana",
                },
                "audio/vnd.everad.plj": {
                    source: "iana",
                },
                "audio/vnd.hns.audio": {
                    source: "iana",
                },
                "audio/vnd.lucent.voice": {
                    source: "iana",
                    extensions: ["lvp"],
                },
                "audio/vnd.ms-playready.media.pya": {
                    source: "iana",
                    extensions: ["pya"],
                },
                "audio/vnd.nokia.mobile-xmf": {
                    source: "iana",
                },
                "audio/vnd.nortel.vbk": {
                    source: "iana",
                },
                "audio/vnd.nuera.ecelp4800": {
                    source: "iana",
                    extensions: ["ecelp4800"],
                },
                "audio/vnd.nuera.ecelp7470": {
                    source: "iana",
                    extensions: ["ecelp7470"],
                },
                "audio/vnd.nuera.ecelp9600": {
                    source: "iana",
                    extensions: ["ecelp9600"],
                },
                "audio/vnd.octel.sbc": {
                    source: "iana",
                },
                "audio/vnd.presonus.multitrack": {
                    source: "iana",
                },
                "audio/vnd.qcelp": {
                    source: "iana",
                },
                "audio/vnd.rhetorex.32kadpcm": {
                    source: "iana",
                },
                "audio/vnd.rip": {
                    source: "iana",
                    extensions: ["rip"],
                },
                "audio/vnd.rn-realaudio": {
                    compressible: false,
                },
                "audio/vnd.sealedmedia.softseal.mpeg": {
                    source: "iana",
                },
                "audio/vnd.vmx.cvsd": {
                    source: "iana",
                },
                "audio/vnd.wave": {
                    compressible: false,
                },
                "audio/vorbis": {
                    source: "iana",
                    compressible: false,
                },
                "audio/vorbis-config": {
                    source: "iana",
                },
                "audio/wav": {
                    compressible: false,
                    extensions: ["wav"],
                },
                "audio/wave": {
                    compressible: false,
                    extensions: ["wav"],
                },
                "audio/webm": {
                    source: "apache",
                    compressible: false,
                    extensions: ["weba"],
                },
                "audio/x-aac": {
                    source: "apache",
                    compressible: false,
                    extensions: ["aac"],
                },
                "audio/x-aiff": {
                    source: "apache",
                    extensions: ["aif", "aiff", "aifc"],
                },
                "audio/x-caf": {
                    source: "apache",
                    compressible: false,
                    extensions: ["caf"],
                },
                "audio/x-flac": {
                    source: "apache",
                    extensions: ["flac"],
                },
                "audio/x-m4a": {
                    source: "nginx",
                    extensions: ["m4a"],
                },
                "audio/x-matroska": {
                    source: "apache",
                    extensions: ["mka"],
                },
                "audio/x-mpegurl": {
                    source: "apache",
                    extensions: ["m3u"],
                },
                "audio/x-ms-wax": {
                    source: "apache",
                    extensions: ["wax"],
                },
                "audio/x-ms-wma": {
                    source: "apache",
                    extensions: ["wma"],
                },
                "audio/x-pn-realaudio": {
                    source: "apache",
                    extensions: ["ram", "ra"],
                },
                "audio/x-pn-realaudio-plugin": {
                    source: "apache",
                    extensions: ["rmp"],
                },
                "audio/x-realaudio": {
                    source: "nginx",
                    extensions: ["ra"],
                },
                "audio/x-tta": {
                    source: "apache",
                },
                "audio/x-wav": {
                    source: "apache",
                    extensions: ["wav"],
                },
                "audio/xm": {
                    source: "apache",
                    extensions: ["xm"],
                },
                "chemical/x-cdx": {
                    source: "apache",
                    extensions: ["cdx"],
                },
                "chemical/x-cif": {
                    source: "apache",
                    extensions: ["cif"],
                },
                "chemical/x-cmdf": {
                    source: "apache",
                    extensions: ["cmdf"],
                },
                "chemical/x-cml": {
                    source: "apache",
                    extensions: ["cml"],
                },
                "chemical/x-csml": {
                    source: "apache",
                    extensions: ["csml"],
                },
                "chemical/x-pdb": {
                    source: "apache",
                },
                "chemical/x-xyz": {
                    source: "apache",
                    extensions: ["xyz"],
                },
                "font/collection": {
                    source: "iana",
                    extensions: ["ttc"],
                },
                "font/otf": {
                    source: "iana",
                    compressible: true,
                    extensions: ["otf"],
                },
                "font/sfnt": {
                    source: "iana",
                },
                "font/ttf": {
                    source: "iana",
                    compressible: true,
                    extensions: ["ttf"],
                },
                "font/woff": {
                    source: "iana",
                    extensions: ["woff"],
                },
                "font/woff2": {
                    source: "iana",
                    extensions: ["woff2"],
                },
                "image/aces": {
                    source: "iana",
                    extensions: ["exr"],
                },
                "image/apng": {
                    compressible: false,
                    extensions: ["apng"],
                },
                "image/avci": {
                    source: "iana",
                },
                "image/avcs": {
                    source: "iana",
                },
                "image/bmp": {
                    source: "iana",
                    compressible: true,
                    extensions: ["bmp"],
                },
                "image/cgm": {
                    source: "iana",
                    extensions: ["cgm"],
                },
                "image/dicom-rle": {
                    source: "iana",
                    extensions: ["drle"],
                },
                "image/emf": {
                    source: "iana",
                    extensions: ["emf"],
                },
                "image/fits": {
                    source: "iana",
                    extensions: ["fits"],
                },
                "image/g3fax": {
                    source: "iana",
                    extensions: ["g3"],
                },
                "image/gif": {
                    source: "iana",
                    compressible: false,
                    extensions: ["gif"],
                },
                "image/heic": {
                    source: "iana",
                    extensions: ["heic"],
                },
                "image/heic-sequence": {
                    source: "iana",
                    extensions: ["heics"],
                },
                "image/heif": {
                    source: "iana",
                    extensions: ["heif"],
                },
                "image/heif-sequence": {
                    source: "iana",
                    extensions: ["heifs"],
                },
                "image/hej2k": {
                    source: "iana",
                    extensions: ["hej2"],
                },
                "image/hsj2": {
                    source: "iana",
                    extensions: ["hsj2"],
                },
                "image/ief": {
                    source: "iana",
                    extensions: ["ief"],
                },
                "image/jls": {
                    source: "iana",
                    extensions: ["jls"],
                },
                "image/jp2": {
                    source: "iana",
                    compressible: false,
                    extensions: ["jp2", "jpg2"],
                },
                "image/jpeg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["jpeg", "jpg", "jpe"],
                },
                "image/jph": {
                    source: "iana",
                    extensions: ["jph"],
                },
                "image/jphc": {
                    source: "iana",
                    extensions: ["jhc"],
                },
                "image/jpm": {
                    source: "iana",
                    compressible: false,
                    extensions: ["jpm"],
                },
                "image/jpx": {
                    source: "iana",
                    compressible: false,
                    extensions: ["jpx", "jpf"],
                },
                "image/jxr": {
                    source: "iana",
                    extensions: ["jxr"],
                },
                "image/jxra": {
                    source: "iana",
                    extensions: ["jxra"],
                },
                "image/jxrs": {
                    source: "iana",
                    extensions: ["jxrs"],
                },
                "image/jxs": {
                    source: "iana",
                    extensions: ["jxs"],
                },
                "image/jxsc": {
                    source: "iana",
                    extensions: ["jxsc"],
                },
                "image/jxsi": {
                    source: "iana",
                    extensions: ["jxsi"],
                },
                "image/jxss": {
                    source: "iana",
                    extensions: ["jxss"],
                },
                "image/ktx": {
                    source: "iana",
                    extensions: ["ktx"],
                },
                "image/naplps": {
                    source: "iana",
                },
                "image/pjpeg": {
                    compressible: false,
                },
                "image/png": {
                    source: "iana",
                    compressible: false,
                    extensions: ["png"],
                },
                "image/prs.btif": {
                    source: "iana",
                    extensions: ["btif"],
                },
                "image/prs.pti": {
                    source: "iana",
                    extensions: ["pti"],
                },
                "image/pwg-raster": {
                    source: "iana",
                },
                "image/sgi": {
                    source: "apache",
                    extensions: ["sgi"],
                },
                "image/svg+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["svg", "svgz"],
                },
                "image/t38": {
                    source: "iana",
                    extensions: ["t38"],
                },
                "image/tiff": {
                    source: "iana",
                    compressible: false,
                    extensions: ["tif", "tiff"],
                },
                "image/tiff-fx": {
                    source: "iana",
                    extensions: ["tfx"],
                },
                "image/vnd.adobe.photoshop": {
                    source: "iana",
                    compressible: true,
                    extensions: ["psd"],
                },
                "image/vnd.airzip.accelerator.azv": {
                    source: "iana",
                    extensions: ["azv"],
                },
                "image/vnd.cns.inf2": {
                    source: "iana",
                },
                "image/vnd.dece.graphic": {
                    source: "iana",
                    extensions: ["uvi", "uvvi", "uvg", "uvvg"],
                },
                "image/vnd.djvu": {
                    source: "iana",
                    extensions: ["djvu", "djv"],
                },
                "image/vnd.dvb.subtitle": {
                    source: "iana",
                    extensions: ["sub"],
                },
                "image/vnd.dwg": {
                    source: "iana",
                    extensions: ["dwg"],
                },
                "image/vnd.dxf": {
                    source: "iana",
                    extensions: ["dxf"],
                },
                "image/vnd.fastbidsheet": {
                    source: "iana",
                    extensions: ["fbs"],
                },
                "image/vnd.fpx": {
                    source: "iana",
                    extensions: ["fpx"],
                },
                "image/vnd.fst": {
                    source: "iana",
                    extensions: ["fst"],
                },
                "image/vnd.fujixerox.edmics-mmr": {
                    source: "iana",
                    extensions: ["mmr"],
                },
                "image/vnd.fujixerox.edmics-rlc": {
                    source: "iana",
                    extensions: ["rlc"],
                },
                "image/vnd.globalgraphics.pgb": {
                    source: "iana",
                },
                "image/vnd.microsoft.icon": {
                    source: "iana",
                    extensions: ["ico"],
                },
                "image/vnd.mix": {
                    source: "iana",
                },
                "image/vnd.mozilla.apng": {
                    source: "iana",
                },
                "image/vnd.ms-dds": {
                    extensions: ["dds"],
                },
                "image/vnd.ms-modi": {
                    source: "iana",
                    extensions: ["mdi"],
                },
                "image/vnd.ms-photo": {
                    source: "apache",
                    extensions: ["wdp"],
                },
                "image/vnd.net-fpx": {
                    source: "iana",
                    extensions: ["npx"],
                },
                "image/vnd.radiance": {
                    source: "iana",
                },
                "image/vnd.sealed.png": {
                    source: "iana",
                },
                "image/vnd.sealedmedia.softseal.gif": {
                    source: "iana",
                },
                "image/vnd.sealedmedia.softseal.jpg": {
                    source: "iana",
                },
                "image/vnd.svf": {
                    source: "iana",
                },
                "image/vnd.tencent.tap": {
                    source: "iana",
                    extensions: ["tap"],
                },
                "image/vnd.valve.source.texture": {
                    source: "iana",
                    extensions: ["vtf"],
                },
                "image/vnd.wap.wbmp": {
                    source: "iana",
                    extensions: ["wbmp"],
                },
                "image/vnd.xiff": {
                    source: "iana",
                    extensions: ["xif"],
                },
                "image/vnd.zbrush.pcx": {
                    source: "iana",
                    extensions: ["pcx"],
                },
                "image/webp": {
                    source: "apache",
                    extensions: ["webp"],
                },
                "image/wmf": {
                    source: "iana",
                    extensions: ["wmf"],
                },
                "image/x-3ds": {
                    source: "apache",
                    extensions: ["3ds"],
                },
                "image/x-cmu-raster": {
                    source: "apache",
                    extensions: ["ras"],
                },
                "image/x-cmx": {
                    source: "apache",
                    extensions: ["cmx"],
                },
                "image/x-freehand": {
                    source: "apache",
                    extensions: ["fh", "fhc", "fh4", "fh5", "fh7"],
                },
                "image/x-icon": {
                    source: "apache",
                    compressible: true,
                    extensions: ["ico"],
                },
                "image/x-jng": {
                    source: "nginx",
                    extensions: ["jng"],
                },
                "image/x-mrsid-image": {
                    source: "apache",
                    extensions: ["sid"],
                },
                "image/x-ms-bmp": {
                    source: "nginx",
                    compressible: true,
                    extensions: ["bmp"],
                },
                "image/x-pcx": {
                    source: "apache",
                    extensions: ["pcx"],
                },
                "image/x-pict": {
                    source: "apache",
                    extensions: ["pic", "pct"],
                },
                "image/x-portable-anymap": {
                    source: "apache",
                    extensions: ["pnm"],
                },
                "image/x-portable-bitmap": {
                    source: "apache",
                    extensions: ["pbm"],
                },
                "image/x-portable-graymap": {
                    source: "apache",
                    extensions: ["pgm"],
                },
                "image/x-portable-pixmap": {
                    source: "apache",
                    extensions: ["ppm"],
                },
                "image/x-rgb": {
                    source: "apache",
                    extensions: ["rgb"],
                },
                "image/x-tga": {
                    source: "apache",
                    extensions: ["tga"],
                },
                "image/x-xbitmap": {
                    source: "apache",
                    extensions: ["xbm"],
                },
                "image/x-xcf": {
                    compressible: false,
                },
                "image/x-xpixmap": {
                    source: "apache",
                    extensions: ["xpm"],
                },
                "image/x-xwindowdump": {
                    source: "apache",
                    extensions: ["xwd"],
                },
                "message/cpim": {
                    source: "iana",
                },
                "message/delivery-status": {
                    source: "iana",
                },
                "message/disposition-notification": {
                    source: "iana",
                    extensions: ["disposition-notification"],
                },
                "message/external-body": {
                    source: "iana",
                },
                "message/feedback-report": {
                    source: "iana",
                },
                "message/global": {
                    source: "iana",
                    extensions: ["u8msg"],
                },
                "message/global-delivery-status": {
                    source: "iana",
                    extensions: ["u8dsn"],
                },
                "message/global-disposition-notification": {
                    source: "iana",
                    extensions: ["u8mdn"],
                },
                "message/global-headers": {
                    source: "iana",
                    extensions: ["u8hdr"],
                },
                "message/http": {
                    source: "iana",
                    compressible: false,
                },
                "message/imdn+xml": {
                    source: "iana",
                    compressible: true,
                },
                "message/news": {
                    source: "iana",
                },
                "message/partial": {
                    source: "iana",
                    compressible: false,
                },
                "message/rfc822": {
                    source: "iana",
                    compressible: true,
                    extensions: ["eml", "mime"],
                },
                "message/s-http": {
                    source: "iana",
                },
                "message/sip": {
                    source: "iana",
                },
                "message/sipfrag": {
                    source: "iana",
                },
                "message/tracking-status": {
                    source: "iana",
                },
                "message/vnd.si.simp": {
                    source: "iana",
                },
                "message/vnd.wfa.wsc": {
                    source: "iana",
                    extensions: ["wsc"],
                },
                "model/3mf": {
                    source: "iana",
                    extensions: ["3mf"],
                },
                "model/gltf+json": {
                    source: "iana",
                    compressible: true,
                    extensions: ["gltf"],
                },
                "model/gltf-binary": {
                    source: "iana",
                    compressible: true,
                    extensions: ["glb"],
                },
                "model/iges": {
                    source: "iana",
                    compressible: false,
                    extensions: ["igs", "iges"],
                },
                "model/mesh": {
                    source: "iana",
                    compressible: false,
                    extensions: ["msh", "mesh", "silo"],
                },
                "model/mtl": {
                    source: "iana",
                    extensions: ["mtl"],
                },
                "model/obj": {
                    source: "iana",
                    extensions: ["obj"],
                },
                "model/stl": {
                    source: "iana",
                    extensions: ["stl"],
                },
                "model/vnd.collada+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["dae"],
                },
                "model/vnd.dwf": {
                    source: "iana",
                    extensions: ["dwf"],
                },
                "model/vnd.flatland.3dml": {
                    source: "iana",
                },
                "model/vnd.gdl": {
                    source: "iana",
                    extensions: ["gdl"],
                },
                "model/vnd.gs-gdl": {
                    source: "apache",
                },
                "model/vnd.gs.gdl": {
                    source: "iana",
                },
                "model/vnd.gtw": {
                    source: "iana",
                    extensions: ["gtw"],
                },
                "model/vnd.moml+xml": {
                    source: "iana",
                    compressible: true,
                },
                "model/vnd.mts": {
                    source: "iana",
                    extensions: ["mts"],
                },
                "model/vnd.opengex": {
                    source: "iana",
                    extensions: ["ogex"],
                },
                "model/vnd.parasolid.transmit.binary": {
                    source: "iana",
                    extensions: ["x_b"],
                },
                "model/vnd.parasolid.transmit.text": {
                    source: "iana",
                    extensions: ["x_t"],
                },
                "model/vnd.rosette.annotated-data-model": {
                    source: "iana",
                },
                "model/vnd.usdz+zip": {
                    source: "iana",
                    compressible: false,
                    extensions: ["usdz"],
                },
                "model/vnd.valve.source.compiled-map": {
                    source: "iana",
                    extensions: ["bsp"],
                },
                "model/vnd.vtu": {
                    source: "iana",
                    extensions: ["vtu"],
                },
                "model/vrml": {
                    source: "iana",
                    compressible: false,
                    extensions: ["wrl", "vrml"],
                },
                "model/x3d+binary": {
                    source: "apache",
                    compressible: false,
                    extensions: ["x3db", "x3dbz"],
                },
                "model/x3d+fastinfoset": {
                    source: "iana",
                    extensions: ["x3db"],
                },
                "model/x3d+vrml": {
                    source: "apache",
                    compressible: false,
                    extensions: ["x3dv", "x3dvz"],
                },
                "model/x3d+xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["x3d", "x3dz"],
                },
                "model/x3d-vrml": {
                    source: "iana",
                    extensions: ["x3dv"],
                },
                "multipart/alternative": {
                    source: "iana",
                    compressible: false,
                },
                "multipart/appledouble": {
                    source: "iana",
                },
                "multipart/byteranges": {
                    source: "iana",
                },
                "multipart/digest": {
                    source: "iana",
                },
                "multipart/encrypted": {
                    source: "iana",
                    compressible: false,
                },
                "multipart/form-data": {
                    source: "iana",
                    compressible: false,
                },
                "multipart/header-set": {
                    source: "iana",
                },
                "multipart/mixed": {
                    source: "iana",
                },
                "multipart/multilingual": {
                    source: "iana",
                },
                "multipart/parallel": {
                    source: "iana",
                },
                "multipart/related": {
                    source: "iana",
                    compressible: false,
                },
                "multipart/report": {
                    source: "iana",
                },
                "multipart/signed": {
                    source: "iana",
                    compressible: false,
                },
                "multipart/vnd.bint.med-plus": {
                    source: "iana",
                },
                "multipart/voice-message": {
                    source: "iana",
                },
                "multipart/x-mixed-replace": {
                    source: "iana",
                },
                "text/1d-interleaved-parityfec": {
                    source: "iana",
                },
                "text/cache-manifest": {
                    source: "iana",
                    compressible: true,
                    extensions: ["appcache", "manifest"],
                },
                "text/calendar": {
                    source: "iana",
                    extensions: ["ics", "ifb"],
                },
                "text/calender": {
                    compressible: true,
                },
                "text/cmd": {
                    compressible: true,
                },
                "text/coffeescript": {
                    extensions: ["coffee", "litcoffee"],
                },
                "text/css": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["css"],
                },
                "text/csv": {
                    source: "iana",
                    compressible: true,
                    extensions: ["csv"],
                },
                "text/csv-schema": {
                    source: "iana",
                },
                "text/directory": {
                    source: "iana",
                },
                "text/dns": {
                    source: "iana",
                },
                "text/ecmascript": {
                    source: "iana",
                },
                "text/encaprtp": {
                    source: "iana",
                },
                "text/enriched": {
                    source: "iana",
                },
                "text/flexfec": {
                    source: "iana",
                },
                "text/fwdred": {
                    source: "iana",
                },
                "text/grammar-ref-list": {
                    source: "iana",
                },
                "text/html": {
                    source: "iana",
                    compressible: true,
                    extensions: ["html", "htm", "shtml"],
                },
                "text/jade": {
                    extensions: ["jade"],
                },
                "text/javascript": {
                    source: "iana",
                    compressible: true,
                },
                "text/jcr-cnd": {
                    source: "iana",
                },
                "text/jsx": {
                    compressible: true,
                    extensions: ["jsx"],
                },
                "text/less": {
                    compressible: true,
                    extensions: ["less"],
                },
                "text/markdown": {
                    source: "iana",
                    compressible: true,
                    extensions: ["markdown", "md"],
                },
                "text/mathml": {
                    source: "nginx",
                    extensions: ["mml"],
                },
                "text/mdx": {
                    compressible: true,
                    extensions: ["mdx"],
                },
                "text/mizar": {
                    source: "iana",
                },
                "text/n3": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["n3"],
                },
                "text/parameters": {
                    source: "iana",
                    charset: "UTF-8",
                },
                "text/parityfec": {
                    source: "iana",
                },
                "text/plain": {
                    source: "iana",
                    compressible: true,
                    extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"],
                },
                "text/provenance-notation": {
                    source: "iana",
                    charset: "UTF-8",
                },
                "text/prs.fallenstein.rst": {
                    source: "iana",
                },
                "text/prs.lines.tag": {
                    source: "iana",
                    extensions: ["dsc"],
                },
                "text/prs.prop.logic": {
                    source: "iana",
                },
                "text/raptorfec": {
                    source: "iana",
                },
                "text/red": {
                    source: "iana",
                },
                "text/rfc822-headers": {
                    source: "iana",
                },
                "text/richtext": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rtx"],
                },
                "text/rtf": {
                    source: "iana",
                    compressible: true,
                    extensions: ["rtf"],
                },
                "text/rtp-enc-aescm128": {
                    source: "iana",
                },
                "text/rtploopback": {
                    source: "iana",
                },
                "text/rtx": {
                    source: "iana",
                },
                "text/sgml": {
                    source: "iana",
                    extensions: ["sgml", "sgm"],
                },
                "text/shex": {
                    extensions: ["shex"],
                },
                "text/slim": {
                    extensions: ["slim", "slm"],
                },
                "text/strings": {
                    source: "iana",
                },
                "text/stylus": {
                    extensions: ["stylus", "styl"],
                },
                "text/t140": {
                    source: "iana",
                },
                "text/tab-separated-values": {
                    source: "iana",
                    compressible: true,
                    extensions: ["tsv"],
                },
                "text/troff": {
                    source: "iana",
                    extensions: ["t", "tr", "roff", "man", "me", "ms"],
                },
                "text/turtle": {
                    source: "iana",
                    charset: "UTF-8",
                    extensions: ["ttl"],
                },
                "text/ulpfec": {
                    source: "iana",
                },
                "text/uri-list": {
                    source: "iana",
                    compressible: true,
                    extensions: ["uri", "uris", "urls"],
                },
                "text/vcard": {
                    source: "iana",
                    compressible: true,
                    extensions: ["vcard"],
                },
                "text/vnd.a": {
                    source: "iana",
                },
                "text/vnd.abc": {
                    source: "iana",
                },
                "text/vnd.ascii-art": {
                    source: "iana",
                },
                "text/vnd.curl": {
                    source: "iana",
                    extensions: ["curl"],
                },
                "text/vnd.curl.dcurl": {
                    source: "apache",
                    extensions: ["dcurl"],
                },
                "text/vnd.curl.mcurl": {
                    source: "apache",
                    extensions: ["mcurl"],
                },
                "text/vnd.curl.scurl": {
                    source: "apache",
                    extensions: ["scurl"],
                },
                "text/vnd.debian.copyright": {
                    source: "iana",
                    charset: "UTF-8",
                },
                "text/vnd.dmclientscript": {
                    source: "iana",
                },
                "text/vnd.dvb.subtitle": {
                    source: "iana",
                    extensions: ["sub"],
                },
                "text/vnd.esmertec.theme-descriptor": {
                    source: "iana",
                    charset: "UTF-8",
                },
                "text/vnd.ficlab.flt": {
                    source: "iana",
                },
                "text/vnd.fly": {
                    source: "iana",
                    extensions: ["fly"],
                },
                "text/vnd.fmi.flexstor": {
                    source: "iana",
                    extensions: ["flx"],
                },
                "text/vnd.gml": {
                    source: "iana",
                },
                "text/vnd.graphviz": {
                    source: "iana",
                    extensions: ["gv"],
                },
                "text/vnd.hgl": {
                    source: "iana",
                },
                "text/vnd.in3d.3dml": {
                    source: "iana",
                    extensions: ["3dml"],
                },
                "text/vnd.in3d.spot": {
                    source: "iana",
                    extensions: ["spot"],
                },
                "text/vnd.iptc.newsml": {
                    source: "iana",
                },
                "text/vnd.iptc.nitf": {
                    source: "iana",
                },
                "text/vnd.latex-z": {
                    source: "iana",
                },
                "text/vnd.motorola.reflex": {
                    source: "iana",
                },
                "text/vnd.ms-mediapackage": {
                    source: "iana",
                },
                "text/vnd.net2phone.commcenter.command": {
                    source: "iana",
                },
                "text/vnd.radisys.msml-basic-layout": {
                    source: "iana",
                },
                "text/vnd.senx.warpscript": {
                    source: "iana",
                },
                "text/vnd.si.uricatalogue": {
                    source: "iana",
                },
                "text/vnd.sosi": {
                    source: "iana",
                },
                "text/vnd.sun.j2me.app-descriptor": {
                    source: "iana",
                    charset: "UTF-8",
                    extensions: ["jad"],
                },
                "text/vnd.trolltech.linguist": {
                    source: "iana",
                    charset: "UTF-8",
                },
                "text/vnd.wap.si": {
                    source: "iana",
                },
                "text/vnd.wap.sl": {
                    source: "iana",
                },
                "text/vnd.wap.wml": {
                    source: "iana",
                    extensions: ["wml"],
                },
                "text/vnd.wap.wmlscript": {
                    source: "iana",
                    extensions: ["wmls"],
                },
                "text/vtt": {
                    source: "iana",
                    charset: "UTF-8",
                    compressible: true,
                    extensions: ["vtt"],
                },
                "text/x-asm": {
                    source: "apache",
                    extensions: ["s", "asm"],
                },
                "text/x-c": {
                    source: "apache",
                    extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"],
                },
                "text/x-component": {
                    source: "nginx",
                    extensions: ["htc"],
                },
                "text/x-fortran": {
                    source: "apache",
                    extensions: ["f", "for", "f77", "f90"],
                },
                "text/x-gwt-rpc": {
                    compressible: true,
                },
                "text/x-handlebars-template": {
                    extensions: ["hbs"],
                },
                "text/x-java-source": {
                    source: "apache",
                    extensions: ["java"],
                },
                "text/x-jquery-tmpl": {
                    compressible: true,
                },
                "text/x-lua": {
                    extensions: ["lua"],
                },
                "text/x-markdown": {
                    compressible: true,
                    extensions: ["mkd"],
                },
                "text/x-nfo": {
                    source: "apache",
                    extensions: ["nfo"],
                },
                "text/x-opml": {
                    source: "apache",
                    extensions: ["opml"],
                },
                "text/x-org": {
                    compressible: true,
                    extensions: ["org"],
                },
                "text/x-pascal": {
                    source: "apache",
                    extensions: ["p", "pas"],
                },
                "text/x-processing": {
                    compressible: true,
                    extensions: ["pde"],
                },
                "text/x-sass": {
                    extensions: ["sass"],
                },
                "text/x-scss": {
                    extensions: ["scss"],
                },
                "text/x-setext": {
                    source: "apache",
                    extensions: ["etx"],
                },
                "text/x-sfv": {
                    source: "apache",
                    extensions: ["sfv"],
                },
                "text/x-suse-ymp": {
                    compressible: true,
                    extensions: ["ymp"],
                },
                "text/x-uuencode": {
                    source: "apache",
                    extensions: ["uu"],
                },
                "text/x-vcalendar": {
                    source: "apache",
                    extensions: ["vcs"],
                },
                "text/x-vcard": {
                    source: "apache",
                    extensions: ["vcf"],
                },
                "text/xml": {
                    source: "iana",
                    compressible: true,
                    extensions: ["xml"],
                },
                "text/xml-external-parsed-entity": {
                    source: "iana",
                },
                "text/yaml": {
                    extensions: ["yaml", "yml"],
                },
                "video/1d-interleaved-parityfec": {
                    source: "iana",
                },
                "video/3gpp": {
                    source: "iana",
                    extensions: ["3gp", "3gpp"],
                },
                "video/3gpp-tt": {
                    source: "iana",
                },
                "video/3gpp2": {
                    source: "iana",
                    extensions: ["3g2"],
                },
                "video/bmpeg": {
                    source: "iana",
                },
                "video/bt656": {
                    source: "iana",
                },
                "video/celb": {
                    source: "iana",
                },
                "video/dv": {
                    source: "iana",
                },
                "video/encaprtp": {
                    source: "iana",
                },
                "video/flexfec": {
                    source: "iana",
                },
                "video/h261": {
                    source: "iana",
                    extensions: ["h261"],
                },
                "video/h263": {
                    source: "iana",
                    extensions: ["h263"],
                },
                "video/h263-1998": {
                    source: "iana",
                },
                "video/h263-2000": {
                    source: "iana",
                },
                "video/h264": {
                    source: "iana",
                    extensions: ["h264"],
                },
                "video/h264-rcdo": {
                    source: "iana",
                },
                "video/h264-svc": {
                    source: "iana",
                },
                "video/h265": {
                    source: "iana",
                },
                "video/iso.segment": {
                    source: "iana",
                },
                "video/jpeg": {
                    source: "iana",
                    extensions: ["jpgv"],
                },
                "video/jpeg2000": {
                    source: "iana",
                },
                "video/jpm": {
                    source: "apache",
                    extensions: ["jpm", "jpgm"],
                },
                "video/mj2": {
                    source: "iana",
                    extensions: ["mj2", "mjp2"],
                },
                "video/mp1s": {
                    source: "iana",
                },
                "video/mp2p": {
                    source: "iana",
                },
                "video/mp2t": {
                    source: "iana",
                    extensions: ["ts"],
                },
                "video/mp4": {
                    source: "iana",
                    compressible: false,
                    extensions: ["mp4", "mp4v", "mpg4"],
                },
                "video/mp4v-es": {
                    source: "iana",
                },
                "video/mpeg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"],
                },
                "video/mpeg4-generic": {
                    source: "iana",
                },
                "video/mpv": {
                    source: "iana",
                },
                "video/nv": {
                    source: "iana",
                },
                "video/ogg": {
                    source: "iana",
                    compressible: false,
                    extensions: ["ogv"],
                },
                "video/parityfec": {
                    source: "iana",
                },
                "video/pointer": {
                    source: "iana",
                },
                "video/quicktime": {
                    source: "iana",
                    compressible: false,
                    extensions: ["qt", "mov"],
                },
                "video/raptorfec": {
                    source: "iana",
                },
                "video/raw": {
                    source: "iana",
                },
                "video/rtp-enc-aescm128": {
                    source: "iana",
                },
                "video/rtploopback": {
                    source: "iana",
                },
                "video/rtx": {
                    source: "iana",
                },
                "video/smpte291": {
                    source: "iana",
                },
                "video/smpte292m": {
                    source: "iana",
                },
                "video/ulpfec": {
                    source: "iana",
                },
                "video/vc1": {
                    source: "iana",
                },
                "video/vc2": {
                    source: "iana",
                },
                "video/vnd.cctv": {
                    source: "iana",
                },
                "video/vnd.dece.hd": {
                    source: "iana",
                    extensions: ["uvh", "uvvh"],
                },
                "video/vnd.dece.mobile": {
                    source: "iana",
                    extensions: ["uvm", "uvvm"],
                },
                "video/vnd.dece.mp4": {
                    source: "iana",
                },
                "video/vnd.dece.pd": {
                    source: "iana",
                    extensions: ["uvp", "uvvp"],
                },
                "video/vnd.dece.sd": {
                    source: "iana",
                    extensions: ["uvs", "uvvs"],
                },
                "video/vnd.dece.video": {
                    source: "iana",
                    extensions: ["uvv", "uvvv"],
                },
                "video/vnd.directv.mpeg": {
                    source: "iana",
                },
                "video/vnd.directv.mpeg-tts": {
                    source: "iana",
                },
                "video/vnd.dlna.mpeg-tts": {
                    source: "iana",
                },
                "video/vnd.dvb.file": {
                    source: "iana",
                    extensions: ["dvb"],
                },
                "video/vnd.fvt": {
                    source: "iana",
                    extensions: ["fvt"],
                },
                "video/vnd.hns.video": {
                    source: "iana",
                },
                "video/vnd.iptvforum.1dparityfec-1010": {
                    source: "iana",
                },
                "video/vnd.iptvforum.1dparityfec-2005": {
                    source: "iana",
                },
                "video/vnd.iptvforum.2dparityfec-1010": {
                    source: "iana",
                },
                "video/vnd.iptvforum.2dparityfec-2005": {
                    source: "iana",
                },
                "video/vnd.iptvforum.ttsavc": {
                    source: "iana",
                },
                "video/vnd.iptvforum.ttsmpeg2": {
                    source: "iana",
                },
                "video/vnd.motorola.video": {
                    source: "iana",
                },
                "video/vnd.motorola.videop": {
                    source: "iana",
                },
                "video/vnd.mpegurl": {
                    source: "iana",
                    extensions: ["mxu", "m4u"],
                },
                "video/vnd.ms-playready.media.pyv": {
                    source: "iana",
                    extensions: ["pyv"],
                },
                "video/vnd.nokia.interleaved-multimedia": {
                    source: "iana",
                },
                "video/vnd.nokia.mp4vr": {
                    source: "iana",
                },
                "video/vnd.nokia.videovoip": {
                    source: "iana",
                },
                "video/vnd.objectvideo": {
                    source: "iana",
                },
                "video/vnd.radgamettools.bink": {
                    source: "iana",
                },
                "video/vnd.radgamettools.smacker": {
                    source: "iana",
                },
                "video/vnd.sealed.mpeg1": {
                    source: "iana",
                },
                "video/vnd.sealed.mpeg4": {
                    source: "iana",
                },
                "video/vnd.sealed.swf": {
                    source: "iana",
                },
                "video/vnd.sealedmedia.softseal.mov": {
                    source: "iana",
                },
                "video/vnd.uvvu.mp4": {
                    source: "iana",
                    extensions: ["uvu", "uvvu"],
                },
                "video/vnd.vivo": {
                    source: "iana",
                    extensions: ["viv"],
                },
                "video/vnd.youtube.yt": {
                    source: "iana",
                },
                "video/vp8": {
                    source: "iana",
                },
                "video/webm": {
                    source: "apache",
                    compressible: false,
                    extensions: ["webm"],
                },
                "video/x-f4v": {
                    source: "apache",
                    extensions: ["f4v"],
                },
                "video/x-fli": {
                    source: "apache",
                    extensions: ["fli"],
                },
                "video/x-flv": {
                    source: "apache",
                    compressible: false,
                    extensions: ["flv"],
                },
                "video/x-m4v": {
                    source: "apache",
                    extensions: ["m4v"],
                },
                "video/x-matroska": {
                    source: "apache",
                    compressible: false,
                    extensions: ["mkv", "mk3d", "mks"],
                },
                "video/x-mng": {
                    source: "apache",
                    extensions: ["mng"],
                },
                "video/x-ms-asf": {
                    source: "apache",
                    extensions: ["asf", "asx"],
                },
                "video/x-ms-vob": {
                    source: "apache",
                    extensions: ["vob"],
                },
                "video/x-ms-wm": {
                    source: "apache",
                    extensions: ["wm"],
                },
                "video/x-ms-wmv": {
                    source: "apache",
                    compressible: false,
                    extensions: ["wmv"],
                },
                "video/x-ms-wmx": {
                    source: "apache",
                    extensions: ["wmx"],
                },
                "video/x-ms-wvx": {
                    source: "apache",
                    extensions: ["wvx"],
                },
                "video/x-msvideo": {
                    source: "apache",
                    extensions: ["avi"],
                },
                "video/x-sgi-movie": {
                    source: "apache",
                    extensions: ["movie"],
                },
                "video/x-smv": {
                    source: "apache",
                    extensions: ["smv"],
                },
                "x-conference/x-cooltalk": {
                    source: "apache",
                    extensions: ["ice"],
                },
                "x-shader/x-fragment": {
                    compressible: true,
                },
                "x-shader/x-vertex": {
                    compressible: true,
                },
            });
        }
    };
});
System.register("https://deno.land/x/media_types@v2.4.2/deps", ["https://deno.land/std@0.61.0/path/mod"], function (exports_34, context_34) {
    "use strict";
    var __moduleName = context_34 && context_34.id;
    return {
        setters: [
            function (mod_ts_8_1) {
                exports_34({
                    "extname": mod_ts_8_1["extname"]
                });
            }
        ],
        execute: function () {
        }
    };
});
/*!
 * Ported from: https://github.com/jshttp/mime-types and licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 * Copyright (c) 2020 the Deno authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/media_types@v2.4.2/mod", ["https://deno.land/x/media_types@v2.4.2/db", "https://deno.land/x/media_types@v2.4.2/deps"], function (exports_35, context_35) {
    "use strict";
    var db_ts_1, deps_ts_1, EXTRACT_TYPE_REGEXP, TEXT_TYPE_REGEXP, extensions, types;
    var __moduleName = context_35 && context_35.id;
    function populateMaps(extensions, types) {
        const preference = ["nginx", "apache", undefined, "iana"];
        for (const type of Object.keys(db_ts_1.db)) {
            const mime = db_ts_1.db[type];
            const exts = mime.extensions;
            if (!exts || !exts.length) {
                continue;
            }
            extensions.set(type, exts);
            for (const ext of exts) {
                const current = types.get(ext);
                if (current) {
                    const from = preference.indexOf(db_ts_1.db[current].source);
                    const to = preference.indexOf(mime.source);
                    if (current !== "application/octet-stream" &&
                        (from > to ||
                            (from === to && current.substr(0, 12) === "application/"))) {
                        continue;
                    }
                }
                types.set(ext, type);
            }
        }
    }
    function charset(type) {
        const m = EXTRACT_TYPE_REGEXP.exec(type);
        if (!m) {
            return;
        }
        const [match] = m;
        const mime = db_ts_1.db[match.toLowerCase()];
        if (mime && mime.charset) {
            return mime.charset;
        }
        if (TEXT_TYPE_REGEXP.test(match)) {
            return "UTF-8";
        }
    }
    exports_35("charset", charset);
    function lookup(path) {
        const extension = deps_ts_1.extname("x." + path)
            .toLowerCase()
            .substr(1);
        return types.get(extension);
    }
    exports_35("lookup", lookup);
    function contentType(str) {
        let mime = str.includes("/") ? str : lookup(str);
        if (!mime) {
            return;
        }
        if (!mime.includes("charset")) {
            const cs = charset(mime);
            if (cs) {
                mime += `; charset=${cs.toLowerCase()}`;
            }
        }
        return mime;
    }
    exports_35("contentType", contentType);
    function extension(type) {
        const match = EXTRACT_TYPE_REGEXP.exec(type);
        if (!match) {
            return;
        }
        const exts = extensions.get(match[1].toLowerCase());
        if (!exts || !exts.length) {
            return;
        }
        return exts[0];
    }
    exports_35("extension", extension);
    return {
        setters: [
            function (db_ts_1_1) {
                db_ts_1 = db_ts_1_1;
            },
            function (deps_ts_1_1) {
                deps_ts_1 = deps_ts_1_1;
            }
        ],
        execute: function () {
            EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
            TEXT_TYPE_REGEXP = /^text\//i;
            exports_35("extensions", extensions = new Map());
            exports_35("types", types = new Map());
            populateMaps(extensions, types);
        }
    };
});
System.register("https://raw.githubusercontent.com/pillarjs/path-to-regexp/v6.1.0/src/index", [], function (exports_36, context_36) {
    "use strict";
    var __moduleName = context_36 && context_36.id;
    function lexer(str) {
        const tokens = [];
        let i = 0;
        while (i < str.length) {
            const char = str[i];
            if (char === "*" || char === "+" || char === "?") {
                tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
                continue;
            }
            if (char === "\\") {
                tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
                continue;
            }
            if (char === "{") {
                tokens.push({ type: "OPEN", index: i, value: str[i++] });
                continue;
            }
            if (char === "}") {
                tokens.push({ type: "CLOSE", index: i, value: str[i++] });
                continue;
            }
            if (char === ":") {
                let name = "";
                let j = i + 1;
                while (j < str.length) {
                    const code = str.charCodeAt(j);
                    if ((code >= 48 && code <= 57) ||
                        (code >= 65 && code <= 90) ||
                        (code >= 97 && code <= 122) ||
                        code === 95) {
                        name += str[j++];
                        continue;
                    }
                    break;
                }
                if (!name)
                    throw new TypeError(`Missing parameter name at ${i}`);
                tokens.push({ type: "NAME", index: i, value: name });
                i = j;
                continue;
            }
            if (char === "(") {
                let count = 1;
                let pattern = "";
                let j = i + 1;
                if (str[j] === "?") {
                    throw new TypeError(`Pattern cannot start with "?" at ${j}`);
                }
                while (j < str.length) {
                    if (str[j] === "\\") {
                        pattern += str[j++] + str[j++];
                        continue;
                    }
                    if (str[j] === ")") {
                        count--;
                        if (count === 0) {
                            j++;
                            break;
                        }
                    }
                    else if (str[j] === "(") {
                        count++;
                        if (str[j + 1] !== "?") {
                            throw new TypeError(`Capturing groups are not allowed at ${j}`);
                        }
                    }
                    pattern += str[j++];
                }
                if (count)
                    throw new TypeError(`Unbalanced pattern at ${i}`);
                if (!pattern)
                    throw new TypeError(`Missing pattern at ${i}`);
                tokens.push({ type: "PATTERN", index: i, value: pattern });
                i = j;
                continue;
            }
            tokens.push({ type: "CHAR", index: i, value: str[i++] });
        }
        tokens.push({ type: "END", index: i, value: "" });
        return tokens;
    }
    function parse(str, options = {}) {
        const tokens = lexer(str);
        const { prefixes = "./" } = options;
        const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
        const result = [];
        let key = 0;
        let i = 0;
        let path = "";
        const tryConsume = (type) => {
            if (i < tokens.length && tokens[i].type === type)
                return tokens[i++].value;
        };
        const mustConsume = (type) => {
            const value = tryConsume(type);
            if (value !== undefined)
                return value;
            const { type: nextType, index } = tokens[i];
            throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
        };
        const consumeText = () => {
            let result = "";
            let value;
            while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
                result += value;
            }
            return result;
        };
        while (i < tokens.length) {
            const char = tryConsume("CHAR");
            const name = tryConsume("NAME");
            const pattern = tryConsume("PATTERN");
            if (name || pattern) {
                let prefix = char || "";
                if (prefixes.indexOf(prefix) === -1) {
                    path += prefix;
                    prefix = "";
                }
                if (path) {
                    result.push(path);
                    path = "";
                }
                result.push({
                    name: name || key++,
                    prefix,
                    suffix: "",
                    pattern: pattern || defaultPattern,
                    modifier: tryConsume("MODIFIER") || ""
                });
                continue;
            }
            const value = char || tryConsume("ESCAPED_CHAR");
            if (value) {
                path += value;
                continue;
            }
            if (path) {
                result.push(path);
                path = "";
            }
            const open = tryConsume("OPEN");
            if (open) {
                const prefix = consumeText();
                const name = tryConsume("NAME") || "";
                const pattern = tryConsume("PATTERN") || "";
                const suffix = consumeText();
                mustConsume("CLOSE");
                result.push({
                    name: name || (pattern ? key++ : ""),
                    pattern: name && !pattern ? defaultPattern : pattern,
                    prefix,
                    suffix,
                    modifier: tryConsume("MODIFIER") || ""
                });
                continue;
            }
            mustConsume("END");
        }
        return result;
    }
    exports_36("parse", parse);
    function compile(str, options) {
        return tokensToFunction(parse(str, options), options);
    }
    exports_36("compile", compile);
    function tokensToFunction(tokens, options = {}) {
        const reFlags = flags(options);
        const { encode = (x) => x, validate = true } = options;
        const matches = tokens.map(token => {
            if (typeof token === "object") {
                return new RegExp(`^(?:${token.pattern})$`, reFlags);
            }
        });
        return (data) => {
            let path = "";
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (typeof token === "string") {
                    path += token;
                    continue;
                }
                const value = data ? data[token.name] : undefined;
                const optional = token.modifier === "?" || token.modifier === "*";
                const repeat = token.modifier === "*" || token.modifier === "+";
                if (Array.isArray(value)) {
                    if (!repeat) {
                        throw new TypeError(`Expected "${token.name}" to not repeat, but got an array`);
                    }
                    if (value.length === 0) {
                        if (optional)
                            continue;
                        throw new TypeError(`Expected "${token.name}" to not be empty`);
                    }
                    for (let j = 0; j < value.length; j++) {
                        const segment = encode(value[j], token);
                        if (validate && !matches[i].test(segment)) {
                            throw new TypeError(`Expected all "${token.name}" to match "${token.pattern}", but got "${segment}"`);
                        }
                        path += token.prefix + segment + token.suffix;
                    }
                    continue;
                }
                if (typeof value === "string" || typeof value === "number") {
                    const segment = encode(String(value), token);
                    if (validate && !matches[i].test(segment)) {
                        throw new TypeError(`Expected "${token.name}" to match "${token.pattern}", but got "${segment}"`);
                    }
                    path += token.prefix + segment + token.suffix;
                    continue;
                }
                if (optional)
                    continue;
                const typeOfMessage = repeat ? "an array" : "a string";
                throw new TypeError(`Expected "${token.name}" to be ${typeOfMessage}`);
            }
            return path;
        };
    }
    exports_36("tokensToFunction", tokensToFunction);
    function match(str, options) {
        const keys = [];
        const re = pathToRegexp(str, keys, options);
        return regexpToFunction(re, keys, options);
    }
    exports_36("match", match);
    function regexpToFunction(re, keys, options = {}) {
        const { decode = (x) => x } = options;
        return function (pathname) {
            const m = re.exec(pathname);
            if (!m)
                return false;
            const { 0: path, index } = m;
            const params = Object.create(null);
            for (let i = 1; i < m.length; i++) {
                if (m[i] === undefined)
                    continue;
                const key = keys[i - 1];
                if (key.modifier === "*" || key.modifier === "+") {
                    params[key.name] = m[i].split(key.prefix + key.suffix).map(value => {
                        return decode(value, key);
                    });
                }
                else {
                    params[key.name] = decode(m[i], key);
                }
            }
            return { path, index, params };
        };
    }
    exports_36("regexpToFunction", regexpToFunction);
    function escapeString(str) {
        return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    }
    function flags(options) {
        return options && options.sensitive ? "" : "i";
    }
    function regexpToRegexp(path, keys) {
        if (!keys)
            return path;
        const groups = path.source.match(/\((?!\?)/g);
        if (groups) {
            for (let i = 0; i < groups.length; i++) {
                keys.push({
                    name: i,
                    prefix: "",
                    suffix: "",
                    modifier: "",
                    pattern: ""
                });
            }
        }
        return path;
    }
    function arrayToRegexp(paths, keys, options) {
        const parts = paths.map(path => pathToRegexp(path, keys, options).source);
        return new RegExp(`(?:${parts.join("|")})`, flags(options));
    }
    function stringToRegexp(path, keys, options) {
        return tokensToRegexp(parse(path, options), keys, options);
    }
    function tokensToRegexp(tokens, keys, options = {}) {
        const { strict = false, start = true, end = true, encode = (x) => x } = options;
        const endsWith = `[${escapeString(options.endsWith || "")}]|$`;
        const delimiter = `[${escapeString(options.delimiter || "/#?")}]`;
        let route = start ? "^" : "";
        for (const token of tokens) {
            if (typeof token === "string") {
                route += escapeString(encode(token));
            }
            else {
                const prefix = escapeString(encode(token.prefix));
                const suffix = escapeString(encode(token.suffix));
                if (token.pattern) {
                    if (keys)
                        keys.push(token);
                    if (prefix || suffix) {
                        if (token.modifier === "+" || token.modifier === "*") {
                            const mod = token.modifier === "*" ? "?" : "";
                            route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
                        }
                        else {
                            route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
                        }
                    }
                    else {
                        route += `(${token.pattern})${token.modifier}`;
                    }
                }
                else {
                    route += `(?:${prefix}${suffix})${token.modifier}`;
                }
            }
        }
        if (end) {
            if (!strict)
                route += `${delimiter}?`;
            route += !options.endsWith ? "$" : `(?=${endsWith})`;
        }
        else {
            const endToken = tokens[tokens.length - 1];
            const isEndDelimited = typeof endToken === "string"
                ? delimiter.indexOf(endToken[endToken.length - 1]) > -1
                :
                    endToken === undefined;
            if (!strict) {
                route += `(?:${delimiter}(?=${endsWith}))?`;
            }
            if (!isEndDelimited) {
                route += `(?=${delimiter}|${endsWith})`;
            }
        }
        return new RegExp(route, flags(options));
    }
    exports_36("tokensToRegexp", tokensToRegexp);
    function pathToRegexp(path, keys, options) {
        if (path instanceof RegExp)
            return regexpToRegexp(path, keys);
        if (Array.isArray(path))
            return arrayToRegexp(path, keys, options);
        return stringToRegexp(path, keys, options);
    }
    exports_36("pathToRegexp", pathToRegexp);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/deps", ["https://deno.land/std@0.61.0/bytes/mod", "https://deno.land/std@0.61.0/hash/sha1", "https://deno.land/std@0.61.0/hash/sha256", "https://deno.land/std@0.61.0/http/server", "https://deno.land/std@0.61.0/http/http_status", "https://deno.land/std@0.61.0/io/bufio", "https://deno.land/std@0.61.0/path/mod", "https://deno.land/std@0.61.0/testing/asserts", "https://deno.land/std@0.61.0/ws/mod", "https://deno.land/x/media_types@v2.4.2/mod", "https://raw.githubusercontent.com/pillarjs/path-to-regexp/v6.1.0/src/index"], function (exports_37, context_37) {
    "use strict";
    var __moduleName = context_37 && context_37.id;
    return {
        setters: [
            function (mod_ts_9_1) {
                exports_37({
                    "copyBytes": mod_ts_9_1["copyBytes"],
                    "equal": mod_ts_9_1["equal"]
                });
            },
            function (sha1_ts_2_1) {
                exports_37({
                    "Sha1": sha1_ts_2_1["Sha1"]
                });
            },
            function (sha256_ts_1_1) {
                exports_37({
                    "HmacSha256": sha256_ts_1_1["HmacSha256"]
                });
            },
            function (server_ts_2_1) {
                exports_37({
                    "serve": server_ts_2_1["serve"],
                    "serveTLS": server_ts_2_1["serveTLS"]
                });
            },
            function (http_status_ts_2_1) {
                exports_37({
                    "Status": http_status_ts_2_1["Status"],
                    "STATUS_TEXT": http_status_ts_2_1["STATUS_TEXT"]
                });
            },
            function (bufio_ts_4_1) {
                exports_37({
                    "BufReader": bufio_ts_4_1["BufReader"],
                    "BufWriter": bufio_ts_4_1["BufWriter"]
                });
            },
            function (mod_ts_10_1) {
                exports_37({
                    "basename": mod_ts_10_1["basename"],
                    "extname": mod_ts_10_1["extname"],
                    "join": mod_ts_10_1["join"],
                    "isAbsolute": mod_ts_10_1["isAbsolute"],
                    "normalize": mod_ts_10_1["normalize"],
                    "parse": mod_ts_10_1["parse"],
                    "resolve": mod_ts_10_1["resolve"],
                    "sep": mod_ts_10_1["sep"]
                });
            },
            function (asserts_ts_1_1) {
                exports_37({
                    "assert": asserts_ts_1_1["assert"]
                });
            },
            function (mod_ts_11_1) {
                exports_37({
                    "acceptable": mod_ts_11_1["acceptable"],
                    "acceptWebSocket": mod_ts_11_1["acceptWebSocket"]
                });
            },
            function (mod_ts_12_1) {
                exports_37({
                    "contentType": mod_ts_12_1["contentType"],
                    "extension": mod_ts_12_1["extension"],
                    "lookup": mod_ts_12_1["lookup"]
                });
            },
            function (index_ts_1_1) {
                exports_37({
                    "compile": index_ts_1_1["compile"],
                    "pathParse": index_ts_1_1["parse"],
                    "pathToRegexp": index_ts_1_1["pathToRegexp"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/tssCompare", ["https://deno.land/x/oak@v6.0.1/deps"], function (exports_38, context_38) {
    "use strict";
    var deps_ts_2;
    var __moduleName = context_38 && context_38.id;
    function compareArrayBuffer(a, b) {
        deps_ts_2.assert(a.byteLength === b.byteLength, "ArrayBuffer lengths must match.");
        const va = new DataView(a);
        const vb = new DataView(b);
        const length = va.byteLength;
        let out = 0;
        let i = -1;
        while (++i < length) {
            out |= va.getUint8(i) ^ vb.getUint8(i);
        }
        return out === 0;
    }
    function compare(a, b) {
        const key = new Uint8Array(32);
        globalThis.crypto.getRandomValues(key);
        const ah = (new deps_ts_2.HmacSha256(key)).update(a).arrayBuffer();
        const bh = (new deps_ts_2.HmacSha256(key)).update(b).arrayBuffer();
        return compareArrayBuffer(ah, bh);
    }
    exports_38("compare", compare);
    return {
        setters: [
            function (deps_ts_2_1) {
                deps_ts_2 = deps_ts_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/keyStack", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/tssCompare"], function (exports_39, context_39) {
    "use strict";
    var deps_ts_3, tssCompare_ts_1, replacements, KeyStack;
    var __moduleName = context_39 && context_39.id;
    return {
        setters: [
            function (deps_ts_3_1) {
                deps_ts_3 = deps_ts_3_1;
            },
            function (tssCompare_ts_1_1) {
                tssCompare_ts_1 = tssCompare_ts_1_1;
            }
        ],
        execute: function () {
            replacements = {
                "/": "_",
                "+": "-",
                "=": "",
            };
            KeyStack = class KeyStack {
                constructor(keys) {
                    this.#sign = (data, key) => {
                        return btoa(String.fromCharCode.apply(undefined, new Uint8Array(new deps_ts_3.HmacSha256(key).update(data).arrayBuffer())))
                            .replace(/\/|\+|=/g, (c) => replacements[c]);
                    };
                    if (!(0 in keys)) {
                        throw new TypeError("keys must contain at least one value");
                    }
                    this.#keys = keys;
                }
                #keys;
                #sign;
                sign(data) {
                    return this.#sign(data, this.#keys[0]);
                }
                verify(data, digest) {
                    return this.indexOf(data, digest) > -1;
                }
                indexOf(data, digest) {
                    for (let i = 0; i < this.#keys.length; i++) {
                        if (tssCompare_ts_1.compare(digest, this.#sign(data, this.#keys[i]))) {
                            return i;
                        }
                    }
                    return -1;
                }
            };
            exports_39("KeyStack", KeyStack);
        }
    };
});
/*!
 * Adapted directly from http-errors at https://github.com/jshttp/http-errors
 * which is licensed as follows:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Jonathan Ong me@jongleberry.com
 * Copyright (c) 2016 Douglas Christopher Wilson doug@somethingdoug.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/httpError", ["https://deno.land/x/oak@v6.0.1/deps"], function (exports_40, context_40) {
    "use strict";
    var deps_ts_4, errorStatusMap, HttpError, httpErrors;
    var __moduleName = context_40 && context_40.id;
    function createHttpErrorConstructor(status) {
        const name = `${deps_ts_4.Status[status]}Error`;
        const Ctor = class extends HttpError {
            constructor(message) {
                super();
                this.message = message || deps_ts_4.STATUS_TEXT.get(status);
                this.status = status;
                this.expose = status >= 400 && status < 500 ? true : false;
                Object.defineProperty(this, "name", {
                    configurable: true,
                    enumerable: false,
                    value: name,
                    writable: true,
                });
            }
        };
        return Ctor;
    }
    function createHttpError(status = 500, message) {
        return new httpErrors[deps_ts_4.Status[status]](message);
    }
    exports_40("createHttpError", createHttpError);
    function isHttpError(value) {
        return value instanceof HttpError;
    }
    exports_40("isHttpError", isHttpError);
    return {
        setters: [
            function (deps_ts_4_1) {
                deps_ts_4 = deps_ts_4_1;
            }
        ],
        execute: function () {
            errorStatusMap = {
                "BadRequest": 400,
                "Unauthorized": 401,
                "PaymentRequired": 402,
                "Forbidden": 403,
                "NotFound": 404,
                "MethodNotAllowed": 405,
                "NotAcceptable": 406,
                "ProxyAuthRequired": 407,
                "RequestTimeout": 408,
                "Conflict": 409,
                "Gone": 410,
                "LengthRequired": 411,
                "PreconditionFailed": 412,
                "RequestEntityTooLarge": 413,
                "RequestURITooLong": 414,
                "UnsupportedMediaType": 415,
                "RequestedRangeNotSatisfiable": 416,
                "ExpectationFailed": 417,
                "Teapot": 418,
                "MisdirectedRequest": 421,
                "UnprocessableEntity": 422,
                "Locked": 423,
                "FailedDependency": 424,
                "UpgradeRequired": 426,
                "PreconditionRequired": 428,
                "TooManyRequests": 429,
                "RequestHeaderFieldsTooLarge": 431,
                "UnavailableForLegalReasons": 451,
                "InternalServerError": 500,
                "NotImplemented": 501,
                "BadGateway": 502,
                "ServiceUnavailable": 503,
                "GatewayTimeout": 504,
                "HTTPVersionNotSupported": 505,
                "VariantAlsoNegotiates": 506,
                "InsufficientStorage": 507,
                "LoopDetected": 508,
                "NotExtended": 510,
                "NetworkAuthenticationRequired": 511,
            };
            HttpError = class HttpError extends Error {
                constructor() {
                    super(...arguments);
                    this.expose = false;
                    this.status = deps_ts_4.Status.InternalServerError;
                }
            };
            exports_40("HttpError", HttpError);
            exports_40("httpErrors", httpErrors = {});
            for (const [key, value] of Object.entries(errorStatusMap)) {
                httpErrors[key] = createHttpErrorConstructor(value);
            }
        }
    };
});
/*!
 * Adapted directly from media-typer at https://github.com/jshttp/media-typer/
 * which is licensed as follows:
 *
 * media-typer
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
System.register("https://deno.land/x/oak@v6.0.1/mediaTyper", [], function (exports_41, context_41) {
    "use strict";
    var SUBTYPE_NAME_REGEXP, TYPE_NAME_REGEXP, TYPE_REGEXP, MediaType;
    var __moduleName = context_41 && context_41.id;
    function format(obj) {
        const { subtype, suffix, type } = obj;
        if (!TYPE_NAME_REGEXP.test(type)) {
            throw new TypeError("Invalid type.");
        }
        if (!SUBTYPE_NAME_REGEXP.test(subtype)) {
            throw new TypeError("Invalid subtype.");
        }
        let str = `${type}/${subtype}`;
        if (suffix) {
            if (!TYPE_NAME_REGEXP.test(suffix)) {
                throw new TypeError("Invalid suffix.");
            }
            str += `+${suffix}`;
        }
        return str;
    }
    exports_41("format", format);
    function parse(str) {
        const match = TYPE_REGEXP.exec(str.toLowerCase());
        if (!match) {
            throw new TypeError("Invalid media type.");
        }
        let [, type, subtype] = match;
        let suffix;
        const idx = subtype.lastIndexOf("+");
        if (idx !== -1) {
            suffix = subtype.substr(idx + 1);
            subtype = subtype.substr(0, idx);
        }
        return new MediaType(type, subtype, suffix);
    }
    exports_41("parse", parse);
    return {
        setters: [],
        execute: function () {
            SUBTYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
            TYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
            TYPE_REGEXP = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
            MediaType = class MediaType {
                constructor(type, subtype, suffix) {
                    this.type = type;
                    this.subtype = subtype;
                    this.suffix = suffix;
                }
            };
        }
    };
});
/*!
 * Adapted directly from type-is at https://github.com/jshttp/type-is/
 * which is licensed as follows:
 *
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */
System.register("https://deno.land/x/oak@v6.0.1/isMediaType", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/mediaTyper"], function (exports_42, context_42) {
    "use strict";
    var deps_ts_5, mediaTyper_ts_1;
    var __moduleName = context_42 && context_42.id;
    function mimeMatch(expected, actual) {
        if (expected === undefined) {
            return false;
        }
        const actualParts = actual.split("/");
        const expectedParts = expected.split("/");
        if (actualParts.length !== 2 || expectedParts.length !== 2) {
            return false;
        }
        const [actualType, actualSubtype] = actualParts;
        const [expectedType, expectedSubtype] = expectedParts;
        if (expectedType !== "*" && expectedType !== actualType) {
            return false;
        }
        if (expectedSubtype.substr(0, 2) === "*+") {
            return (expectedSubtype.length <= actualSubtype.length + 1 &&
                expectedSubtype.substr(1) ===
                    actualSubtype.substr(1 - expectedSubtype.length));
        }
        if (expectedSubtype !== "*" && expectedSubtype !== actualSubtype) {
            return false;
        }
        return true;
    }
    function normalize(type) {
        switch (type) {
            case "urlencoded":
                return "application/x-www-form-urlencoded";
            case "multipart":
                return "multipart/*";
        }
        if (type[0] === "+") {
            return `*/*${type}`;
        }
        return type.includes("/") ? type : deps_ts_5.lookup(type);
    }
    function normalizeType(value) {
        try {
            const val = value.split(";");
            const type = mediaTyper_ts_1.parse(val[0]);
            return mediaTyper_ts_1.format(type);
        }
        catch {
            return;
        }
    }
    function isMediaType(value, types) {
        const val = normalizeType(value);
        if (!val) {
            return false;
        }
        if (!types.length) {
            return val;
        }
        for (const type of types) {
            if (mimeMatch(normalize(type), val)) {
                return type[0] === "+" || type.includes("*") ? val : type;
            }
        }
        return false;
    }
    exports_42("isMediaType", isMediaType);
    return {
        setters: [
            function (deps_ts_5_1) {
                deps_ts_5 = deps_ts_5_1;
            },
            function (mediaTyper_ts_1_1) {
                mediaTyper_ts_1 = mediaTyper_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/util", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/httpError"], function (exports_43, context_43) {
    "use strict";
    var deps_ts_6, httpError_ts_1, ENCODE_CHARS_REGEXP, HTAB, SPACE, CR, LF, UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE, UP_PATH_REGEXP;
    var __moduleName = context_43 && context_43.id;
    function decodeComponent(text) {
        try {
            return decodeURIComponent(text);
        }
        catch {
            return text;
        }
    }
    exports_43("decodeComponent", decodeComponent);
    function encodeUrl(url) {
        return String(url)
            .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
            .replace(ENCODE_CHARS_REGEXP, encodeURI);
    }
    exports_43("encodeUrl", encodeUrl);
    function getRandomFilename(prefix = "", extension = "") {
        return `${prefix}${new deps_ts_6.Sha1().update(crypto.getRandomValues(new Uint8Array(256))).hex()}${extension ? `.${extension}` : ""}`;
    }
    exports_43("getRandomFilename", getRandomFilename);
    function isErrorStatus(value) {
        return [
            deps_ts_6.Status.BadRequest,
            deps_ts_6.Status.Unauthorized,
            deps_ts_6.Status.PaymentRequired,
            deps_ts_6.Status.Forbidden,
            deps_ts_6.Status.NotFound,
            deps_ts_6.Status.MethodNotAllowed,
            deps_ts_6.Status.NotAcceptable,
            deps_ts_6.Status.ProxyAuthRequired,
            deps_ts_6.Status.RequestTimeout,
            deps_ts_6.Status.Conflict,
            deps_ts_6.Status.Gone,
            deps_ts_6.Status.LengthRequired,
            deps_ts_6.Status.PreconditionFailed,
            deps_ts_6.Status.RequestEntityTooLarge,
            deps_ts_6.Status.RequestURITooLong,
            deps_ts_6.Status.UnsupportedMediaType,
            deps_ts_6.Status.RequestedRangeNotSatisfiable,
            deps_ts_6.Status.ExpectationFailed,
            deps_ts_6.Status.Teapot,
            deps_ts_6.Status.MisdirectedRequest,
            deps_ts_6.Status.UnprocessableEntity,
            deps_ts_6.Status.Locked,
            deps_ts_6.Status.FailedDependency,
            deps_ts_6.Status.UpgradeRequired,
            deps_ts_6.Status.PreconditionRequired,
            deps_ts_6.Status.TooManyRequests,
            deps_ts_6.Status.RequestHeaderFieldsTooLarge,
            deps_ts_6.Status.UnavailableForLegalReasons,
            deps_ts_6.Status.InternalServerError,
            deps_ts_6.Status.NotImplemented,
            deps_ts_6.Status.BadGateway,
            deps_ts_6.Status.ServiceUnavailable,
            deps_ts_6.Status.GatewayTimeout,
            deps_ts_6.Status.HTTPVersionNotSupported,
            deps_ts_6.Status.VariantAlsoNegotiates,
            deps_ts_6.Status.InsufficientStorage,
            deps_ts_6.Status.LoopDetected,
            deps_ts_6.Status.NotExtended,
            deps_ts_6.Status.NetworkAuthenticationRequired,
        ].includes(value);
    }
    exports_43("isErrorStatus", isErrorStatus);
    function isRedirectStatus(value) {
        return [
            deps_ts_6.Status.MultipleChoices,
            deps_ts_6.Status.MovedPermanently,
            deps_ts_6.Status.Found,
            deps_ts_6.Status.SeeOther,
            deps_ts_6.Status.UseProxy,
            deps_ts_6.Status.TemporaryRedirect,
            deps_ts_6.Status.PermanentRedirect,
        ].includes(value);
    }
    exports_43("isRedirectStatus", isRedirectStatus);
    function isHtml(value) {
        return /^\s*<(?:!DOCTYPE|html|body)/i.test(value);
    }
    exports_43("isHtml", isHtml);
    function skipLWSPChar(u8) {
        const result = new Uint8Array(u8.length);
        let j = 0;
        for (let i = 0; i < u8.length; i++) {
            if (u8[i] === SPACE || u8[i] === HTAB)
                continue;
            result[j++] = u8[i];
        }
        return result.slice(0, j);
    }
    exports_43("skipLWSPChar", skipLWSPChar);
    function stripEol(value) {
        if (value[value.byteLength - 1] == LF) {
            let drop = 1;
            if (value.byteLength > 1 && value[value.byteLength - 2] === CR) {
                drop = 2;
            }
            return value.subarray(0, value.byteLength - drop);
        }
        return value;
    }
    exports_43("stripEol", stripEol);
    function resolvePath(rootPath, relativePath) {
        let path = relativePath;
        let root = rootPath;
        if (arguments.length === 1) {
            path = rootPath;
            root = Deno.cwd();
        }
        if (path == null) {
            throw new TypeError("Argument relativePath is required.");
        }
        if (path.includes("\0")) {
            throw httpError_ts_1.createHttpError(400, "Malicious Path");
        }
        if (deps_ts_6.isAbsolute(path)) {
            throw httpError_ts_1.createHttpError(400, "Malicious Path");
        }
        if (UP_PATH_REGEXP.test(deps_ts_6.normalize("." + deps_ts_6.sep + path))) {
            throw httpError_ts_1.createHttpError(403);
        }
        return deps_ts_6.normalize(deps_ts_6.join(deps_ts_6.resolve(root), path));
    }
    exports_43("resolvePath", resolvePath);
    return {
        setters: [
            function (deps_ts_6_1) {
                deps_ts_6 = deps_ts_6_1;
            },
            function (httpError_ts_1_1) {
                httpError_ts_1 = httpError_ts_1_1;
            }
        ],
        execute: function () {
            ENCODE_CHARS_REGEXP = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g;
            HTAB = "\t".charCodeAt(0);
            SPACE = " ".charCodeAt(0);
            CR = "\r".charCodeAt(0);
            LF = "\n".charCodeAt(0);
            UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;
            UNMATCHED_SURROGATE_PAIR_REPLACE = "$1\uFFFD$2";
            UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/buf_reader", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/util"], function (exports_44, context_44) {
    "use strict";
    var deps_ts_7, util_ts_2, DEFAULT_BUF_SIZE, MIN_BUF_SIZE, MAX_CONSECUTIVE_EMPTY_READS, CR, LF, BufferFullError, BufReader;
    var __moduleName = context_44 && context_44.id;
    return {
        setters: [
            function (deps_ts_7_1) {
                deps_ts_7 = deps_ts_7_1;
            },
            function (util_ts_2_1) {
                util_ts_2 = util_ts_2_1;
            }
        ],
        execute: function () {
            DEFAULT_BUF_SIZE = 4096;
            MIN_BUF_SIZE = 16;
            MAX_CONSECUTIVE_EMPTY_READS = 100;
            CR = "\r".charCodeAt(0);
            LF = "\n".charCodeAt(0);
            BufferFullError = class BufferFullError extends Error {
                constructor(partial) {
                    super("Buffer full");
                    this.partial = partial;
                    this.name = "BufferFullError";
                }
            };
            exports_44("BufferFullError", BufferFullError);
            BufReader = class BufReader {
                constructor(rd, size = DEFAULT_BUF_SIZE) {
                    this.#posRead = 0;
                    this.#posWrite = 0;
                    this.#eof = false;
                    this.#fill = async () => {
                        if (this.#posRead > 0) {
                            this.#buffer.copyWithin(0, this.#posRead, this.#posWrite);
                            this.#posWrite -= this.#posRead;
                            this.#posRead = 0;
                        }
                        if (this.#posWrite >= this.#buffer.byteLength) {
                            throw Error("bufio: tried to fill full buffer");
                        }
                        for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
                            const rr = await this.#reader.read(this.#buffer.subarray(this.#posWrite));
                            if (rr === null) {
                                this.#eof = true;
                                return;
                            }
                            deps_ts_7.assert(rr >= 0, "negative read");
                            this.#posWrite += rr;
                            if (rr > 0) {
                                return;
                            }
                        }
                        throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
                    };
                    this.#reset = (buffer, reader) => {
                        this.#buffer = buffer;
                        this.#reader = reader;
                        this.#eof = false;
                    };
                    if (size < MIN_BUF_SIZE) {
                        size = MIN_BUF_SIZE;
                    }
                    this.#reset(new Uint8Array(size), rd);
                }
                #buffer;
                #reader;
                #posRead;
                #posWrite;
                #eof;
                #fill;
                #reset;
                buffered() {
                    return this.#posWrite - this.#posRead;
                }
                async readLine(strip = true) {
                    let line;
                    try {
                        line = await this.readSlice(LF);
                    }
                    catch (err) {
                        let { partial } = err;
                        deps_ts_7.assert(partial instanceof Uint8Array, "Caught error from `readSlice()` without `partial` property");
                        if (!(err instanceof BufferFullError)) {
                            throw err;
                        }
                        if (!this.#eof &&
                            partial.byteLength > 0 &&
                            partial[partial.byteLength - 1] === CR) {
                            deps_ts_7.assert(this.#posRead > 0, "Tried to rewind past start of buffer");
                            this.#posRead--;
                            partial = partial.subarray(0, partial.byteLength - 1);
                        }
                        return { bytes: partial, eol: this.#eof };
                    }
                    if (line === null) {
                        return null;
                    }
                    if (line.byteLength === 0) {
                        return { bytes: line, eol: true };
                    }
                    if (strip) {
                        line = util_ts_2.stripEol(line);
                    }
                    return { bytes: line, eol: true };
                }
                async readSlice(delim) {
                    let s = 0;
                    let slice;
                    while (true) {
                        let i = this.#buffer.subarray(this.#posRead + s, this.#posWrite).indexOf(delim);
                        if (i >= 0) {
                            i += s;
                            slice = this.#buffer.subarray(this.#posRead, this.#posRead + i + 1);
                            this.#posRead += i + 1;
                            break;
                        }
                        if (this.#eof) {
                            if (this.#posRead === this.#posWrite) {
                                return null;
                            }
                            slice = this.#buffer.subarray(this.#posRead, this.#posWrite);
                            this.#posRead = this.#posWrite;
                            break;
                        }
                        if (this.buffered() >= this.#buffer.byteLength) {
                            this.#posRead = this.#posWrite;
                            const oldbuf = this.#buffer;
                            const newbuf = this.#buffer.slice(0);
                            this.#buffer = newbuf;
                            throw new BufferFullError(oldbuf);
                        }
                        s = this.#posWrite - this.#posRead;
                        try {
                            await this.#fill();
                        }
                        catch (err) {
                            err.partial = slice;
                            throw err;
                        }
                    }
                    return slice;
                }
            };
            exports_44("BufReader", BufReader);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/headers", ["https://deno.land/x/oak@v6.0.1/httpError"], function (exports_45, context_45) {
    "use strict";
    var httpError_ts_2, COLON, HTAB, SPACE, decoder;
    var __moduleName = context_45 && context_45.id;
    function toParamRegExp(attributePattern, flags) {
        return new RegExp(`(?:^|;)\\s*${attributePattern}\\s*=\\s*` +
            `(` +
            `[^";\\s][^;\\s]*` +
            `|` +
            `"(?:[^"\\\\]|\\\\"?)+"?` +
            `)`, flags);
    }
    exports_45("toParamRegExp", toParamRegExp);
    async function readHeaders(body) {
        const headers = {};
        let readResult = await body.readLine();
        while (readResult) {
            const { bytes } = readResult;
            if (!bytes.length) {
                return headers;
            }
            let i = bytes.indexOf(COLON);
            if (i === -1) {
                throw new httpError_ts_2.httpErrors.BadRequest(`Malformed header: ${decoder.decode(bytes)}`);
            }
            const key = decoder.decode(bytes.subarray(0, i)).trim().toLowerCase();
            if (key === "") {
                throw new httpError_ts_2.httpErrors.BadRequest("Invalid header key.");
            }
            i++;
            while (i < bytes.byteLength && (bytes[i] === SPACE || bytes[i] === HTAB)) {
                i++;
            }
            const value = decoder.decode(bytes.subarray(i)).trim();
            headers[key] = value;
            readResult = await body.readLine();
        }
        throw new httpError_ts_2.httpErrors.BadRequest("Unexpected end of body reached.");
    }
    exports_45("readHeaders", readHeaders);
    function unquote(value) {
        if (value.startsWith(`"`)) {
            const parts = value.slice(1).split(`\\"`);
            for (let i = 0; i < parts.length; ++i) {
                const quoteIndex = parts[i].indexOf(`"`);
                if (quoteIndex !== -1) {
                    parts[i] = parts[i].slice(0, quoteIndex);
                    parts.length = i + 1;
                }
                parts[i] = parts[i].replace(/\\(.)/g, "$1");
            }
            value = parts.join(`"`);
        }
        return value;
    }
    exports_45("unquote", unquote);
    return {
        setters: [
            function (httpError_ts_2_1) {
                httpError_ts_2 = httpError_ts_2_1;
            }
        ],
        execute: function () {
            COLON = ":".charCodeAt(0);
            HTAB = "\t".charCodeAt(0);
            SPACE = " ".charCodeAt(0);
            decoder = new TextDecoder();
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/content_disposition", ["https://deno.land/x/oak@v6.0.1/headers"], function (exports_46, context_46) {
    "use strict";
    var headers_ts_1, needsEncodingFixup, FILENAME_STAR_REGEX, FILENAME_START_ITER_REGEX, FILENAME_REGEX;
    var __moduleName = context_46 && context_46.id;
    function fixupEncoding(value) {
        if (needsEncodingFixup && /[\x80-\xff]/.test(value)) {
            value = textDecode("utf-8", value);
            if (needsEncodingFixup) {
                value = textDecode("iso-8859-1", value);
            }
        }
        return value;
    }
    function rfc2047decode(value) {
        if (!value.startsWith("=?") || /[\x00-\x19\x80-\xff]/.test(value)) {
            return value;
        }
        return value.replace(/=\?([\w-]*)\?([QqBb])\?((?:[^?]|\?(?!=))*)\?=/g, (_, charset, encoding, text) => {
            if (encoding === "q" || encoding === "Q") {
                text = text.replace(/_/g, " ");
                text = text.replace(/=([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                return textDecode(charset, text);
            }
            try {
                text = atob(text);
            }
            catch { }
            return textDecode(charset, text);
        });
    }
    function rfc2231getParam(header) {
        const matches = [];
        let match;
        while ((match = FILENAME_START_ITER_REGEX.exec(header))) {
            const [, ns, quote, part] = match;
            const n = parseInt(ns, 10);
            if (n in matches) {
                if (n === 0) {
                    break;
                }
                continue;
            }
            matches[n] = [quote, part];
        }
        const parts = [];
        for (let n = 0; n < matches.length; ++n) {
            if (!(n in matches)) {
                break;
            }
            let [quote, part] = matches[n];
            part = headers_ts_1.unquote(part);
            if (quote) {
                part = unescape(part);
                if (n === 0) {
                    part = rfc5987decode(part);
                }
            }
            parts.push(part);
        }
        return parts.join("");
    }
    function rfc5987decode(value) {
        const encodingEnd = value.indexOf(`'`);
        if (encodingEnd === -1) {
            return value;
        }
        const encoding = value.slice(0, encodingEnd);
        const langValue = value.slice(encodingEnd + 1);
        return textDecode(encoding, langValue.replace(/^[^']*'/, ""));
    }
    function textDecode(encoding, value) {
        if (encoding) {
            try {
                const decoder = new TextDecoder(encoding, { fatal: true });
                const bytes = Array.from(value, (c) => c.charCodeAt(0));
                if (bytes.every((code) => code <= 0xFF)) {
                    value = decoder.decode(new Uint8Array(bytes));
                    needsEncodingFixup = false;
                }
            }
            catch { }
        }
        return value;
    }
    function getFilename(header) {
        needsEncodingFixup = true;
        let matches = FILENAME_STAR_REGEX.exec(header);
        if (matches) {
            const [, filename] = matches;
            return fixupEncoding(rfc2047decode(rfc5987decode(unescape(headers_ts_1.unquote(filename)))));
        }
        const filename = rfc2231getParam(header);
        if (filename) {
            return fixupEncoding(rfc2047decode(filename));
        }
        matches = FILENAME_REGEX.exec(header);
        if (matches) {
            const [, filename] = matches;
            return fixupEncoding(rfc2047decode(headers_ts_1.unquote(filename)));
        }
        return "";
    }
    exports_46("getFilename", getFilename);
    return {
        setters: [
            function (headers_ts_1_1) {
                headers_ts_1 = headers_ts_1_1;
            }
        ],
        execute: function () {
            needsEncodingFixup = false;
            FILENAME_STAR_REGEX = headers_ts_1.toParamRegExp("filename\\*", "i");
            FILENAME_START_ITER_REGEX = headers_ts_1.toParamRegExp("filename\\*((?!0\\d)\\d+)(\\*?)", "ig");
            FILENAME_REGEX = headers_ts_1.toParamRegExp("filename", "i");
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/multipart", ["https://deno.land/x/oak@v6.0.1/buf_reader", "https://deno.land/x/oak@v6.0.1/content_disposition", "https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/headers", "https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/util"], function (exports_47, context_47) {
    "use strict";
    var buf_reader_ts_1, content_disposition_ts_1, deps_ts_8, headers_ts_2, httpError_ts_3, util_ts_3, decoder, encoder, BOUNDARY_PARAM_REGEX, DEFAULT_BUFFER_SIZE, DEFAULT_MAX_FILE_SIZE, DEFAULT_MAX_SIZE, NAME_PARAM_REGEX, FormDataReader;
    var __moduleName = context_47 && context_47.id;
    function append(a, b) {
        const ab = new Uint8Array(a.length + b.length);
        ab.set(a, 0);
        ab.set(b, a.length);
        return ab;
    }
    function isEqual(a, b) {
        return deps_ts_8.equal(util_ts_3.skipLWSPChar(a), b);
    }
    async function readToStartOrEnd(body, start, end) {
        let lineResult;
        while ((lineResult = await body.readLine())) {
            if (isEqual(lineResult.bytes, start)) {
                return true;
            }
            if (isEqual(lineResult.bytes, end)) {
                return false;
            }
        }
        throw new httpError_ts_3.httpErrors.BadRequest("Unable to find multi-part boundary.");
    }
    async function* parts({ body, final, part, maxFileSize, maxSize, outPath, prefix }) {
        async function getFile(contentType) {
            const ext = deps_ts_8.extension(contentType);
            if (!ext) {
                throw new httpError_ts_3.httpErrors.BadRequest(`Invalid media type for part: ${ext}`);
            }
            if (!outPath) {
                outPath = await Deno.makeTempDir();
            }
            const filename = `${outPath}/${util_ts_3.getRandomFilename(prefix, ext)}`;
            const file = await Deno.open(filename, { write: true, createNew: true });
            return [filename, file];
        }
        while (true) {
            const headers = await headers_ts_2.readHeaders(body);
            const contentType = headers["content-type"];
            const contentDisposition = headers["content-disposition"];
            if (!contentDisposition) {
                throw new httpError_ts_3.httpErrors.BadRequest("Form data part missing content-disposition header");
            }
            if (!contentDisposition.match(/^form-data;/i)) {
                throw new httpError_ts_3.httpErrors.BadRequest(`Unexpected content-disposition header: "${contentDisposition}"`);
            }
            const matches = NAME_PARAM_REGEX.exec(contentDisposition);
            if (!matches) {
                throw new httpError_ts_3.httpErrors.BadRequest(`Unable to determine name of form body part`);
            }
            let [, name] = matches;
            name = headers_ts_2.unquote(name);
            if (contentType) {
                const originalName = content_disposition_ts_1.getFilename(contentDisposition);
                let byteLength = 0;
                let file;
                let filename;
                let buf;
                if (maxSize) {
                    buf = new Uint8Array();
                }
                else {
                    const result = await getFile(contentType);
                    filename = result[0];
                    file = result[1];
                }
                while (true) {
                    const readResult = await body.readLine(false);
                    if (!readResult) {
                        throw new httpError_ts_3.httpErrors.BadRequest("Unexpected EOF reached");
                    }
                    let { bytes } = readResult;
                    const strippedBytes = util_ts_3.stripEol(bytes);
                    if (isEqual(strippedBytes, part) || isEqual(strippedBytes, final)) {
                        if (file) {
                            file.close();
                        }
                        yield [
                            name,
                            {
                                content: buf,
                                contentType,
                                name,
                                filename,
                                originalName,
                            },
                        ];
                        if (isEqual(strippedBytes, final)) {
                            return;
                        }
                        break;
                    }
                    byteLength += bytes.byteLength;
                    if (byteLength > maxFileSize) {
                        if (file) {
                            file.close();
                        }
                        throw new httpError_ts_3.httpErrors.RequestEntityTooLarge(`File size exceeds limit of ${maxFileSize} bytes.`);
                    }
                    if (buf) {
                        if (byteLength > maxSize) {
                            const result = await getFile(contentType);
                            filename = result[0];
                            file = result[1];
                            await Deno.writeAll(file, buf);
                            buf = undefined;
                        }
                        else {
                            buf = append(buf, bytes);
                        }
                    }
                    if (file) {
                        await Deno.writeAll(file, bytes);
                    }
                }
            }
            else {
                const lines = [];
                while (true) {
                    const readResult = await body.readLine();
                    if (!readResult) {
                        throw new httpError_ts_3.httpErrors.BadRequest("Unexpected EOF reached");
                    }
                    const { bytes } = readResult;
                    if (isEqual(bytes, part) || isEqual(bytes, final)) {
                        yield [name, lines.join("\n")];
                        if (isEqual(bytes, final)) {
                            return;
                        }
                        break;
                    }
                    lines.push(decoder.decode(bytes));
                }
            }
        }
    }
    return {
        setters: [
            function (buf_reader_ts_1_1) {
                buf_reader_ts_1 = buf_reader_ts_1_1;
            },
            function (content_disposition_ts_1_1) {
                content_disposition_ts_1 = content_disposition_ts_1_1;
            },
            function (deps_ts_8_1) {
                deps_ts_8 = deps_ts_8_1;
            },
            function (headers_ts_2_1) {
                headers_ts_2 = headers_ts_2_1;
            },
            function (httpError_ts_3_1) {
                httpError_ts_3 = httpError_ts_3_1;
            },
            function (util_ts_3_1) {
                util_ts_3 = util_ts_3_1;
            }
        ],
        execute: function () {
            decoder = new TextDecoder();
            encoder = new TextEncoder();
            BOUNDARY_PARAM_REGEX = headers_ts_2.toParamRegExp("boundary", "i");
            DEFAULT_BUFFER_SIZE = 1048576;
            DEFAULT_MAX_FILE_SIZE = 10485760;
            DEFAULT_MAX_SIZE = 0;
            NAME_PARAM_REGEX = headers_ts_2.toParamRegExp("name", "i");
            FormDataReader = class FormDataReader {
                constructor(contentType, body) {
                    this.#reading = false;
                    const matches = contentType.match(BOUNDARY_PARAM_REGEX);
                    if (!matches) {
                        throw new httpError_ts_3.httpErrors.BadRequest(`Content type "${contentType}" does not contain a valid boundary.`);
                    }
                    let [, boundary] = matches;
                    boundary = headers_ts_2.unquote(boundary);
                    this.#boundaryPart = encoder.encode(`--${boundary}`);
                    this.#boundaryFinal = encoder.encode(`--${boundary}--`);
                    this.#body = body;
                }
                #body;
                #boundaryFinal;
                #boundaryPart;
                #reading;
                async read(options = {}) {
                    if (this.#reading) {
                        throw new Error("Body is already being read.");
                    }
                    this.#reading = true;
                    const { outPath, maxFileSize = DEFAULT_MAX_FILE_SIZE, maxSize = DEFAULT_MAX_SIZE, bufferSize = DEFAULT_BUFFER_SIZE, } = options;
                    const body = new buf_reader_ts_1.BufReader(this.#body, bufferSize);
                    const result = { fields: {} };
                    if (!(await readToStartOrEnd(body, this.#boundaryPart, this.#boundaryFinal))) {
                        return result;
                    }
                    try {
                        for await (const part of parts({
                            body,
                            part: this.#boundaryPart,
                            final: this.#boundaryFinal,
                            maxFileSize,
                            maxSize,
                            outPath,
                        })) {
                            const [key, value] = part;
                            if (typeof value === "string") {
                                result.fields[key] = value;
                            }
                            else {
                                if (!result.files) {
                                    result.files = [];
                                }
                                result.files.push(value);
                            }
                        }
                    }
                    catch (err) {
                        if (err instanceof Deno.errors.PermissionDenied) {
                            console.error(err.stack ? err.stack : `${err.name}: ${err.message}`);
                        }
                        else {
                            throw err;
                        }
                    }
                    return result;
                }
                async *stream(options = {}) {
                    if (this.#reading) {
                        throw new Error("Body is already being read.");
                    }
                    this.#reading = true;
                    const { outPath, maxFileSize = DEFAULT_MAX_FILE_SIZE, maxSize = DEFAULT_MAX_SIZE, bufferSize = 32000, } = options;
                    const body = new buf_reader_ts_1.BufReader(this.#body, bufferSize);
                    if (!(await readToStartOrEnd(body, this.#boundaryPart, this.#boundaryFinal))) {
                        return;
                    }
                    try {
                        for await (const part of parts({
                            body,
                            part: this.#boundaryPart,
                            final: this.#boundaryFinal,
                            maxFileSize,
                            maxSize,
                            outPath,
                        })) {
                            yield part;
                        }
                    }
                    catch (err) {
                        if (err instanceof Deno.errors.PermissionDenied) {
                            console.error(err.stack ? err.stack : `${err.name}: ${err.message}`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
            };
            exports_47("FormDataReader", FormDataReader);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/body", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/isMediaType", "https://deno.land/x/oak@v6.0.1/multipart"], function (exports_48, context_48) {
    "use strict";
    var deps_ts_9, httpError_ts_4, isMediaType_ts_1, multipart_ts_1, defaultBodyContentTypes, decoder, RequestBody;
    var __moduleName = context_48 && context_48.id;
    return {
        setters: [
            function (deps_ts_9_1) {
                deps_ts_9 = deps_ts_9_1;
            },
            function (httpError_ts_4_1) {
                httpError_ts_4 = httpError_ts_4_1;
            },
            function (isMediaType_ts_1_1) {
                isMediaType_ts_1 = isMediaType_ts_1_1;
            },
            function (multipart_ts_1_1) {
                multipart_ts_1 = multipart_ts_1_1;
            }
        ],
        execute: function () {
            defaultBodyContentTypes = {
                json: ["json", "application/*+json", "application/csp-report"],
                form: ["urlencoded"],
                formData: ["multipart"],
                text: ["text"],
            };
            decoder = new TextDecoder();
            RequestBody = class RequestBody {
                constructor(request) {
                    this.#valuePromise = () => {
                        return this.#readAllBody ?? (this.#readAllBody = Deno.readAll(this.#body));
                    };
                    const { body, headers } = request;
                    this.#body = body;
                    this.#headers = headers;
                }
                #body;
                #formDataReader;
                #has;
                #headers;
                #readAllBody;
                #type;
                #valuePromise;
                get({ type, contentTypes }) {
                    if (type === "reader" && this.#type && this.#type !== "reader") {
                        throw new TypeError("Body already consumed and cannot be returned as a reader.");
                    }
                    if (type === "form-data" && this.#type && this.#type !== "form-data") {
                        throw new TypeError("Body already consumed and cannot be returned as form data.");
                    }
                    if (this.#type === "reader" && type !== "reader") {
                        throw new TypeError("Body already consumed as a reader and can only be returned as a reader.");
                    }
                    if (this.#type === "form-data" && type !== "form-data") {
                        throw new TypeError("Body already consumed as form data and can only be returned as form data.");
                    }
                    if (type && contentTypes) {
                        throw new TypeError(`"type" and "contentTypes" cannot be specified at the same time`);
                    }
                    if (type === "reader") {
                        this.#type = "reader";
                        return { type, value: this.#body };
                    }
                    if (!this.has()) {
                        this.#type = "undefined";
                    }
                    else if (!this.#type) {
                        const encoding = this.#headers.get("content-encoding") ?? "identity";
                        if (encoding !== "identity") {
                            throw new httpError_ts_4.httpErrors.UnsupportedMediaType(`Unsupported content-encoding: ${encoding}`);
                        }
                    }
                    if (this.#type === "undefined") {
                        if (type) {
                            throw new TypeError(`Body is undefined and cannot be returned as "${type}".`);
                        }
                        return { type: "undefined", value: undefined };
                    }
                    if (!type) {
                        const contentType = this.#headers.get("content-type");
                        deps_ts_9.assert(contentType);
                        contentTypes = contentTypes ?? {};
                        const contentTypesJson = [
                            ...defaultBodyContentTypes.json,
                            ...(contentTypes.json ?? []),
                        ];
                        const contentTypesForm = [
                            ...defaultBodyContentTypes.form,
                            ...(contentTypes.form ?? []),
                        ];
                        const contentTypesFormData = [
                            ...defaultBodyContentTypes.formData,
                            ...(contentTypes.formData ?? []),
                        ];
                        const contentTypesText = [
                            ...defaultBodyContentTypes.text,
                            ...(contentTypes.text ?? []),
                        ];
                        if (contentTypes.raw && isMediaType_ts_1.isMediaType(contentType, contentTypes.raw)) {
                            type = "raw";
                        }
                        else if (isMediaType_ts_1.isMediaType(contentType, contentTypesJson)) {
                            type = "json";
                        }
                        else if (isMediaType_ts_1.isMediaType(contentType, contentTypesForm)) {
                            type = "form";
                        }
                        else if (isMediaType_ts_1.isMediaType(contentType, contentTypesFormData)) {
                            type = "form-data";
                        }
                        else if (isMediaType_ts_1.isMediaType(contentType, contentTypesText)) {
                            type = "text";
                        }
                        else {
                            type = "raw";
                        }
                    }
                    deps_ts_9.assert(type);
                    let value;
                    switch (type) {
                        case "form":
                            this.#type = "raw";
                            value = async () => new URLSearchParams(decoder.decode(await this.#valuePromise()).replace(/\+/g, " "));
                            break;
                        case "form-data":
                            this.#type = "form-data";
                            value = () => {
                                const contentType = this.#headers.get("content-type");
                                deps_ts_9.assert(contentType);
                                return this.#formDataReader ??
                                    (this.#formDataReader = new multipart_ts_1.FormDataReader(contentType, this.#body));
                            };
                            break;
                        case "json":
                            this.#type = "raw";
                            value = async () => JSON.parse(decoder.decode(await this.#valuePromise()));
                            break;
                        case "raw":
                            this.#type = "raw";
                            value = () => this.#valuePromise();
                            break;
                        case "text":
                            this.#type = "raw";
                            value = async () => decoder.decode(await this.#valuePromise());
                            break;
                        default:
                            throw new TypeError(`Invalid body type: "${type}"`);
                    }
                    return {
                        type,
                        get value() {
                            return value();
                        },
                    };
                }
                has() {
                    return this.#has !== undefined
                        ? this.#has
                        : (this.#has = this.#headers.get("transfer-encoding") !== null ||
                            !!parseInt(this.#headers.get("content-length") ?? "", 10));
                }
            };
            exports_48("RequestBody", RequestBody);
        }
    };
});
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/negotiation/common", [], function (exports_49, context_49) {
    "use strict";
    var __moduleName = context_49 && context_49.id;
    function compareSpecs(a, b) {
        return (b.q - a.q ||
            (b.s ?? 0) - (a.s ?? 0) ||
            (a.o ?? 0) - (b.o ?? 0) ||
            a.i - b.i ||
            0);
    }
    exports_49("compareSpecs", compareSpecs);
    function isQuality(spec) {
        return spec.q > 0;
    }
    exports_49("isQuality", isQuality);
    return {
        setters: [],
        execute: function () {
        }
    };
});
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/negotiation/charset", ["https://deno.land/x/oak@v6.0.1/negotiation/common"], function (exports_50, context_50) {
    "use strict";
    var common_ts_2, SIMPLE_CHARSET_REGEXP;
    var __moduleName = context_50 && context_50.id;
    function parseCharset(str, i) {
        const match = SIMPLE_CHARSET_REGEXP.exec(str);
        if (!match) {
            return;
        }
        const [, charset] = match;
        let q = 1;
        if (match[2]) {
            const params = match[2].split(";");
            for (const param of params) {
                const [key, value] = param.trim().split("=");
                if (key === "q") {
                    q = parseFloat(value);
                    break;
                }
            }
        }
        return { charset, q, i };
    }
    function parseAcceptCharset(accept) {
        const accepts = accept.split(",");
        const result = [];
        for (let i = 0; i < accepts.length; i++) {
            const charset = parseCharset(accepts[i].trim(), i);
            if (charset) {
                result.push(charset);
            }
        }
        return result;
    }
    function specify(charset, spec, i) {
        let s = 0;
        if (spec.charset.toLowerCase() === charset.toLocaleLowerCase()) {
            s |= 1;
        }
        else if (spec.charset !== "*") {
            return;
        }
        return { i, o: spec.i, q: spec.q, s };
    }
    function getCharsetPriority(charset, accepted, index) {
        let priority = { i: -1, o: -1, q: 0, s: 0 };
        for (const accepts of accepted) {
            const spec = specify(charset, accepts, index);
            if (spec &&
                ((priority.s ?? 0) - (spec.s ?? 0) || priority.q - spec.q ||
                    (priority.o ?? 0) - (spec.o ?? 0)) < 0) {
                priority = spec;
            }
        }
        return priority;
    }
    function preferredCharsets(accept = "*", provided) {
        const accepts = parseAcceptCharset(accept);
        if (!provided) {
            return accepts
                .filter(common_ts_2.isQuality)
                .sort(common_ts_2.compareSpecs)
                .map((spec) => spec.charset);
        }
        const priorities = provided
            .map((type, index) => getCharsetPriority(type, accepts, index));
        return priorities
            .filter(common_ts_2.isQuality)
            .sort(common_ts_2.compareSpecs)
            .map((priority) => provided[priorities.indexOf(priority)]);
    }
    exports_50("preferredCharsets", preferredCharsets);
    return {
        setters: [
            function (common_ts_2_1) {
                common_ts_2 = common_ts_2_1;
            }
        ],
        execute: function () {
            SIMPLE_CHARSET_REGEXP = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
        }
    };
});
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/negotiation/encoding", ["https://deno.land/x/oak@v6.0.1/negotiation/common"], function (exports_51, context_51) {
    "use strict";
    var common_ts_3, simpleEncodingRegExp;
    var __moduleName = context_51 && context_51.id;
    function parseEncoding(str, i) {
        const match = simpleEncodingRegExp.exec(str);
        if (!match) {
            return undefined;
        }
        const encoding = match[1];
        let q = 1;
        if (match[2]) {
            const params = match[2].split(";");
            for (const param of params) {
                const p = param.trim().split("=");
                if (p[0] === "q") {
                    q = parseFloat(p[1]);
                    break;
                }
            }
        }
        return { encoding, q, i };
    }
    function specify(encoding, spec, i = -1) {
        if (!spec.encoding) {
            return;
        }
        let s = 0;
        if (spec.encoding.toLocaleLowerCase() === encoding.toLocaleLowerCase()) {
            s = 1;
        }
        else if (spec.encoding !== "*") {
            return;
        }
        return {
            i,
            o: spec.i,
            q: spec.q,
            s,
        };
    }
    function parseAcceptEncoding(accept) {
        const accepts = accept.split(",");
        const parsedAccepts = [];
        let hasIdentity = false;
        let minQuality = 1;
        for (let i = 0; i < accepts.length; i++) {
            const encoding = parseEncoding(accepts[i].trim(), i);
            if (encoding) {
                parsedAccepts.push(encoding);
                hasIdentity = hasIdentity || !!specify("identity", encoding);
                minQuality = Math.min(minQuality, encoding.q || 1);
            }
        }
        if (!hasIdentity) {
            parsedAccepts.push({
                encoding: "identity",
                q: minQuality,
                i: accepts.length - 1,
            });
        }
        return parsedAccepts;
    }
    function getEncodingPriority(encoding, accepted, index) {
        let priority = { o: -1, q: 0, s: 0, i: 0 };
        for (const s of accepted) {
            const spec = specify(encoding, s, index);
            if (spec &&
                (priority.s - spec.s || priority.q - spec.q ||
                    priority.o - spec.o) <
                    0) {
                priority = spec;
            }
        }
        return priority;
    }
    function preferredEncodings(accept, provided) {
        const accepts = parseAcceptEncoding(accept);
        if (!provided) {
            return accepts
                .filter(common_ts_3.isQuality)
                .sort(common_ts_3.compareSpecs)
                .map((spec) => spec.encoding);
        }
        const priorities = provided.map((type, index) => getEncodingPriority(type, accepts, index));
        return priorities
            .filter(common_ts_3.isQuality)
            .sort(common_ts_3.compareSpecs)
            .map((priority) => provided[priorities.indexOf(priority)]);
    }
    exports_51("preferredEncodings", preferredEncodings);
    return {
        setters: [
            function (common_ts_3_1) {
                common_ts_3 = common_ts_3_1;
            }
        ],
        execute: function () {
            simpleEncodingRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
        }
    };
});
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/negotiation/language", ["https://deno.land/x/oak@v6.0.1/negotiation/common"], function (exports_52, context_52) {
    "use strict";
    var common_ts_4, SIMPLE_LANGUAGE_REGEXP;
    var __moduleName = context_52 && context_52.id;
    function parseLanguage(str, i) {
        const match = SIMPLE_LANGUAGE_REGEXP.exec(str);
        if (!match) {
            return undefined;
        }
        const [, prefix, suffix] = match;
        const full = suffix ? `${prefix}-${suffix}` : prefix;
        let q = 1;
        if (match[3]) {
            const params = match[3].split(";");
            for (const param of params) {
                const [key, value] = param.trim().split("=");
                if (key === "q") {
                    q = parseFloat(value);
                    break;
                }
            }
        }
        return { prefix, suffix, full, q, i };
    }
    function parseAcceptLanguage(accept) {
        const accepts = accept.split(",");
        const result = [];
        for (let i = 0; i < accepts.length; i++) {
            const language = parseLanguage(accepts[i].trim(), i);
            if (language) {
                result.push(language);
            }
        }
        return result;
    }
    function specify(language, spec, i) {
        const p = parseLanguage(language, i);
        if (!p) {
            return undefined;
        }
        let s = 0;
        if (spec.full.toLowerCase() === p.full.toLowerCase()) {
            s |= 4;
        }
        else if (spec.prefix.toLowerCase() === p.prefix.toLowerCase()) {
            s |= 2;
        }
        else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
            s |= 1;
        }
        else if (spec.full !== "*") {
            return;
        }
        return { i, o: spec.i, q: spec.q, s };
    }
    function getLanguagePriority(language, accepted, index) {
        let priority = { i: -1, o: -1, q: 0, s: 0 };
        for (const accepts of accepted) {
            const spec = specify(language, accepts, index);
            if (spec &&
                ((priority.s ?? 0) - (spec.s ?? 0) || priority.q - spec.q ||
                    (priority.o ?? 0) - (spec.o ?? 0)) < 0) {
                priority = spec;
            }
        }
        return priority;
    }
    function preferredLanguages(accept = "*", provided) {
        const accepts = parseAcceptLanguage(accept);
        if (!provided) {
            return accepts
                .filter(common_ts_4.isQuality)
                .sort(common_ts_4.compareSpecs)
                .map((spec) => spec.full);
        }
        const priorities = provided
            .map((type, index) => getLanguagePriority(type, accepts, index));
        return priorities
            .filter(common_ts_4.isQuality)
            .sort(common_ts_4.compareSpecs)
            .map((priority) => provided[priorities.indexOf(priority)]);
    }
    exports_52("preferredLanguages", preferredLanguages);
    return {
        setters: [
            function (common_ts_4_1) {
                common_ts_4 = common_ts_4_1;
            }
        ],
        execute: function () {
            SIMPLE_LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;
        }
    };
});
/*!
 * Adapted directly from negotiator at https://github.com/jshttp/negotiator/
 * which is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Federico Romero
 * Copyright (c) 2012-2014 Isaac Z. Schlueter
 * Copyright (c) 2014-2015 Douglas Christopher Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
System.register("https://deno.land/x/oak@v6.0.1/negotiation/mediaType", ["https://deno.land/x/oak@v6.0.1/negotiation/common"], function (exports_53, context_53) {
    "use strict";
    var common_ts_5, simpleMediaTypeRegExp;
    var __moduleName = context_53 && context_53.id;
    function quoteCount(str) {
        let count = 0;
        let index = 0;
        while ((index = str.indexOf(`"`, index)) !== -1) {
            count++;
            index++;
        }
        return count;
    }
    function splitMediaTypes(accept) {
        const accepts = accept.split(",");
        let j = 0;
        for (let i = 1; i < accepts.length; i++) {
            if (quoteCount(accepts[j]) % 2 === 0) {
                accepts[++j] = accepts[i];
            }
            else {
                accepts[j] += `,${accepts[i]}`;
            }
        }
        accepts.length = j + 1;
        return accepts;
    }
    function splitParameters(str) {
        const parameters = str.split(";");
        let j = 0;
        for (let i = 1; i < parameters.length; i++) {
            if (quoteCount(parameters[j]) % 2 === 0) {
                parameters[++j] = parameters[i];
            }
            else {
                parameters[j] += `;${parameters[i]}`;
            }
        }
        parameters.length = j + 1;
        return parameters.map((p) => p.trim());
    }
    function splitKeyValuePair(str) {
        const [key, value] = str.split("=");
        return [key.toLowerCase(), value];
    }
    function parseMediaType(str, i) {
        const match = simpleMediaTypeRegExp.exec(str);
        if (!match) {
            return;
        }
        const params = Object.create(null);
        let q = 1;
        const [, type, subtype, parameters] = match;
        if (parameters) {
            const kvps = splitParameters(parameters).map(splitKeyValuePair);
            for (const [key, val] of kvps) {
                const value = val && val[0] === `"` && val[val.length - 1] === `"`
                    ? val.substr(1, val.length - 2)
                    : val;
                if (key === "q" && value) {
                    q = parseFloat(value);
                    break;
                }
                params[key] = value;
            }
        }
        return { type, subtype, params, q, i };
    }
    function parseAccept(accept) {
        const accepts = splitMediaTypes(accept);
        const mediaTypes = [];
        for (let i = 0; i < accepts.length; i++) {
            const mediaType = parseMediaType(accepts[i].trim(), i);
            if (mediaType) {
                mediaTypes.push(mediaType);
            }
        }
        return mediaTypes;
    }
    function getFullType(spec) {
        return `${spec.type}/${spec.subtype}`;
    }
    function specify(type, spec, index) {
        const p = parseMediaType(type, index);
        if (!p) {
            return;
        }
        let s = 0;
        if (spec.type.toLowerCase() === p.type.toLowerCase()) {
            s |= 4;
        }
        else if (spec.type !== "*") {
            return;
        }
        if (spec.subtype.toLowerCase() === p.subtype.toLowerCase()) {
            s |= 2;
        }
        else if (spec.subtype !== "*") {
            return;
        }
        const keys = Object.keys(spec.params);
        if (keys.length) {
            if (keys.every((key) => (spec.params[key] || "").toLowerCase() ===
                (p.params[key] || "").toLowerCase())) {
                s |= 1;
            }
            else {
                return;
            }
        }
        return {
            i: index,
            o: spec.o,
            q: spec.q,
            s,
        };
    }
    function getMediaTypePriority(type, accepted, index) {
        let priority = { o: -1, q: 0, s: 0, i: index };
        for (const accepts of accepted) {
            const spec = specify(type, accepts, index);
            if (spec &&
                ((priority.s || 0) - (spec.s || 0) ||
                    (priority.q || 0) - (spec.q || 0) ||
                    (priority.o || 0) - (spec.o || 0)) < 0) {
                priority = spec;
            }
        }
        return priority;
    }
    function preferredMediaTypes(accept, provided) {
        const accepts = parseAccept(accept === undefined ? "*/*" : accept || "");
        if (!provided) {
            return accepts
                .filter(common_ts_5.isQuality)
                .sort(common_ts_5.compareSpecs)
                .map(getFullType);
        }
        const priorities = provided.map((type, index) => {
            return getMediaTypePriority(type, accepts, index);
        });
        return priorities
            .filter(common_ts_5.isQuality)
            .sort(common_ts_5.compareSpecs)
            .map((priority) => provided[priorities.indexOf(priority)]);
    }
    exports_53("preferredMediaTypes", preferredMediaTypes);
    return {
        setters: [
            function (common_ts_5_1) {
                common_ts_5 = common_ts_5_1;
            }
        ],
        execute: function () {
            simpleMediaTypeRegExp = /^\s*([^\s\/;]+)\/([^;\s]+)\s*(?:;(.*))?$/;
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/request", ["https://deno.land/x/oak@v6.0.1/body", "https://deno.land/x/oak@v6.0.1/negotiation/charset", "https://deno.land/x/oak@v6.0.1/negotiation/encoding", "https://deno.land/x/oak@v6.0.1/negotiation/language", "https://deno.land/x/oak@v6.0.1/negotiation/mediaType"], function (exports_54, context_54) {
    "use strict";
    var body_ts_1, charset_ts_1, encoding_ts_1, language_ts_1, mediaType_ts_1, decoder, Request;
    var __moduleName = context_54 && context_54.id;
    return {
        setters: [
            function (body_ts_1_1) {
                body_ts_1 = body_ts_1_1;
            },
            function (charset_ts_1_1) {
                charset_ts_1 = charset_ts_1_1;
            },
            function (encoding_ts_1_1) {
                encoding_ts_1 = encoding_ts_1_1;
            },
            function (language_ts_1_1) {
                language_ts_1 = language_ts_1_1;
            },
            function (mediaType_ts_1_1) {
                mediaType_ts_1 = mediaType_ts_1_1;
            }
        ],
        execute: function () {
            decoder = new TextDecoder();
            Request = class Request {
                constructor(serverRequest, proxy = false, secure = false) {
                    this.#proxy = proxy;
                    this.#secure = secure;
                    this.#serverRequest = serverRequest;
                    this.#body = new body_ts_1.RequestBody(serverRequest);
                }
                #body;
                #proxy;
                #secure;
                #serverRequest;
                #url;
                get hasBody() {
                    return this.#body.has();
                }
                get headers() {
                    return this.#serverRequest.headers;
                }
                get ip() {
                    return this.#proxy
                        ? this.ips[0]
                        : this.#serverRequest.conn.remoteAddr.hostname;
                }
                get ips() {
                    return this.#proxy
                        ? (this.#serverRequest.headers.get("x-forwarded-for") ??
                            this.#serverRequest.conn.remoteAddr.hostname).split(/\s*,\s*/)
                        : [];
                }
                get method() {
                    return this.#serverRequest.method;
                }
                get secure() {
                    return this.#secure;
                }
                get serverRequest() {
                    return this.#serverRequest;
                }
                get url() {
                    if (!this.#url) {
                        const serverRequest = this.#serverRequest;
                        let proto;
                        let host;
                        if (this.#proxy) {
                            proto = serverRequest
                                .headers.get("x-forwarded-proto")?.split(/\s*,\s*/, 1)[0] ??
                                "http";
                            host = serverRequest.headers.get("x-forwarded-host") ??
                                serverRequest.headers.get("host") ?? "";
                        }
                        else {
                            proto = this.#secure ? "https" : "http";
                            host = serverRequest.headers.get("host") ?? "";
                        }
                        this.#url = new URL(`${proto}://${host}${serverRequest.url}`);
                    }
                    return this.#url;
                }
                accepts(...types) {
                    const acceptValue = this.#serverRequest.headers.get("Accept");
                    if (!acceptValue) {
                        return;
                    }
                    if (types.length) {
                        return mediaType_ts_1.preferredMediaTypes(acceptValue, types)[0];
                    }
                    return mediaType_ts_1.preferredMediaTypes(acceptValue);
                }
                acceptsCharsets(...charsets) {
                    const acceptCharsetValue = this.#serverRequest.headers.get("Accept-Charset");
                    if (!acceptCharsetValue) {
                        return;
                    }
                    if (charsets.length) {
                        return charset_ts_1.preferredCharsets(acceptCharsetValue, charsets)[0];
                    }
                    return charset_ts_1.preferredCharsets(acceptCharsetValue);
                }
                acceptsEncodings(...encodings) {
                    const acceptEncodingValue = this.#serverRequest.headers.get("Accept-Encoding");
                    if (!acceptEncodingValue) {
                        return;
                    }
                    if (encodings.length) {
                        return encoding_ts_1.preferredEncodings(acceptEncodingValue, encodings)[0];
                    }
                    return encoding_ts_1.preferredEncodings(acceptEncodingValue);
                }
                acceptsLanguages(...langs) {
                    const acceptLanguageValue = this.#serverRequest.headers.get("Accept-Language");
                    if (!acceptLanguageValue) {
                        return;
                    }
                    if (langs.length) {
                        return language_ts_1.preferredLanguages(acceptLanguageValue, langs)[0];
                    }
                    return language_ts_1.preferredLanguages(acceptLanguageValue);
                }
                body(options = {}) {
                    return this.#body.get(options);
                }
            };
            exports_54("Request", Request);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/response", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/util"], function (exports_55, context_55) {
    "use strict";
    var deps_ts_10, util_ts_4, REDIRECT_BACK, BODY_TYPES, encoder, Response;
    var __moduleName = context_55 && context_55.id;
    function isReader(value) {
        return value && typeof value === "object" && "read" in value &&
            typeof value.read === "function";
    }
    async function convertBody(body, type) {
        let result;
        if (BODY_TYPES.includes(typeof body)) {
            const bodyText = String(body);
            result = encoder.encode(bodyText);
            type = type ?? (util_ts_4.isHtml(bodyText) ? "html" : "text/plain");
        }
        else if (body instanceof Uint8Array || isReader(body)) {
            result = body;
        }
        else if (body && typeof body === "object") {
            result = encoder.encode(JSON.stringify(body));
            type = type ?? "json";
        }
        else if (typeof body === "function") {
            const result = body.call(null);
            return convertBody(await result, type);
        }
        else if (body) {
            throw new TypeError("Response body was set but could not convert.");
        }
        return [result, type];
    }
    return {
        setters: [
            function (deps_ts_10_1) {
                deps_ts_10 = deps_ts_10_1;
            },
            function (util_ts_4_1) {
                util_ts_4 = util_ts_4_1;
            }
        ],
        execute: function () {
            exports_55("REDIRECT_BACK", REDIRECT_BACK = Symbol("redirect backwards"));
            BODY_TYPES = ["string", "number", "bigint", "boolean", "symbol"];
            encoder = new TextEncoder();
            Response = class Response {
                constructor(request) {
                    this.#headers = new Headers();
                    this.#resources = [];
                    this.#writable = true;
                    this.#getBody = async () => {
                        const [body, type] = await convertBody(this.body, this.type);
                        this.type = type;
                        return body;
                    };
                    this.#setContentType = () => {
                        if (this.type) {
                            const contentTypeString = deps_ts_10.contentType(this.type);
                            if (contentTypeString && !this.headers.has("Content-Type")) {
                                this.headers.append("Content-Type", contentTypeString);
                            }
                        }
                    };
                    this.#request = request;
                }
                #body;
                #headers;
                #request;
                #resources;
                #serverResponse;
                #status;
                #type;
                #writable;
                #getBody;
                #setContentType;
                get body() {
                    return this.#body;
                }
                set body(value) {
                    if (!this.#writable) {
                        throw new Error("The response is not writable.");
                    }
                    this.#body = value;
                }
                get headers() {
                    return this.#headers;
                }
                set headers(value) {
                    if (!this.#writable) {
                        throw new Error("The response is not writable.");
                    }
                    this.#headers = value;
                }
                get status() {
                    if (this.#status) {
                        return this.#status;
                    }
                    const typeofbody = typeof this.body;
                    return this.body &&
                        (BODY_TYPES.includes(typeofbody) || typeofbody === "object")
                        ? deps_ts_10.Status.OK
                        : deps_ts_10.Status.NotFound;
                }
                set status(value) {
                    if (!this.#writable) {
                        throw new Error("The response is not writable.");
                    }
                    this.#status = value;
                }
                get type() {
                    return this.#type;
                }
                set type(value) {
                    if (!this.#writable) {
                        throw new Error("The response is not writable.");
                    }
                    this.#type = value;
                }
                get writable() {
                    return this.#writable;
                }
                addResource(rid) {
                    this.#resources.push(rid);
                }
                destroy() {
                    this.#writable = false;
                    this.#body = undefined;
                    this.#serverResponse = undefined;
                    for (const rid of this.#resources) {
                        Deno.close(rid);
                    }
                }
                redirect(url, alt = "/") {
                    if (url === REDIRECT_BACK) {
                        url = this.#request.headers.get("Referrer") ?? String(alt);
                    }
                    else if (typeof url === "object") {
                        url = String(url);
                    }
                    this.headers.set("Location", util_ts_4.encodeUrl(url));
                    if (!this.status || !util_ts_4.isRedirectStatus(this.status)) {
                        this.status = deps_ts_10.Status.Found;
                    }
                    if (this.#request.accepts("html")) {
                        url = encodeURI(url);
                        this.type = "text/html; charset=utf-8";
                        this.body = `Redirecting to <a href="${url}">${url}</a>.`;
                        return;
                    }
                    this.type = "text/plain; charset=utf-8";
                    this.body = `Redirecting to ${url}.`;
                }
                async toServerResponse() {
                    if (this.#serverResponse) {
                        return this.#serverResponse;
                    }
                    const body = await this.#getBody();
                    this.#setContentType();
                    const { headers } = this;
                    if (!(body ||
                        headers.has("Content-Type") ||
                        headers.has("Content-Length"))) {
                        headers.append("Content-Length", "0");
                    }
                    this.#writable = false;
                    return this.#serverResponse = {
                        status: this.#status ?? (body ? deps_ts_10.Status.OK : deps_ts_10.Status.NotFound),
                        body,
                        headers,
                    };
                }
            };
            exports_55("Response", Response);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/cookies", [], function (exports_56, context_56) {
    "use strict";
    var matchCache, FIELD_CONTENT_REGEXP, KEY_REGEXP, SAME_SITE_REGEXP, Cookie, Cookies;
    var __moduleName = context_56 && context_56.id;
    function getPattern(name) {
        if (name in matchCache) {
            return matchCache[name];
        }
        return matchCache[name] = new RegExp(`(?:^|;) *${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`);
    }
    function pushCookie(headers, cookie) {
        if (cookie.overwrite) {
            for (let i = headers.length - 1; i >= 0; i--) {
                if (headers[i].indexOf(`${cookie.name}=`) === 0) {
                    headers.splice(i, 1);
                }
            }
        }
        headers.push(cookie.toHeader());
    }
    function validateCookieProperty(key, value) {
        if (value && !FIELD_CONTENT_REGEXP.test(value)) {
            throw new TypeError(`The ${key} of the cookie (${value}) is invalid.`);
        }
    }
    return {
        setters: [],
        execute: function () {
            matchCache = {};
            FIELD_CONTENT_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
            KEY_REGEXP = /(?:^|;) *([^=]*)=[^;]*/g;
            SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
            Cookie = class Cookie {
                constructor(name, value, attributes) {
                    this.httpOnly = true;
                    this.overwrite = false;
                    this.path = "/";
                    this.sameSite = false;
                    this.secure = false;
                    validateCookieProperty("name", name);
                    validateCookieProperty("value", value);
                    this.name = name;
                    this.value = value ?? "";
                    Object.assign(this, attributes);
                    if (!this.value) {
                        this.expires = new Date(0);
                        this.maxAge = undefined;
                    }
                    validateCookieProperty("path", this.path);
                    validateCookieProperty("domain", this.domain);
                    if (this.sameSite && typeof this.sameSite === "string" &&
                        !SAME_SITE_REGEXP.test(this.sameSite)) {
                        throw new TypeError(`The sameSite of the cookie ("${this.sameSite}") is invalid.`);
                    }
                }
                toHeader() {
                    let header = this.toString();
                    if (this.maxAge) {
                        this.expires = new Date(Date.now() + this.maxAge);
                    }
                    if (this.path) {
                        header += `; path=${this.path}`;
                    }
                    if (this.expires) {
                        header += `; expires=${this.expires.toUTCString()}`;
                    }
                    if (this.domain) {
                        header += `; domain=${this.domain}`;
                    }
                    if (this.sameSite) {
                        header += `; samesite=${this.sameSite === true ? "strict" : this.sameSite.toLowerCase()}`;
                    }
                    if (this.secure) {
                        header += "; secure";
                    }
                    if (this.httpOnly) {
                        header += "; httponly";
                    }
                    return header;
                }
                toString() {
                    return `${this.name}=${this.value}`;
                }
            };
            Cookies = class Cookies {
                constructor(request, response, options = {}) {
                    this.#requestKeys = () => {
                        if (this.#cookieKeys) {
                            return this.#cookieKeys;
                        }
                        const result = this.#cookieKeys = [];
                        const header = this.#request.headers.get("cookie");
                        if (!header) {
                            return result;
                        }
                        let matches;
                        while ((matches = KEY_REGEXP.exec(header))) {
                            const [, key] = matches;
                            result.push(key);
                        }
                        return result;
                    };
                    const { keys, secure } = options;
                    this.#keys = keys;
                    this.#request = request;
                    this.#response = response;
                    this.#secure = secure;
                }
                #cookieKeys;
                #keys;
                #request;
                #response;
                #secure;
                #requestKeys;
                delete(name, options = {}) {
                    this.set(name, null, options);
                    return true;
                }
                *entries() {
                    const keys = this.#requestKeys();
                    for (const key of keys) {
                        const value = this.get(key);
                        if (value) {
                            yield [key, value];
                        }
                    }
                }
                forEach(callback, thisArg = null) {
                    const keys = this.#requestKeys();
                    for (const key of keys) {
                        const value = this.get(key);
                        if (value) {
                            callback.call(thisArg, key, value, this);
                        }
                    }
                }
                get(name, options = {}) {
                    const signed = options.signed ?? !!this.#keys;
                    const nameSig = `${name}.sig`;
                    const header = this.#request.headers.get("cookie");
                    if (!header) {
                        return;
                    }
                    const match = header.match(getPattern(name));
                    if (!match) {
                        return;
                    }
                    const [, value] = match;
                    if (!signed) {
                        return value;
                    }
                    const digest = this.get(nameSig, { signed: false });
                    if (!digest) {
                        return;
                    }
                    const data = `${name}=${value}`;
                    if (!this.#keys) {
                        throw new TypeError("keys required for signed cookies");
                    }
                    const index = this.#keys.indexOf(data, digest);
                    if (index < 0) {
                        this.delete(nameSig, { path: "/", signed: false });
                    }
                    else {
                        if (index) {
                            this.set(nameSig, this.#keys.sign(data), { signed: false });
                        }
                        return value;
                    }
                }
                *keys() {
                    const keys = this.#requestKeys();
                    for (const key of keys) {
                        const value = this.get(key);
                        if (value) {
                            yield key;
                        }
                    }
                }
                set(name, value, options = {}) {
                    const request = this.#request;
                    const response = this.#response;
                    let headers = response.headers.get("Set-Cookie") ?? [];
                    if (typeof headers === "string") {
                        headers = [headers];
                    }
                    const secure = this.#secure !== undefined ? this.#secure : request.secure;
                    const signed = options.signed ?? !!this.#keys;
                    if (!secure && options.secure) {
                        throw new TypeError("Cannot send secure cookie over unencrypted connection.");
                    }
                    const cookie = new Cookie(name, value, options);
                    cookie.secure = options.secure ?? secure;
                    pushCookie(headers, cookie);
                    if (signed) {
                        if (!this.#keys) {
                            throw new TypeError(".keys required for signed cookies.");
                        }
                        cookie.value = this.#keys.sign(cookie.toString());
                        cookie.name += ".sig";
                        pushCookie(headers, cookie);
                    }
                    for (const header of headers) {
                        response.headers.append("Set-Cookie", header);
                    }
                    return this;
                }
                *values() {
                    const keys = this.#requestKeys();
                    for (const key of keys) {
                        const value = this.get(key);
                        if (value) {
                            yield value;
                        }
                    }
                }
                *[Symbol.iterator]() {
                    const keys = this.#requestKeys();
                    for (const key of keys) {
                        const value = this.get(key);
                        if (value) {
                            yield [key, value];
                        }
                    }
                }
            };
            exports_56("Cookies", Cookies);
        }
    };
});
/*!
 * Adapted from koa-send at https://github.com/koajs/send and which is licensed
 * with the MIT license.
 */
System.register("https://deno.land/x/oak@v6.0.1/send", ["https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/util"], function (exports_57, context_57) {
    "use strict";
    var httpError_ts_5, deps_ts_11, util_ts_5;
    var __moduleName = context_57 && context_57.id;
    function isHidden(root, path) {
        const pathArr = path.substr(root.length).split(deps_ts_11.sep);
        for (const segment of pathArr) {
            if (segment[0] === ".") {
                return true;
            }
            return false;
        }
    }
    async function exists(path) {
        try {
            return (await Deno.stat(path)).isFile;
        }
        catch {
            return false;
        }
    }
    async function send({ request, response }, path, options = { root: "" }) {
        const { brotli = true, extensions, format = true, gzip = true, hidden = false, immutable = false, index, maxage = 0, root, } = options;
        const trailingSlash = path[path.length - 1] === "/";
        path = util_ts_5.decodeComponent(path.substr(deps_ts_11.parse(path).root.length));
        if (index && trailingSlash) {
            path += index;
        }
        path = util_ts_5.resolvePath(root, path);
        if (!hidden && isHidden(root, path)) {
            return;
        }
        let encodingExt = "";
        if (brotli &&
            request.acceptsEncodings("br", "identity") === "br" &&
            (await exists(`${path}.br`))) {
            path = `${path}.br`;
            response.headers.set("Content-Encoding", "br");
            response.headers.delete("Content-Length");
            encodingExt = ".br";
        }
        else if (gzip &&
            request.acceptsEncodings("gzip", "identity") === "gzip" &&
            (await exists(`${path}.gz`))) {
            path = `${path}.gz`;
            response.headers.set("Content-Encoding", "gzip");
            response.headers.delete("Content-Length");
            encodingExt = ".gz";
        }
        if (extensions && !/\.[^/]*$/.exec(path)) {
            for (let ext of extensions) {
                if (!/^\./.exec(ext)) {
                    ext = `.${ext}`;
                }
                if (await exists(`${path}${ext}`)) {
                    path += ext;
                    break;
                }
            }
        }
        let stats;
        try {
            stats = await Deno.stat(path);
            if (stats.isDirectory) {
                if (format && index) {
                    path += `/${index}`;
                    stats = await Deno.stat(path);
                }
                else {
                    return;
                }
            }
        }
        catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                throw httpError_ts_5.createHttpError(404, err.message);
            }
            throw httpError_ts_5.createHttpError(500, err.message);
        }
        response.headers.set("Content-Length", String(stats.size));
        if (!response.headers.has("Last-Modified") && stats.mtime) {
            response.headers.set("Last-Modified", stats.mtime.toUTCString());
        }
        if (!response.headers.has("Cache-Control")) {
            const directives = [`max-age=${(maxage / 1000) | 0}`];
            if (immutable) {
                directives.push("immutable");
            }
            response.headers.set("Cache-Control", directives.join(","));
        }
        if (!response.type) {
            response.type = encodingExt !== ""
                ? deps_ts_11.extname(deps_ts_11.basename(path, encodingExt))
                : deps_ts_11.extname(path);
        }
        const file = await Deno.open(path, { read: true });
        response.addResource(file.rid);
        response.body = file;
        return path;
    }
    exports_57("send", send);
    return {
        setters: [
            function (httpError_ts_5_1) {
                httpError_ts_5 = httpError_ts_5_1;
            },
            function (deps_ts_11_1) {
                deps_ts_11 = deps_ts_11_1;
            },
            function (util_ts_5_1) {
                util_ts_5 = util_ts_5_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/server_sent_event", ["https://deno.land/x/oak@v6.0.1/deps"], function (exports_58, context_58) {
    "use strict";
    var deps_ts_12, encoder, CloseEvent, ServerSentEvent, response, responseHeaders, ServerSentEventTarget;
    var __moduleName = context_58 && context_58.id;
    return {
        setters: [
            function (deps_ts_12_1) {
                deps_ts_12 = deps_ts_12_1;
            }
        ],
        execute: function () {
            encoder = new TextEncoder();
            CloseEvent = class CloseEvent extends Event {
                constructor(eventInit) {
                    super("close", eventInit);
                }
            };
            ServerSentEvent = class ServerSentEvent extends Event {
                constructor(type, data, { replacer, space, ...eventInit } = {}) {
                    super(type, eventInit);
                    this.#type = type;
                    try {
                        this.#data = typeof data === "string"
                            ? data
                            : JSON.stringify(data, replacer, space);
                    }
                    catch (e) {
                        deps_ts_12.assert(e instanceof Error);
                        throw new TypeError(`data could not be coerced into a serialized string.\n  ${e.message}`);
                    }
                    const { id } = eventInit;
                    this.#id = id;
                }
                #data;
                #id;
                #type;
                get data() {
                    return this.#data;
                }
                get id() {
                    return this.#id;
                }
                toString() {
                    const data = `data: ${this.#data.split("\n").join("\ndata: ")}\n`;
                    return `${this.#type === "__message" ? "" : `event: ${this.#type}\n`}${this.#id ? `id: ${String(this.#id)}\n` : ""}${data}\n`;
                }
            };
            exports_58("ServerSentEvent", ServerSentEvent);
            response = `HTTP/1.1 200 OK\n`;
            responseHeaders = new Headers([
                ["Connection", "Keep-Alive"],
                ["Content-Type", "text/event-stream"],
                ["Cache-Control", "no-cache"],
                ["Keep-Alive", `timeout=${Number.MAX_SAFE_INTEGER}`],
            ]);
            ServerSentEventTarget = class ServerSentEventTarget extends EventTarget {
                constructor(app, serverRequest, { headers } = {}) {
                    super();
                    this.#closed = false;
                    this.#prev = Promise.resolve();
                    this.#send = async (payload, prev) => {
                        if (this.#closed) {
                            return;
                        }
                        if (this.#ready !== true) {
                            await this.#ready;
                            this.#ready = true;
                        }
                        try {
                            await prev;
                            await this.#writer.write(encoder.encode(payload));
                            await this.#writer.flush();
                        }
                        catch (error) {
                            this.dispatchEvent(new CloseEvent({ cancelable: false }));
                            const errorEvent = new ErrorEvent("error", { error });
                            this.dispatchEvent(errorEvent);
                            this.#app.dispatchEvent(errorEvent);
                        }
                    };
                    this.#setup = async (overrideHeaders) => {
                        const headers = new Headers(responseHeaders);
                        if (overrideHeaders) {
                            for (const [key, value] of overrideHeaders) {
                                headers.set(key, value);
                            }
                        }
                        let payload = response;
                        for (const [key, value] of headers) {
                            payload += `${key}: ${value}\n`;
                        }
                        payload += `\n`;
                        try {
                            await this.#writer.write(encoder.encode(payload));
                            await this.#writer.flush();
                        }
                        catch (error) {
                            this.dispatchEvent(new CloseEvent({ cancelable: false }));
                            const errorEvent = new ErrorEvent("error", { error });
                            this.dispatchEvent(errorEvent);
                            this.#app.dispatchEvent(errorEvent);
                            throw error;
                        }
                    };
                    this.#app = app;
                    this.#serverRequest = serverRequest;
                    this.#writer = this.#serverRequest.w;
                    this.addEventListener("close", () => {
                        this.#closed = true;
                        try {
                            this.#serverRequest.conn.close();
                        }
                        catch (error) {
                            if (!(error instanceof Deno.errors.BadResource)) {
                                const errorEvent = new ErrorEvent("error", { error });
                                this.dispatchEvent(errorEvent);
                                this.#app.dispatchEvent(errorEvent);
                            }
                        }
                    });
                    this.#ready = this.#setup(headers);
                }
                #app;
                #closed;
                #prev;
                #ready;
                #serverRequest;
                #writer;
                #send;
                #setup;
                get closed() {
                    return this.#closed;
                }
                async close() {
                    if (this.#ready !== true) {
                        await this.#ready;
                    }
                    await this.#prev;
                    this.dispatchEvent(new CloseEvent({ cancelable: false }));
                }
                dispatchComment(comment) {
                    this.#prev = this.#send(`: ${comment.split("\n").join("\n: ")}\n\n`, this.#prev);
                    return true;
                }
                dispatchMessage(data) {
                    const event = new ServerSentEvent("__message", data);
                    return this.dispatchEvent(event);
                }
                dispatchEvent(event) {
                    let dispatched = super.dispatchEvent(event);
                    if (dispatched && event instanceof ServerSentEvent) {
                        this.#prev = this.#send(String(event), this.#prev);
                    }
                    return dispatched;
                }
            };
            exports_58("ServerSentEventTarget", ServerSentEventTarget);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/context", ["https://deno.land/x/oak@v6.0.1/cookies", "https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/request", "https://deno.land/x/oak@v6.0.1/response", "https://deno.land/x/oak@v6.0.1/send", "https://deno.land/x/oak@v6.0.1/server_sent_event"], function (exports_59, context_59) {
    "use strict";
    var cookies_ts_1, deps_ts_13, httpError_ts_6, request_ts_1, response_ts_1, send_ts_1, server_sent_event_ts_1, Context;
    var __moduleName = context_59 && context_59.id;
    return {
        setters: [
            function (cookies_ts_1_1) {
                cookies_ts_1 = cookies_ts_1_1;
            },
            function (deps_ts_13_1) {
                deps_ts_13 = deps_ts_13_1;
            },
            function (httpError_ts_6_1) {
                httpError_ts_6 = httpError_ts_6_1;
            },
            function (request_ts_1_1) {
                request_ts_1 = request_ts_1_1;
            },
            function (response_ts_1_1) {
                response_ts_1 = response_ts_1_1;
            },
            function (send_ts_1_1) {
                send_ts_1 = send_ts_1_1;
            },
            function (server_sent_event_ts_1_1) {
                server_sent_event_ts_1 = server_sent_event_ts_1_1;
            }
        ],
        execute: function () {
            Context = class Context {
                constructor(app, serverRequest, secure = false) {
                    this.app = app;
                    this.state = app.state;
                    this.request = new request_ts_1.Request(serverRequest, app.proxy, secure);
                    this.respond = true;
                    this.response = new response_ts_1.Response(this.request);
                    this.cookies = new cookies_ts_1.Cookies(this.request, this.response, {
                        keys: this.app.keys,
                        secure: this.request.secure,
                    });
                }
                #socket;
                #sse;
                get isUpgradable() {
                    return deps_ts_13.acceptable(this.request);
                }
                get socket() {
                    return this.#socket;
                }
                assert(condition, errorStatus = 500, message, props) {
                    if (condition) {
                        return;
                    }
                    const err = httpError_ts_6.createHttpError(errorStatus, message);
                    if (props) {
                        Object.assign(err, props);
                    }
                    throw err;
                }
                send(options) {
                    const { path = this.request.url.pathname, ...sendOptions } = options;
                    return send_ts_1.send(this, path, sendOptions);
                }
                sendEvents(options) {
                    if (this.#sse) {
                        return this.#sse;
                    }
                    this.respond = false;
                    return this.#sse = new server_sent_event_ts_1.ServerSentEventTarget(this.app, this.request.serverRequest, options);
                }
                throw(errorStatus, message, props) {
                    const err = httpError_ts_6.createHttpError(errorStatus, message);
                    if (props) {
                        Object.assign(err, props);
                    }
                    throw err;
                }
                async upgrade() {
                    if (this.#socket) {
                        return this.#socket;
                    }
                    const { conn, r: bufReader, w: bufWriter, headers } = this.request.serverRequest;
                    this.#socket = await deps_ts_13.acceptWebSocket({ conn, bufReader, bufWriter, headers });
                    this.respond = false;
                    return this.#socket;
                }
            };
            exports_59("Context", Context);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/middleware", [], function (exports_60, context_60) {
    "use strict";
    var __moduleName = context_60 && context_60.id;
    function compose(middleware) {
        return function composedMiddleware(context, next) {
            let index = -1;
            async function dispatch(i) {
                if (i <= index) {
                    throw new Error("next() called multiple times.");
                }
                index = i;
                let fn = middleware[i];
                if (i === middleware.length) {
                    fn = next;
                }
                if (!fn) {
                    return;
                }
                await fn(context, dispatch.bind(null, i + 1));
            }
            return dispatch(0);
        };
    }
    exports_60("compose", compose);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/application", ["https://deno.land/x/oak@v6.0.1/context", "https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/keyStack", "https://deno.land/x/oak@v6.0.1/middleware"], function (exports_61, context_61) {
    "use strict";
    var context_ts_1, deps_ts_14, keyStack_ts_1, middleware_ts_1, ADDR_REGEXP, ApplicationErrorEvent, ApplicationListenEvent, Application;
    var __moduleName = context_61 && context_61.id;
    function isOptionsTls(options) {
        return options.secure === true;
    }
    return {
        setters: [
            function (context_ts_1_1) {
                context_ts_1 = context_ts_1_1;
            },
            function (deps_ts_14_1) {
                deps_ts_14 = deps_ts_14_1;
            },
            function (keyStack_ts_1_1) {
                keyStack_ts_1 = keyStack_ts_1_1;
            },
            function (middleware_ts_1_1) {
                middleware_ts_1 = middleware_ts_1_1;
            }
        ],
        execute: function () {
            ADDR_REGEXP = /^\[?([^\]]*)\]?:([0-9]{1,5})$/;
            ApplicationErrorEvent = class ApplicationErrorEvent extends ErrorEvent {
                constructor(eventInitDict) {
                    super("error", eventInitDict);
                    this.context = eventInitDict.context;
                }
            };
            exports_61("ApplicationErrorEvent", ApplicationErrorEvent);
            ApplicationListenEvent = class ApplicationListenEvent extends Event {
                constructor(eventInitDict) {
                    super("listen", eventInitDict);
                    this.hostname = eventInitDict.hostname;
                    this.port = eventInitDict.port;
                    this.secure = eventInitDict.secure;
                }
            };
            exports_61("ApplicationListenEvent", ApplicationListenEvent);
            Application = class Application extends EventTarget {
                constructor(options = {}) {
                    super();
                    this.#middleware = [];
                    this.#getComposed = () => {
                        if (!this.#composedMiddleware) {
                            this.#composedMiddleware = middleware_ts_1.compose(this.#middleware);
                        }
                        return this.#composedMiddleware;
                    };
                    this.#handleError = (context, error) => {
                        if (!(error instanceof Error)) {
                            error = new Error(`non-error thrown: ${JSON.stringify(error)}`);
                        }
                        const { message } = error;
                        this.dispatchEvent(new ApplicationErrorEvent({ context, message, error }));
                        if (!context.response.writable) {
                            return;
                        }
                        for (const key of context.response.headers.keys()) {
                            context.response.headers.delete(key);
                        }
                        if (error.headers && error.headers instanceof Headers) {
                            for (const [key, value] of error.headers) {
                                context.response.headers.set(key, value);
                            }
                        }
                        context.response.type = "text";
                        const status = context.response.status =
                            error instanceof Deno.errors.NotFound
                                ? 404
                                : error.status && typeof error.status === "number"
                                    ? error.status
                                    : 500;
                        context.response.body = error.expose
                            ? error.message
                            : deps_ts_14.STATUS_TEXT.get(status);
                    };
                    this.#handleRequest = async (request, secure, state) => {
                        const context = new context_ts_1.Context(this, request, secure);
                        let resolve;
                        const handlingPromise = new Promise((res) => resolve = res);
                        state.handling.add(handlingPromise);
                        if (!state.closing && !state.closed) {
                            try {
                                await this.#getComposed()(context);
                            }
                            catch (err) {
                                this.#handleError(context, err);
                            }
                        }
                        if (context.respond === false) {
                            context.response.destroy();
                            resolve();
                            state.handling.delete(handlingPromise);
                            return;
                        }
                        try {
                            await request.respond(await context.response.toServerResponse());
                            if (state.closing) {
                                state.server.close();
                                state.closed = true;
                            }
                        }
                        catch (err) {
                            this.#handleError(context, err);
                        }
                        finally {
                            context.response.destroy();
                            resolve();
                            state.handling.delete(handlingPromise);
                        }
                    };
                    this.handle = async (request, secure = false) => {
                        if (!this.#middleware.length) {
                            throw new TypeError("There is no middleware to process requests.");
                        }
                        const context = new context_ts_1.Context(this, request, secure);
                        try {
                            await this.#getComposed()(context);
                        }
                        catch (err) {
                            this.#handleError(context, err);
                        }
                        if (context.respond === false) {
                            context.response.destroy();
                            return;
                        }
                        try {
                            const response = await context.response.toServerResponse();
                            context.response.destroy();
                            return response;
                        }
                        catch (err) {
                            this.#handleError(context, err);
                            throw err;
                        }
                    };
                    const { state, keys, proxy, serve = deps_ts_14.serve, serveTls = deps_ts_14.serveTLS, } = options;
                    this.proxy = proxy ?? false;
                    this.keys = keys;
                    this.state = state ?? {};
                    this.#serve = serve;
                    this.#serveTls = serveTls;
                }
                #composedMiddleware;
                #keys;
                #middleware;
                #serve;
                #serveTls;
                get keys() {
                    return this.#keys;
                }
                set keys(keys) {
                    if (!keys) {
                        this.#keys = undefined;
                        return;
                    }
                    else if (Array.isArray(keys)) {
                        this.#keys = new keyStack_ts_1.KeyStack(keys);
                    }
                    else {
                        this.#keys = keys;
                    }
                }
                #getComposed;
                #handleError;
                #handleRequest;
                addEventListener(type, listener, options) {
                    super.addEventListener(type, listener, options);
                }
                async listen(options) {
                    if (!this.#middleware.length) {
                        throw new TypeError("There is no middleware to process requests.");
                    }
                    if (typeof options === "string") {
                        const match = ADDR_REGEXP.exec(options);
                        if (!match) {
                            throw TypeError(`Invalid address passed: "${options}"`);
                        }
                        const [, hostname, portStr] = match;
                        options = { hostname, port: parseInt(portStr, 10) };
                    }
                    const server = isOptionsTls(options)
                        ? this.#serveTls(options)
                        : this.#serve(options);
                    const { signal } = options;
                    const state = {
                        closed: false,
                        closing: false,
                        handling: new Set(),
                        server,
                    };
                    if (signal) {
                        signal.addEventListener("abort", () => {
                            if (!state.handling.size) {
                                server.close();
                                state.closed = true;
                            }
                            state.closing = true;
                        });
                    }
                    const { hostname, port, secure = false } = options;
                    this.dispatchEvent(new ApplicationListenEvent({ hostname, port, secure }));
                    try {
                        for await (const request of server) {
                            this.#handleRequest(request, secure, state);
                        }
                        await Promise.all(state.handling);
                    }
                    catch (error) {
                        const message = error instanceof Error
                            ? error.message
                            : "Application Error";
                        this.dispatchEvent(new ApplicationErrorEvent({ message, error }));
                    }
                }
                use(...middleware) {
                    this.#middleware.push(...middleware);
                    this.#composedMiddleware = undefined;
                    return this;
                }
            };
            exports_61("Application", Application);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/router", ["https://deno.land/x/oak@v6.0.1/deps", "https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/middleware", "https://deno.land/x/oak@v6.0.1/util"], function (exports_62, context_62) {
    "use strict";
    var deps_ts_15, httpError_ts_7, middleware_ts_2, util_ts_6, Layer, Router;
    var __moduleName = context_62 && context_62.id;
    function toUrl(url, params = {}, options) {
        const tokens = deps_ts_15.pathParse(url);
        let replace = {};
        if (tokens.some((token) => typeof token === "object")) {
            replace = params;
        }
        else {
            options = params;
        }
        const toPath = deps_ts_15.compile(url, options);
        let replaced = toPath(replace);
        if (options && options.query) {
            const url = new URL(replaced, "http://oak");
            if (typeof options.query === "string") {
                url.search = options.query;
            }
            else {
                url.search = String(options.query instanceof URLSearchParams
                    ? options.query
                    : new URLSearchParams(options.query));
            }
            return `${url.pathname}${url.search}${url.hash}`;
        }
        return replaced;
    }
    return {
        setters: [
            function (deps_ts_15_1) {
                deps_ts_15 = deps_ts_15_1;
            },
            function (httpError_ts_7_1) {
                httpError_ts_7 = httpError_ts_7_1;
            },
            function (middleware_ts_2_1) {
                middleware_ts_2 = middleware_ts_2_1;
            },
            function (util_ts_6_1) {
                util_ts_6 = util_ts_6_1;
            }
        ],
        execute: function () {
            Layer = class Layer {
                constructor(path, methods, middleware, { name, ...opts } = {}) {
                    this.#paramNames = [];
                    this.#opts = opts;
                    this.name = name;
                    this.methods = [...methods];
                    if (this.methods.includes("GET")) {
                        this.methods.unshift("HEAD");
                    }
                    this.stack = Array.isArray(middleware) ? middleware : [middleware];
                    this.path = path;
                    this.#regexp = deps_ts_15.pathToRegexp(path, this.#paramNames, this.#opts);
                }
                #opts;
                #paramNames;
                #regexp;
                match(path) {
                    return this.#regexp.test(path);
                }
                params(captures, existingParams = {}) {
                    const params = existingParams;
                    for (let i = 0; i < captures.length; i++) {
                        if (this.#paramNames[i]) {
                            const c = captures[i];
                            params[this.#paramNames[i].name] = c ? util_ts_6.decodeComponent(c) : c;
                        }
                    }
                    return params;
                }
                captures(path) {
                    if (this.#opts.ignoreCaptures) {
                        return [];
                    }
                    return path.match(this.#regexp)?.slice(1) ?? [];
                }
                url(params = {}, options) {
                    const url = this.path.replace(/\(\.\*\)/g, "");
                    return toUrl(url, params, options);
                }
                param(param, fn) {
                    const stack = this.stack;
                    const params = this.#paramNames;
                    const middleware = function (ctx, next) {
                        const p = ctx.params[param];
                        deps_ts_15.assert(p);
                        return fn.call(this, p, ctx, next);
                    };
                    middleware.param = param;
                    const names = params.map((p) => p.name);
                    const x = names.indexOf(param);
                    if (x >= 0) {
                        for (let i = 0; i < stack.length; i++) {
                            const fn = stack[i];
                            if (!fn.param || names.indexOf(fn.param) > x) {
                                stack.splice(i, 0, middleware);
                                break;
                            }
                        }
                    }
                    return this;
                }
                setPrefix(prefix) {
                    if (this.path) {
                        this.path = this.path !== "/" || this.#opts.strict === true
                            ? `${prefix}${this.path}`
                            : prefix;
                        this.#paramNames = [];
                        this.#regexp = deps_ts_15.pathToRegexp(this.path, this.#paramNames, this.#opts);
                    }
                    return this;
                }
                toJSON() {
                    return {
                        methods: [...this.methods],
                        middleware: [...this.stack],
                        paramNames: this.#paramNames.map((key) => key.name),
                        path: this.path,
                        regexp: this.#regexp,
                        options: { ...this.#opts },
                    };
                }
            };
            Router = class Router {
                constructor(opts = {}) {
                    this.#params = {};
                    this.#stack = [];
                    this.#match = (path, method) => {
                        const matches = {
                            path: [],
                            pathAndMethod: [],
                            route: false,
                        };
                        for (const route of this.#stack) {
                            if (route.match(path)) {
                                matches.path.push(route);
                                if (route.methods.length === 0 || route.methods.includes(method)) {
                                    matches.pathAndMethod.push(route);
                                    if (route.methods.length) {
                                        matches.route = true;
                                    }
                                }
                            }
                        }
                        return matches;
                    };
                    this.#register = (path, middleware, methods, options = {}) => {
                        if (Array.isArray(path)) {
                            for (const p of path) {
                                this.#register(p, middleware, methods, options);
                            }
                            return;
                        }
                        const { end, name, sensitive, strict, ignoreCaptures } = options;
                        const route = new Layer(path, methods, middleware, {
                            end: end === false ? end : true,
                            name,
                            sensitive: sensitive ?? this.#opts.sensitive ?? false,
                            strict: strict ?? this.#opts.strict ?? false,
                            ignoreCaptures,
                        });
                        if (this.#opts.prefix) {
                            route.setPrefix(this.#opts.prefix);
                        }
                        for (const [param, mw] of Object.entries(this.#params)) {
                            route.param(param, mw);
                        }
                        this.#stack.push(route);
                    };
                    this.#route = (name) => {
                        for (const route of this.#stack) {
                            if (route.name === name) {
                                return route;
                            }
                        }
                    };
                    this.#useVerb = (nameOrPath, pathOrMiddleware, middleware, methods) => {
                        let name = undefined;
                        let path;
                        if (typeof pathOrMiddleware === "string") {
                            name = nameOrPath;
                            path = pathOrMiddleware;
                        }
                        else {
                            path = nameOrPath;
                            middleware.unshift(pathOrMiddleware);
                        }
                        this.#register(path, middleware, methods, { name });
                    };
                    this.#opts = opts;
                    this.#methods = opts.methods ?? [
                        "DELETE",
                        "GET",
                        "HEAD",
                        "OPTIONS",
                        "PATCH",
                        "POST",
                        "PUT",
                    ];
                }
                #opts;
                #methods;
                #params;
                #stack;
                #match;
                #register;
                #route;
                #useVerb;
                all(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["DELETE", "GET", "POST", "PUT"]);
                    return this;
                }
                allowedMethods(options = {}) {
                    const implemented = this.#methods;
                    const allowedMethods = async (context, next) => {
                        const ctx = context;
                        await next();
                        if (!ctx.response.status || ctx.response.status === deps_ts_15.Status.NotFound) {
                            deps_ts_15.assert(ctx.matched);
                            const allowed = new Set();
                            for (const route of ctx.matched) {
                                for (const method of route.methods) {
                                    allowed.add(method);
                                }
                            }
                            const allowedStr = [...allowed].join(", ");
                            if (!implemented.includes(ctx.request.method)) {
                                if (options.throw) {
                                    throw options.notImplemented
                                        ? options.notImplemented()
                                        : new httpError_ts_7.httpErrors.NotImplemented();
                                }
                                else {
                                    ctx.response.status = deps_ts_15.Status.NotImplemented;
                                    ctx.response.headers.set("Allowed", allowedStr);
                                }
                            }
                            else if (allowed.size) {
                                if (ctx.request.method === "OPTIONS") {
                                    ctx.response.status = deps_ts_15.Status.OK;
                                    ctx.response.headers.set("Allowed", allowedStr);
                                }
                                else if (!allowed.has(ctx.request.method)) {
                                    if (options.throw) {
                                        throw options.methodNotAllowed
                                            ? options.methodNotAllowed()
                                            : new httpError_ts_7.httpErrors.MethodNotAllowed();
                                    }
                                    else {
                                        ctx.response.status = deps_ts_15.Status.MethodNotAllowed;
                                        ctx.response.headers.set("Allowed", allowedStr);
                                    }
                                }
                            }
                        }
                    };
                    return allowedMethods;
                }
                delete(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["DELETE"]);
                    return this;
                }
                *entries() {
                    for (const route of this.#stack) {
                        const value = route.toJSON();
                        yield [value, value];
                    }
                }
                forEach(callback, thisArg = null) {
                    for (const route of this.#stack) {
                        const value = route.toJSON();
                        callback.call(thisArg, value, value, this);
                    }
                }
                get(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["GET"]);
                    return this;
                }
                head(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["HEAD"]);
                    return this;
                }
                *keys() {
                    for (const route of this.#stack) {
                        yield route.toJSON();
                    }
                }
                options(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["OPTIONS"]);
                    return this;
                }
                param(param, middleware) {
                    this.#params[param] = middleware;
                    for (const route of this.#stack) {
                        route.param(param, middleware);
                    }
                    return this;
                }
                patch(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["PATCH"]);
                    return this;
                }
                post(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["POST"]);
                    return this;
                }
                prefix(prefix) {
                    prefix = prefix.replace(/\/$/, "");
                    this.#opts.prefix = prefix;
                    for (const route of this.#stack) {
                        route.setPrefix(prefix);
                    }
                    return this;
                }
                put(nameOrPath, pathOrMiddleware, ...middleware) {
                    this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["PUT"]);
                    return this;
                }
                redirect(source, destination, status = deps_ts_15.Status.Found) {
                    if (source[0] !== "/") {
                        const s = this.url(source);
                        if (!s) {
                            throw new RangeError(`Could not resolve named route: "${source}"`);
                        }
                        source = s;
                    }
                    if (destination[0] !== "/") {
                        const d = this.url(destination);
                        if (!d) {
                            throw new RangeError(`Could not resolve named route: "${source}"`);
                        }
                        destination = d;
                    }
                    this.all(source, (ctx) => {
                        ctx.response.redirect(destination);
                        ctx.response.status = status;
                    });
                    return this;
                }
                routes() {
                    const dispatch = (context, next) => {
                        const ctx = context;
                        const { url: { pathname }, method } = ctx.request;
                        const path = this.#opts.routerPath ?? ctx.routerPath ??
                            decodeURIComponent(pathname);
                        const matches = this.#match(path, method);
                        if (ctx.matched) {
                            ctx.matched.push(...matches.path);
                        }
                        else {
                            ctx.matched = [...matches.path];
                        }
                        ctx.router = this;
                        if (!matches.route)
                            return next();
                        const { pathAndMethod: matchedRoutes } = matches;
                        const chain = matchedRoutes.reduce((prev, route) => [
                            ...prev,
                            (ctx, next) => {
                                ctx.captures = route.captures(path);
                                ctx.params = route.params(ctx.captures, ctx.params);
                                ctx.routeName = route.name;
                                return next();
                            },
                            ...route.stack,
                        ], []);
                        return middleware_ts_2.compose(chain)(ctx, next);
                    };
                    dispatch.router = this;
                    return dispatch;
                }
                url(name, params, options) {
                    const route = this.#route(name);
                    if (route) {
                        return route.url(params, options);
                    }
                }
                use(pathOrMiddleware, ...middleware) {
                    let path;
                    if (typeof pathOrMiddleware === "string" || Array.isArray(pathOrMiddleware)) {
                        path = pathOrMiddleware;
                    }
                    else {
                        middleware.unshift(pathOrMiddleware);
                    }
                    this.#register(path ?? "(.*)", middleware, [], { end: false, ignoreCaptures: !path });
                    return this;
                }
                *values() {
                    for (const route of this.#stack) {
                        yield route.toJSON();
                    }
                }
                *[Symbol.iterator]() {
                    for (const route of this.#stack) {
                        yield route.toJSON();
                    }
                }
                static url(path, params, options) {
                    return toUrl(path, params, options);
                }
            };
            exports_62("Router", Router);
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/helpers", [], function (exports_63, context_63) {
    "use strict";
    var __moduleName = context_63 && context_63.id;
    function isRouterContext(value) {
        return "params" in value;
    }
    function getQuery(ctx, { mergeParams, asMap } = {}) {
        const result = {};
        if (mergeParams && isRouterContext(ctx)) {
            Object.assign(result, ctx.params);
        }
        for (const [key, value] of ctx.request.url.searchParams) {
            result[key] = value;
        }
        return asMap ? new Map(Object.entries(result)) : result;
    }
    exports_63("getQuery", getQuery);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/oak@v6.0.1/mod", ["https://deno.land/x/oak@v6.0.1/application", "https://deno.land/x/oak@v6.0.1/context", "https://deno.land/x/oak@v6.0.1/helpers", "https://deno.land/x/oak@v6.0.1/cookies", "https://deno.land/x/oak@v6.0.1/httpError", "https://deno.land/x/oak@v6.0.1/middleware", "https://deno.land/x/oak@v6.0.1/multipart", "https://deno.land/x/oak@v6.0.1/request", "https://deno.land/x/oak@v6.0.1/response", "https://deno.land/x/oak@v6.0.1/router", "https://deno.land/x/oak@v6.0.1/send", "https://deno.land/x/oak@v6.0.1/server_sent_event", "https://deno.land/x/oak@v6.0.1/util", "https://deno.land/x/oak@v6.0.1/deps"], function (exports_64, context_64) {
    "use strict";
    var __moduleName = context_64 && context_64.id;
    return {
        setters: [
            function (application_ts_1_1) {
                exports_64({
                    "Application": application_ts_1_1["Application"]
                });
            },
            function (context_ts_2_1) {
                exports_64({
                    "Context": context_ts_2_1["Context"]
                });
            },
            function (helpers_1) {
                exports_64("helpers", helpers_1);
            },
            function (cookies_ts_2_1) {
                exports_64({
                    "Cookies": cookies_ts_2_1["Cookies"]
                });
            },
            function (httpError_ts_8_1) {
                exports_64({
                    "HttpError": httpError_ts_8_1["HttpError"],
                    "httpErrors": httpError_ts_8_1["httpErrors"],
                    "isHttpError": httpError_ts_8_1["isHttpError"]
                });
            },
            function (middleware_ts_3_1) {
                exports_64({
                    "composeMiddleware": middleware_ts_3_1["compose"]
                });
            },
            function (multipart_ts_2_1) {
                exports_64({
                    "FormDataReader": multipart_ts_2_1["FormDataReader"]
                });
            },
            function (request_ts_2_1) {
                exports_64({
                    "Request": request_ts_2_1["Request"]
                });
            },
            function (response_ts_2_1) {
                exports_64({
                    "Response": response_ts_2_1["Response"],
                    "REDIRECT_BACK": response_ts_2_1["REDIRECT_BACK"]
                });
            },
            function (router_ts_1_1) {
                exports_64({
                    "Router": router_ts_1_1["Router"]
                });
            },
            function (send_ts_2_1) {
                exports_64({
                    "send": send_ts_2_1["send"]
                });
            },
            function (server_sent_event_ts_2_1) {
                exports_64({
                    "ServerSentEvent": server_sent_event_ts_2_1["ServerSentEvent"],
                    "ServerSentEventTarget": server_sent_event_ts_2_1["ServerSentEventTarget"]
                });
            },
            function (util_ts_7_1) {
                exports_64({
                    "isErrorStatus": util_ts_7_1["isErrorStatus"],
                    "isRedirectStatus": util_ts_7_1["isRedirectStatus"]
                });
            },
            function (deps_ts_16_1) {
                exports_64({
                    "Status": deps_ts_16_1["Status"],
                    "STATUS_TEXT": deps_ts_16_1["STATUS_TEXT"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/bcrypt@v0.2.4/deps", ["https://deno.land/std@0.61.0/encoding/utf8"], function (exports_65, context_65) {
    "use strict";
    var __moduleName = context_65 && context_65.id;
    return {
        setters: [
            function (utf8_ts_5_1) {
                exports_65({
                    "encode": utf8_ts_5_1["encode"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/bcrypt@v0.2.4/src/bcrypt/base64", [], function (exports_66, context_66) {
    "use strict";
    var base64_code, index_64;
    var __moduleName = context_66 && context_66.id;
    function encode(d, len) {
        let off = 0;
        let rs = [];
        let c1 = 0;
        let c2 = 0;
        while (off < len) {
            c1 = d[off++] & 0xff;
            rs.push(base64_code[(c1 >> 2) & 0x3f]);
            c1 = (c1 & 0x03) << 4;
            if (off >= len) {
                rs.push(base64_code[c1 & 0x3f]);
                break;
            }
            c2 = d[off++] & 0xff;
            c1 |= (c2 >> 4) & 0x0f;
            rs.push(base64_code[c1 & 0x3f]);
            c1 = (c2 & 0x0f) << 2;
            if (off >= len) {
                rs.push(base64_code[c1 & 0x3f]);
                break;
            }
            c2 = d[off++] & 0xff;
            c1 |= (c2 >> 6) & 0x03;
            rs.push(base64_code[c1 & 0x3f]);
            rs.push(base64_code[c2 & 0x3f]);
        }
        return rs.join("");
    }
    exports_66("encode", encode);
    function char64(x) {
        if (x.length > 1) {
            throw new Error("Expected a single character");
        }
        let characterAsciiCode = x.charCodeAt(0);
        if (characterAsciiCode < 0 || characterAsciiCode > index_64.length)
            return -1;
        return index_64[characterAsciiCode];
    }
    function decode(s, maxolen) {
        let rs = [];
        let off = 0;
        let slen = s.length;
        let olen = 0;
        let ret;
        let c1, c2, c3, c4, o;
        if (maxolen <= 0)
            throw new Error("Invalid maxolen");
        while (off < slen - 1 && olen < maxolen) {
            c1 = char64(s.charAt(off++));
            c2 = char64(s.charAt(off++));
            if (c1 === -1 || c2 === -1)
                break;
            o = c1 << 2;
            o |= (c2 & 0x30) >> 4;
            rs.push(o);
            if (++olen >= maxolen || off >= slen)
                break;
            c3 = char64(s.charAt(off++));
            if (c3 === -1)
                break;
            o = (c2 & 0x0f) << 4;
            o |= (c3 & 0x3c) >> 2;
            rs.push(o);
            if (++olen >= maxolen || off >= slen)
                break;
            c4 = char64(s.charAt(off++));
            o = (c3 & 0x03) << 6;
            o |= c4;
            rs.push(o);
            ++olen;
        }
        ret = new Uint8Array(olen);
        for (off = 0; off < olen; off++)
            ret[off] = rs[off];
        return ret;
    }
    exports_66("decode", decode);
    return {
        setters: [],
        execute: function () {
            base64_code = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
            index_64 = new Uint8Array([
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                0,
                1,
                54,
                55,
                56,
                57,
                58,
                59,
                60,
                61,
                62,
                63,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27,
                -1,
                -1,
                -1,
                -1,
                -1,
                -1,
                28,
                29,
                30,
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43,
                44,
                45,
                46,
                47,
                48,
                49,
                50,
                51,
                52,
                53,
                -1,
                -1,
                -1,
                -1,
                -1,
            ]);
        }
    };
});
System.register("https://deno.land/x/bcrypt@v0.2.4/src/bcrypt/bcrypt", ["https://deno.land/x/bcrypt@v0.2.4/deps", "https://deno.land/x/bcrypt@v0.2.4/src/bcrypt/base64"], function (exports_67, context_67) {
    "use strict";
    var deps_ts_17, base64, crypto, GENSALT_DEFAULT_LOG2_ROUNDS, BCRYPT_SALT_LEN, BLOWFISH_NUM_ROUNDS, P_orig, S_orig, bf_crypt_ciphertext, P, S;
    var __moduleName = context_67 && context_67.id;
    function encipher(lr, off) {
        let i = 0;
        let n = 0;
        let l = lr[off];
        let r = lr[off + 1];
        l ^= P[0];
        for (i = 0; i <= BLOWFISH_NUM_ROUNDS - 2;) {
            n = S[(l >> 24) & 0xff];
            n += S[0x100 | ((l >> 16) & 0xff)];
            n ^= S[0x200 | ((l >> 8) & 0xff)];
            n += S[0x300 | (l & 0xff)];
            r ^= n ^ P[++i];
            n = S[(r >> 24) & 0xff];
            n += S[0x100 | ((r >> 16) & 0xff)];
            n ^= S[0x200 | ((r >> 8) & 0xff)];
            n += S[0x300 | (r & 0xff)];
            l ^= n ^ P[++i];
        }
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
    }
    function streamtoword(data, offp) {
        let word = 0;
        let off = offp[0];
        for (let i = 0; i < 4; i++) {
            word = (word << 8) | (data[off] & 0xff);
            off = (off + 1) % data.length;
        }
        offp[0] = off;
        return word;
    }
    function init_key() {
        P = P_orig.slice();
        S = S_orig.slice();
    }
    function key(key) {
        let i;
        let koffp = new Int32Array([0]);
        let lr = new Int32Array([0, 0]);
        let plen = P.length, slen = S.length;
        for (i = 0; i < plen; i++)
            P[i] = P[i] ^ streamtoword(key, koffp);
        for (i = 0; i < plen; i += 2) {
            encipher(lr, 0);
            P[i] = lr[0];
            P[i + 1] = lr[1];
        }
        for (i = 0; i < slen; i += 2) {
            encipher(lr, 0);
            S[i] = lr[0];
            S[i + 1] = lr[1];
        }
    }
    function ekskey(data, key) {
        let i = 0;
        let koffp = new Int32Array([0]);
        let doffp = new Int32Array([0]);
        let lr = new Int32Array([0, 0]);
        let plen = P.length, slen = S.length;
        for (i = 0; i < plen; i++)
            P[i] = P[i] ^ streamtoword(key, koffp);
        for (i = 0; i < plen; i += 2) {
            lr[0] ^= streamtoword(data, doffp);
            lr[1] ^= streamtoword(data, doffp);
            encipher(lr, 0);
            P[i] = lr[0];
            P[i + 1] = lr[1];
        }
        for (i = 0; i < slen; i += 2) {
            lr[0] ^= streamtoword(data, doffp);
            lr[1] ^= streamtoword(data, doffp);
            encipher(lr, 0);
            S[i] = lr[0];
            S[i + 1] = lr[1];
        }
    }
    function crypt_raw(password, salt, log_rounds, cdata) {
        let rounds = 0;
        let i = 0;
        let j = 0;
        let clen = cdata.length;
        let ret;
        if (log_rounds < 4 || log_rounds > 30) {
            throw new Error("Bad number of rounds");
        }
        rounds = 1 << log_rounds;
        if (salt.length !== BCRYPT_SALT_LEN)
            throw new Error("Bad salt length");
        init_key();
        ekskey(salt, password);
        for (i = 0; i !== rounds; i++) {
            key(password);
            key(salt);
        }
        for (i = 0; i < 64; i++) {
            for (j = 0; j < clen >> 1; j++)
                encipher(cdata, j << 1);
        }
        ret = new Uint8Array(clen * 4);
        for (i = 0, j = 0; i < clen; i++) {
            ret[j++] = (cdata[i] >> 24) & 0xff;
            ret[j++] = (cdata[i] >> 16) & 0xff;
            ret[j++] = (cdata[i] >> 8) & 0xff;
            ret[j++] = cdata[i] & 0xff;
        }
        return ret;
    }
    function hashpw(password, salt = gensalt()) {
        let real_salt;
        let passwordb;
        let saltb;
        let hashed;
        let minor = "";
        let rounds = 0;
        let off = 0;
        let rs = [];
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
            throw new Error("Invalid salt version");
        }
        if (salt.charAt(2) === "$")
            off = 3;
        else {
            minor = salt.charAt(2);
            if ((minor.charCodeAt(0) >= "a".charCodeAt(0) &&
                minor.charCodeAt(0) >= "z".charCodeAt(0)) ||
                salt.charAt(3) !== "$") {
                throw new Error("Invalid salt revision");
            }
            off = 4;
        }
        if (salt.charAt(off + 2) > "$")
            throw new Error("Missing salt rounds");
        rounds = parseInt(salt.substring(off, off + 2));
        real_salt = salt.substring(off + 3, off + 25);
        passwordb = deps_ts_17.encode(password + (minor.charCodeAt(0) >= "a".charCodeAt(0) ? "\u0000" : ""));
        saltb = base64.decode(real_salt, BCRYPT_SALT_LEN);
        hashed = crypt_raw(passwordb, saltb, rounds, bf_crypt_ciphertext.slice());
        rs.push("$2");
        if (minor.charCodeAt(0) >= "a".charCodeAt(0))
            rs.push(minor);
        rs.push("$");
        if (rounds < 10)
            rs.push("0");
        if (rounds > 30) {
            throw new Error("rounds exceeds maximum (30)");
        }
        rs.push(rounds.toString());
        rs.push("$");
        rs.push(base64.encode(saltb, saltb.length));
        rs.push(base64.encode(hashed, bf_crypt_ciphertext.length * 4 - 1));
        return rs.join("");
    }
    exports_67("hashpw", hashpw);
    function gensalt(log_rounds = GENSALT_DEFAULT_LOG2_ROUNDS) {
        let rs = [];
        let rnd = new Uint8Array(BCRYPT_SALT_LEN);
        crypto.getRandomValues(rnd);
        rs.push("$2a$");
        if (log_rounds < 10)
            rs.push("0");
        if (log_rounds > 30) {
            throw new Error("log_rounds exceeds maximum (30)");
        }
        rs.push(log_rounds.toString());
        rs.push("$");
        rs.push(base64.encode(rnd, rnd.length));
        return rs.join("");
    }
    exports_67("gensalt", gensalt);
    function checkpw(plaintext, hashed) {
        let hashed_bytes;
        let try_bytes;
        let try_pw = hashpw(plaintext, hashed);
        hashed_bytes = deps_ts_17.encode(hashed);
        try_bytes = deps_ts_17.encode(try_pw);
        if (hashed_bytes.length !== try_bytes.length)
            return false;
        let ret = 0;
        for (let i = 0; i < try_bytes.length; i++) {
            ret |= hashed_bytes[i] ^ try_bytes[i];
        }
        return ret === 0;
    }
    exports_67("checkpw", checkpw);
    return {
        setters: [
            function (deps_ts_17_1) {
                deps_ts_17 = deps_ts_17_1;
            },
            function (base64_1) {
                base64 = base64_1;
            }
        ],
        execute: function () {
            crypto = globalThis.crypto;
            GENSALT_DEFAULT_LOG2_ROUNDS = 10;
            BCRYPT_SALT_LEN = 16;
            BLOWFISH_NUM_ROUNDS = 16;
            P_orig = new Int32Array([
                0x243f6a88,
                0x85a308d3,
                0x13198a2e,
                0x03707344,
                0xa4093822,
                0x299f31d0,
                0x082efa98,
                0xec4e6c89,
                0x452821e6,
                0x38d01377,
                0xbe5466cf,
                0x34e90c6c,
                0xc0ac29b7,
                0xc97c50dd,
                0x3f84d5b5,
                0xb5470917,
                0x9216d5d9,
                0x8979fb1b,
            ]);
            S_orig = new Int32Array([
                0xd1310ba6,
                0x98dfb5ac,
                0x2ffd72db,
                0xd01adfb7,
                0xb8e1afed,
                0x6a267e96,
                0xba7c9045,
                0xf12c7f99,
                0x24a19947,
                0xb3916cf7,
                0x0801f2e2,
                0x858efc16,
                0x636920d8,
                0x71574e69,
                0xa458fea3,
                0xf4933d7e,
                0x0d95748f,
                0x728eb658,
                0x718bcd58,
                0x82154aee,
                0x7b54a41d,
                0xc25a59b5,
                0x9c30d539,
                0x2af26013,
                0xc5d1b023,
                0x286085f0,
                0xca417918,
                0xb8db38ef,
                0x8e79dcb0,
                0x603a180e,
                0x6c9e0e8b,
                0xb01e8a3e,
                0xd71577c1,
                0xbd314b27,
                0x78af2fda,
                0x55605c60,
                0xe65525f3,
                0xaa55ab94,
                0x57489862,
                0x63e81440,
                0x55ca396a,
                0x2aab10b6,
                0xb4cc5c34,
                0x1141e8ce,
                0xa15486af,
                0x7c72e993,
                0xb3ee1411,
                0x636fbc2a,
                0x2ba9c55d,
                0x741831f6,
                0xce5c3e16,
                0x9b87931e,
                0xafd6ba33,
                0x6c24cf5c,
                0x7a325381,
                0x28958677,
                0x3b8f4898,
                0x6b4bb9af,
                0xc4bfe81b,
                0x66282193,
                0x61d809cc,
                0xfb21a991,
                0x487cac60,
                0x5dec8032,
                0xef845d5d,
                0xe98575b1,
                0xdc262302,
                0xeb651b88,
                0x23893e81,
                0xd396acc5,
                0x0f6d6ff3,
                0x83f44239,
                0x2e0b4482,
                0xa4842004,
                0x69c8f04a,
                0x9e1f9b5e,
                0x21c66842,
                0xf6e96c9a,
                0x670c9c61,
                0xabd388f0,
                0x6a51a0d2,
                0xd8542f68,
                0x960fa728,
                0xab5133a3,
                0x6eef0b6c,
                0x137a3be4,
                0xba3bf050,
                0x7efb2a98,
                0xa1f1651d,
                0x39af0176,
                0x66ca593e,
                0x82430e88,
                0x8cee8619,
                0x456f9fb4,
                0x7d84a5c3,
                0x3b8b5ebe,
                0xe06f75d8,
                0x85c12073,
                0x401a449f,
                0x56c16aa6,
                0x4ed3aa62,
                0x363f7706,
                0x1bfedf72,
                0x429b023d,
                0x37d0d724,
                0xd00a1248,
                0xdb0fead3,
                0x49f1c09b,
                0x075372c9,
                0x80991b7b,
                0x25d479d8,
                0xf6e8def7,
                0xe3fe501a,
                0xb6794c3b,
                0x976ce0bd,
                0x04c006ba,
                0xc1a94fb6,
                0x409f60c4,
                0x5e5c9ec2,
                0x196a2463,
                0x68fb6faf,
                0x3e6c53b5,
                0x1339b2eb,
                0x3b52ec6f,
                0x6dfc511f,
                0x9b30952c,
                0xcc814544,
                0xaf5ebd09,
                0xbee3d004,
                0xde334afd,
                0x660f2807,
                0x192e4bb3,
                0xc0cba857,
                0x45c8740f,
                0xd20b5f39,
                0xb9d3fbdb,
                0x5579c0bd,
                0x1a60320a,
                0xd6a100c6,
                0x402c7279,
                0x679f25fe,
                0xfb1fa3cc,
                0x8ea5e9f8,
                0xdb3222f8,
                0x3c7516df,
                0xfd616b15,
                0x2f501ec8,
                0xad0552ab,
                0x323db5fa,
                0xfd238760,
                0x53317b48,
                0x3e00df82,
                0x9e5c57bb,
                0xca6f8ca0,
                0x1a87562e,
                0xdf1769db,
                0xd542a8f6,
                0x287effc3,
                0xac6732c6,
                0x8c4f5573,
                0x695b27b0,
                0xbbca58c8,
                0xe1ffa35d,
                0xb8f011a0,
                0x10fa3d98,
                0xfd2183b8,
                0x4afcb56c,
                0x2dd1d35b,
                0x9a53e479,
                0xb6f84565,
                0xd28e49bc,
                0x4bfb9790,
                0xe1ddf2da,
                0xa4cb7e33,
                0x62fb1341,
                0xcee4c6e8,
                0xef20cada,
                0x36774c01,
                0xd07e9efe,
                0x2bf11fb4,
                0x95dbda4d,
                0xae909198,
                0xeaad8e71,
                0x6b93d5a0,
                0xd08ed1d0,
                0xafc725e0,
                0x8e3c5b2f,
                0x8e7594b7,
                0x8ff6e2fb,
                0xf2122b64,
                0x8888b812,
                0x900df01c,
                0x4fad5ea0,
                0x688fc31c,
                0xd1cff191,
                0xb3a8c1ad,
                0x2f2f2218,
                0xbe0e1777,
                0xea752dfe,
                0x8b021fa1,
                0xe5a0cc0f,
                0xb56f74e8,
                0x18acf3d6,
                0xce89e299,
                0xb4a84fe0,
                0xfd13e0b7,
                0x7cc43b81,
                0xd2ada8d9,
                0x165fa266,
                0x80957705,
                0x93cc7314,
                0x211a1477,
                0xe6ad2065,
                0x77b5fa86,
                0xc75442f5,
                0xfb9d35cf,
                0xebcdaf0c,
                0x7b3e89a0,
                0xd6411bd3,
                0xae1e7e49,
                0x00250e2d,
                0x2071b35e,
                0x226800bb,
                0x57b8e0af,
                0x2464369b,
                0xf009b91e,
                0x5563911d,
                0x59dfa6aa,
                0x78c14389,
                0xd95a537f,
                0x207d5ba2,
                0x02e5b9c5,
                0x83260376,
                0x6295cfa9,
                0x11c81968,
                0x4e734a41,
                0xb3472dca,
                0x7b14a94a,
                0x1b510052,
                0x9a532915,
                0xd60f573f,
                0xbc9bc6e4,
                0x2b60a476,
                0x81e67400,
                0x08ba6fb5,
                0x571be91f,
                0xf296ec6b,
                0x2a0dd915,
                0xb6636521,
                0xe7b9f9b6,
                0xff34052e,
                0xc5855664,
                0x53b02d5d,
                0xa99f8fa1,
                0x08ba4799,
                0x6e85076a,
                0x4b7a70e9,
                0xb5b32944,
                0xdb75092e,
                0xc4192623,
                0xad6ea6b0,
                0x49a7df7d,
                0x9cee60b8,
                0x8fedb266,
                0xecaa8c71,
                0x699a17ff,
                0x5664526c,
                0xc2b19ee1,
                0x193602a5,
                0x75094c29,
                0xa0591340,
                0xe4183a3e,
                0x3f54989a,
                0x5b429d65,
                0x6b8fe4d6,
                0x99f73fd6,
                0xa1d29c07,
                0xefe830f5,
                0x4d2d38e6,
                0xf0255dc1,
                0x4cdd2086,
                0x8470eb26,
                0x6382e9c6,
                0x021ecc5e,
                0x09686b3f,
                0x3ebaefc9,
                0x3c971814,
                0x6b6a70a1,
                0x687f3584,
                0x52a0e286,
                0xb79c5305,
                0xaa500737,
                0x3e07841c,
                0x7fdeae5c,
                0x8e7d44ec,
                0x5716f2b8,
                0xb03ada37,
                0xf0500c0d,
                0xf01c1f04,
                0x0200b3ff,
                0xae0cf51a,
                0x3cb574b2,
                0x25837a58,
                0xdc0921bd,
                0xd19113f9,
                0x7ca92ff6,
                0x94324773,
                0x22f54701,
                0x3ae5e581,
                0x37c2dadc,
                0xc8b57634,
                0x9af3dda7,
                0xa9446146,
                0x0fd0030e,
                0xecc8c73e,
                0xa4751e41,
                0xe238cd99,
                0x3bea0e2f,
                0x3280bba1,
                0x183eb331,
                0x4e548b38,
                0x4f6db908,
                0x6f420d03,
                0xf60a04bf,
                0x2cb81290,
                0x24977c79,
                0x5679b072,
                0xbcaf89af,
                0xde9a771f,
                0xd9930810,
                0xb38bae12,
                0xdccf3f2e,
                0x5512721f,
                0x2e6b7124,
                0x501adde6,
                0x9f84cd87,
                0x7a584718,
                0x7408da17,
                0xbc9f9abc,
                0xe94b7d8c,
                0xec7aec3a,
                0xdb851dfa,
                0x63094366,
                0xc464c3d2,
                0xef1c1847,
                0x3215d908,
                0xdd433b37,
                0x24c2ba16,
                0x12a14d43,
                0x2a65c451,
                0x50940002,
                0x133ae4dd,
                0x71dff89e,
                0x10314e55,
                0x81ac77d6,
                0x5f11199b,
                0x043556f1,
                0xd7a3c76b,
                0x3c11183b,
                0x5924a509,
                0xf28fe6ed,
                0x97f1fbfa,
                0x9ebabf2c,
                0x1e153c6e,
                0x86e34570,
                0xeae96fb1,
                0x860e5e0a,
                0x5a3e2ab3,
                0x771fe71c,
                0x4e3d06fa,
                0x2965dcb9,
                0x99e71d0f,
                0x803e89d6,
                0x5266c825,
                0x2e4cc978,
                0x9c10b36a,
                0xc6150eba,
                0x94e2ea78,
                0xa5fc3c53,
                0x1e0a2df4,
                0xf2f74ea7,
                0x361d2b3d,
                0x1939260f,
                0x19c27960,
                0x5223a708,
                0xf71312b6,
                0xebadfe6e,
                0xeac31f66,
                0xe3bc4595,
                0xa67bc883,
                0xb17f37d1,
                0x018cff28,
                0xc332ddef,
                0xbe6c5aa5,
                0x65582185,
                0x68ab9802,
                0xeecea50f,
                0xdb2f953b,
                0x2aef7dad,
                0x5b6e2f84,
                0x1521b628,
                0x29076170,
                0xecdd4775,
                0x619f1510,
                0x13cca830,
                0xeb61bd96,
                0x0334fe1e,
                0xaa0363cf,
                0xb5735c90,
                0x4c70a239,
                0xd59e9e0b,
                0xcbaade14,
                0xeecc86bc,
                0x60622ca7,
                0x9cab5cab,
                0xb2f3846e,
                0x648b1eaf,
                0x19bdf0ca,
                0xa02369b9,
                0x655abb50,
                0x40685a32,
                0x3c2ab4b3,
                0x319ee9d5,
                0xc021b8f7,
                0x9b540b19,
                0x875fa099,
                0x95f7997e,
                0x623d7da8,
                0xf837889a,
                0x97e32d77,
                0x11ed935f,
                0x16681281,
                0x0e358829,
                0xc7e61fd6,
                0x96dedfa1,
                0x7858ba99,
                0x57f584a5,
                0x1b227263,
                0x9b83c3ff,
                0x1ac24696,
                0xcdb30aeb,
                0x532e3054,
                0x8fd948e4,
                0x6dbc3128,
                0x58ebf2ef,
                0x34c6ffea,
                0xfe28ed61,
                0xee7c3c73,
                0x5d4a14d9,
                0xe864b7e3,
                0x42105d14,
                0x203e13e0,
                0x45eee2b6,
                0xa3aaabea,
                0xdb6c4f15,
                0xfacb4fd0,
                0xc742f442,
                0xef6abbb5,
                0x654f3b1d,
                0x41cd2105,
                0xd81e799e,
                0x86854dc7,
                0xe44b476a,
                0x3d816250,
                0xcf62a1f2,
                0x5b8d2646,
                0xfc8883a0,
                0xc1c7b6a3,
                0x7f1524c3,
                0x69cb7492,
                0x47848a0b,
                0x5692b285,
                0x095bbf00,
                0xad19489d,
                0x1462b174,
                0x23820e00,
                0x58428d2a,
                0x0c55f5ea,
                0x1dadf43e,
                0x233f7061,
                0x3372f092,
                0x8d937e41,
                0xd65fecf1,
                0x6c223bdb,
                0x7cde3759,
                0xcbee7460,
                0x4085f2a7,
                0xce77326e,
                0xa6078084,
                0x19f8509e,
                0xe8efd855,
                0x61d99735,
                0xa969a7aa,
                0xc50c06c2,
                0x5a04abfc,
                0x800bcadc,
                0x9e447a2e,
                0xc3453484,
                0xfdd56705,
                0x0e1e9ec9,
                0xdb73dbd3,
                0x105588cd,
                0x675fda79,
                0xe3674340,
                0xc5c43465,
                0x713e38d8,
                0x3d28f89e,
                0xf16dff20,
                0x153e21e7,
                0x8fb03d4a,
                0xe6e39f2b,
                0xdb83adf7,
                0xe93d5a68,
                0x948140f7,
                0xf64c261c,
                0x94692934,
                0x411520f7,
                0x7602d4f7,
                0xbcf46b2e,
                0xd4a20068,
                0xd4082471,
                0x3320f46a,
                0x43b7d4b7,
                0x500061af,
                0x1e39f62e,
                0x97244546,
                0x14214f74,
                0xbf8b8840,
                0x4d95fc1d,
                0x96b591af,
                0x70f4ddd3,
                0x66a02f45,
                0xbfbc09ec,
                0x03bd9785,
                0x7fac6dd0,
                0x31cb8504,
                0x96eb27b3,
                0x55fd3941,
                0xda2547e6,
                0xabca0a9a,
                0x28507825,
                0x530429f4,
                0x0a2c86da,
                0xe9b66dfb,
                0x68dc1462,
                0xd7486900,
                0x680ec0a4,
                0x27a18dee,
                0x4f3ffea2,
                0xe887ad8c,
                0xb58ce006,
                0x7af4d6b6,
                0xaace1e7c,
                0xd3375fec,
                0xce78a399,
                0x406b2a42,
                0x20fe9e35,
                0xd9f385b9,
                0xee39d7ab,
                0x3b124e8b,
                0x1dc9faf7,
                0x4b6d1856,
                0x26a36631,
                0xeae397b2,
                0x3a6efa74,
                0xdd5b4332,
                0x6841e7f7,
                0xca7820fb,
                0xfb0af54e,
                0xd8feb397,
                0x454056ac,
                0xba489527,
                0x55533a3a,
                0x20838d87,
                0xfe6ba9b7,
                0xd096954b,
                0x55a867bc,
                0xa1159a58,
                0xcca92963,
                0x99e1db33,
                0xa62a4a56,
                0x3f3125f9,
                0x5ef47e1c,
                0x9029317c,
                0xfdf8e802,
                0x04272f70,
                0x80bb155c,
                0x05282ce3,
                0x95c11548,
                0xe4c66d22,
                0x48c1133f,
                0xc70f86dc,
                0x07f9c9ee,
                0x41041f0f,
                0x404779a4,
                0x5d886e17,
                0x325f51eb,
                0xd59bc0d1,
                0xf2bcc18f,
                0x41113564,
                0x257b7834,
                0x602a9c60,
                0xdff8e8a3,
                0x1f636c1b,
                0x0e12b4c2,
                0x02e1329e,
                0xaf664fd1,
                0xcad18115,
                0x6b2395e0,
                0x333e92e1,
                0x3b240b62,
                0xeebeb922,
                0x85b2a20e,
                0xe6ba0d99,
                0xde720c8c,
                0x2da2f728,
                0xd0127845,
                0x95b794fd,
                0x647d0862,
                0xe7ccf5f0,
                0x5449a36f,
                0x877d48fa,
                0xc39dfd27,
                0xf33e8d1e,
                0x0a476341,
                0x992eff74,
                0x3a6f6eab,
                0xf4f8fd37,
                0xa812dc60,
                0xa1ebddf8,
                0x991be14c,
                0xdb6e6b0d,
                0xc67b5510,
                0x6d672c37,
                0x2765d43b,
                0xdcd0e804,
                0xf1290dc7,
                0xcc00ffa3,
                0xb5390f92,
                0x690fed0b,
                0x667b9ffb,
                0xcedb7d9c,
                0xa091cf0b,
                0xd9155ea3,
                0xbb132f88,
                0x515bad24,
                0x7b9479bf,
                0x763bd6eb,
                0x37392eb3,
                0xcc115979,
                0x8026e297,
                0xf42e312d,
                0x6842ada7,
                0xc66a2b3b,
                0x12754ccc,
                0x782ef11c,
                0x6a124237,
                0xb79251e7,
                0x06a1bbe6,
                0x4bfb6350,
                0x1a6b1018,
                0x11caedfa,
                0x3d25bdd8,
                0xe2e1c3c9,
                0x44421659,
                0x0a121386,
                0xd90cec6e,
                0xd5abea2a,
                0x64af674e,
                0xda86a85f,
                0xbebfe988,
                0x64e4c3fe,
                0x9dbc8057,
                0xf0f7c086,
                0x60787bf8,
                0x6003604d,
                0xd1fd8346,
                0xf6381fb0,
                0x7745ae04,
                0xd736fccc,
                0x83426b33,
                0xf01eab71,
                0xb0804187,
                0x3c005e5f,
                0x77a057be,
                0xbde8ae24,
                0x55464299,
                0xbf582e61,
                0x4e58f48f,
                0xf2ddfda2,
                0xf474ef38,
                0x8789bdc2,
                0x5366f9c3,
                0xc8b38e74,
                0xb475f255,
                0x46fcd9b9,
                0x7aeb2661,
                0x8b1ddf84,
                0x846a0e79,
                0x915f95e2,
                0x466e598e,
                0x20b45770,
                0x8cd55591,
                0xc902de4c,
                0xb90bace1,
                0xbb8205d0,
                0x11a86248,
                0x7574a99e,
                0xb77f19b6,
                0xe0a9dc09,
                0x662d09a1,
                0xc4324633,
                0xe85a1f02,
                0x09f0be8c,
                0x4a99a025,
                0x1d6efe10,
                0x1ab93d1d,
                0x0ba5a4df,
                0xa186f20f,
                0x2868f169,
                0xdcb7da83,
                0x573906fe,
                0xa1e2ce9b,
                0x4fcd7f52,
                0x50115e01,
                0xa70683fa,
                0xa002b5c4,
                0x0de6d027,
                0x9af88c27,
                0x773f8641,
                0xc3604c06,
                0x61a806b5,
                0xf0177a28,
                0xc0f586e0,
                0x006058aa,
                0x30dc7d62,
                0x11e69ed7,
                0x2338ea63,
                0x53c2dd94,
                0xc2c21634,
                0xbbcbee56,
                0x90bcb6de,
                0xebfc7da1,
                0xce591d76,
                0x6f05e409,
                0x4b7c0188,
                0x39720a3d,
                0x7c927c24,
                0x86e3725f,
                0x724d9db9,
                0x1ac15bb4,
                0xd39eb8fc,
                0xed545578,
                0x08fca5b5,
                0xd83d7cd3,
                0x4dad0fc4,
                0x1e50ef5e,
                0xb161e6f8,
                0xa28514d9,
                0x6c51133c,
                0x6fd5c7e7,
                0x56e14ec4,
                0x362abfce,
                0xddc6c837,
                0xd79a3234,
                0x92638212,
                0x670efa8e,
                0x406000e0,
                0x3a39ce37,
                0xd3faf5cf,
                0xabc27737,
                0x5ac52d1b,
                0x5cb0679e,
                0x4fa33742,
                0xd3822740,
                0x99bc9bbe,
                0xd5118e9d,
                0xbf0f7315,
                0xd62d1c7e,
                0xc700c47b,
                0xb78c1b6b,
                0x21a19045,
                0xb26eb1be,
                0x6a366eb4,
                0x5748ab2f,
                0xbc946e79,
                0xc6a376d2,
                0x6549c2c8,
                0x530ff8ee,
                0x468dde7d,
                0xd5730a1d,
                0x4cd04dc6,
                0x2939bbdb,
                0xa9ba4650,
                0xac9526e8,
                0xbe5ee304,
                0xa1fad5f0,
                0x6a2d519a,
                0x63ef8ce2,
                0x9a86ee22,
                0xc089c2b8,
                0x43242ef6,
                0xa51e03aa,
                0x9cf2d0a4,
                0x83c061ba,
                0x9be96a4d,
                0x8fe51550,
                0xba645bd6,
                0x2826a2f9,
                0xa73a3ae1,
                0x4ba99586,
                0xef5562e9,
                0xc72fefd3,
                0xf752f7da,
                0x3f046f69,
                0x77fa0a59,
                0x80e4a915,
                0x87b08601,
                0x9b09e6ad,
                0x3b3ee593,
                0xe990fd5a,
                0x9e34d797,
                0x2cf0b7d9,
                0x022b8b51,
                0x96d5ac3a,
                0x017da67d,
                0xd1cf3ed6,
                0x7c7d2d28,
                0x1f9f25cf,
                0xadf2b89b,
                0x5ad6b472,
                0x5a88f54c,
                0xe029ac71,
                0xe019a5e6,
                0x47b0acfd,
                0xed93fa9b,
                0xe8d3c48d,
                0x283b57cc,
                0xf8d56629,
                0x79132e28,
                0x785f0191,
                0xed756055,
                0xf7960e44,
                0xe3d35e8c,
                0x15056dd4,
                0x88f46dba,
                0x03a16125,
                0x0564f0bd,
                0xc3eb9e15,
                0x3c9057a2,
                0x97271aec,
                0xa93a072a,
                0x1b3f6d9b,
                0x1e6321f5,
                0xf59c66fb,
                0x26dcf319,
                0x7533d928,
                0xb155fdf5,
                0x03563482,
                0x8aba3cbb,
                0x28517711,
                0xc20ad9f8,
                0xabcc5167,
                0xccad925f,
                0x4de81751,
                0x3830dc8e,
                0x379d5862,
                0x9320f991,
                0xea7a90c2,
                0xfb3e7bce,
                0x5121ce64,
                0x774fbe32,
                0xa8b6e37e,
                0xc3293d46,
                0x48de5369,
                0x6413e680,
                0xa2ae0810,
                0xdd6db224,
                0x69852dfd,
                0x09072166,
                0xb39a460a,
                0x6445c0dd,
                0x586cdecf,
                0x1c20c8ae,
                0x5bbef7dd,
                0x1b588d40,
                0xccd2017f,
                0x6bb4e3bb,
                0xdda26a7e,
                0x3a59ff45,
                0x3e350a44,
                0xbcb4cdd5,
                0x72eacea8,
                0xfa6484bb,
                0x8d6612ae,
                0xbf3c6f47,
                0xd29be463,
                0x542f5d9e,
                0xaec2771b,
                0xf64e6370,
                0x740e0d8d,
                0xe75b1357,
                0xf8721671,
                0xaf537d5d,
                0x4040cb08,
                0x4eb4e2cc,
                0x34d2466a,
                0x0115af84,
                0xe1b00428,
                0x95983a1d,
                0x06b89fb4,
                0xce6ea048,
                0x6f3f3b82,
                0x3520ab82,
                0x011a1d4b,
                0x277227f8,
                0x611560b1,
                0xe7933fdc,
                0xbb3a792b,
                0x344525bd,
                0xa08839e1,
                0x51ce794b,
                0x2f32c9b7,
                0xa01fbac9,
                0xe01cc87e,
                0xbcc7d1f6,
                0xcf0111c3,
                0xa1e8aac7,
                0x1a908749,
                0xd44fbd9a,
                0xd0dadecb,
                0xd50ada38,
                0x0339c32a,
                0xc6913667,
                0x8df9317c,
                0xe0b12b4f,
                0xf79e59b7,
                0x43f5bb3a,
                0xf2d519ff,
                0x27d9459c,
                0xbf97222c,
                0x15e6fc2a,
                0x0f91fc71,
                0x9b941525,
                0xfae59361,
                0xceb69ceb,
                0xc2a86459,
                0x12baa8d1,
                0xb6c1075e,
                0xe3056a0c,
                0x10d25065,
                0xcb03a442,
                0xe0ec6e0e,
                0x1698db3b,
                0x4c98a0be,
                0x3278e964,
                0x9f1f9532,
                0xe0d392df,
                0xd3a0342b,
                0x8971f21e,
                0x1b0a7441,
                0x4ba3348c,
                0xc5be7120,
                0xc37632d8,
                0xdf359f8d,
                0x9b992f2e,
                0xe60b6f47,
                0x0fe3f11d,
                0xe54cda54,
                0x1edad891,
                0xce6279cf,
                0xcd3e7e6f,
                0x1618b166,
                0xfd2c1d05,
                0x848fd2c5,
                0xf6fb2299,
                0xf523f357,
                0xa6327623,
                0x93a83531,
                0x56cccd02,
                0xacf08162,
                0x5a75ebb5,
                0x6e163697,
                0x88d273cc,
                0xde966292,
                0x81b949d0,
                0x4c50901b,
                0x71c65614,
                0xe6c6c7bd,
                0x327a140a,
                0x45e1d006,
                0xc3f27b9a,
                0xc9aa53fd,
                0x62a80f00,
                0xbb25bfe2,
                0x35bdd2f6,
                0x71126905,
                0xb2040222,
                0xb6cbcf7c,
                0xcd769c2b,
                0x53113ec0,
                0x1640e3d3,
                0x38abbd60,
                0x2547adf0,
                0xba38209c,
                0xf746ce76,
                0x77afa1c5,
                0x20756060,
                0x85cbfe4e,
                0x8ae88dd8,
                0x7aaaf9b0,
                0x4cf9aa7e,
                0x1948c25c,
                0x02fb8a8c,
                0x01c36ae4,
                0xd6ebe1f9,
                0x90d4f869,
                0xa65cdea0,
                0x3f09252d,
                0xc208e69f,
                0xb74e6132,
                0xce77e25b,
                0x578fdfe3,
                0x3ac372e6,
            ]);
            bf_crypt_ciphertext = new Int32Array([
                0x4f727068,
                0x65616e42,
                0x65686f6c,
                0x64657253,
                0x63727944,
                0x6f756274,
            ]);
        }
    };
});
System.register("https://deno.land/x/bcrypt@v0.2.4/src/main", ["https://deno.land/x/bcrypt@v0.2.4/src/bcrypt/bcrypt"], function (exports_68, context_68) {
    "use strict";
    var bcrypt;
    var __moduleName = context_68 && context_68.id;
    async function hash(plaintext, salt = undefined) {
        let worker = new Worker(new URL("worker.ts", context_68.meta.url).toString(), { type: "module", deno: true });
        worker.postMessage({
            action: "hash",
            payload: {
                plaintext,
                salt,
            },
        });
        return new Promise((resolve) => {
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
        });
    }
    exports_68("hash", hash);
    async function genSalt(log_rounds = undefined) {
        let worker = new Worker(new URL("worker.ts", context_68.meta.url).toString(), { type: "module", deno: true });
        worker.postMessage({
            action: "genSalt",
            payload: {
                log_rounds,
            },
        });
        return new Promise((resolve) => {
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
        });
    }
    exports_68("genSalt", genSalt);
    async function compare(plaintext, hash) {
        let worker = new Worker(new URL("worker.ts", context_68.meta.url).toString(), { type: "module", deno: true });
        worker.postMessage({
            action: "compare",
            payload: {
                plaintext,
                hash,
            },
        });
        return new Promise((resolve) => {
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
        });
    }
    exports_68("compare", compare);
    function compareSync(plaintext, hash) {
        try {
            return bcrypt.checkpw(plaintext, hash);
        }
        catch {
            return false;
        }
    }
    exports_68("compareSync", compareSync);
    function genSaltSync(log_rounds = undefined) {
        return bcrypt.gensalt(log_rounds);
    }
    exports_68("genSaltSync", genSaltSync);
    function hashSync(plaintext, salt = undefined) {
        return bcrypt.hashpw(plaintext, salt);
    }
    exports_68("hashSync", hashSync);
    return {
        setters: [
            function (bcrypt_1) {
                bcrypt = bcrypt_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/bcrypt@v0.2.4/mod", ["https://deno.land/x/bcrypt@v0.2.4/src/main"], function (exports_69, context_69) {
    "use strict";
    var __moduleName = context_69 && context_69.id;
    return {
        setters: [
            function (main_ts_1_1) {
                exports_69({
                    "genSalt": main_ts_1_1["genSalt"],
                    "compare": main_ts_1_1["compare"],
                    "hash": main_ts_1_1["hash"],
                    "genSaltSync": main_ts_1_1["genSaltSync"],
                    "compareSync": main_ts_1_1["compareSync"],
                    "hashSync": main_ts_1_1["hashSync"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/djwt@v1.2/base64/base64", [], function (exports_70, context_70) {
    "use strict";
    var __moduleName = context_70 && context_70.id;
    function convertBase64ToUint8Array(data) {
        const binString = atob(data);
        const size = binString.length;
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        return bytes;
    }
    exports_70("convertBase64ToUint8Array", convertBase64ToUint8Array);
    function convertUint8ArrayToBase64(bytes) {
        const base64abc = (() => {
            const abc = [], A = "A".charCodeAt(0), a = "a".charCodeAt(0), n = "0".charCodeAt(0);
            for (let i = 0; i < 26; ++i) {
                abc.push(String.fromCharCode(A + i));
            }
            for (let i = 0; i < 26; ++i) {
                abc.push(String.fromCharCode(a + i));
            }
            for (let i = 0; i < 10; ++i) {
                abc.push(String.fromCharCode(n + i));
            }
            abc.push("+");
            abc.push("/");
            return abc;
        })();
        let result = "", i, l = bytes.length;
        for (i = 2; i < l; i += 3) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
            result += base64abc[bytes[i] & 0x3f];
        }
        if (i === l + 1) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[(bytes[i - 2] & 0x03) << 4];
            result += "==";
        }
        if (i === l) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += base64abc[(bytes[i - 1] & 0x0f) << 2];
            result += "=";
        }
        return result;
    }
    exports_70("convertUint8ArrayToBase64", convertUint8ArrayToBase64);
    function convertStringToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    exports_70("convertStringToBase64", convertStringToBase64);
    function convertBase64ToString(str) {
        return decodeURIComponent(escape(atob(str)));
    }
    exports_70("convertBase64ToString", convertBase64ToString);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/encoding/hex", [], function (exports_71, context_71) {
    "use strict";
    var hextable;
    var __moduleName = context_71 && context_71.id;
    function errInvalidByte(byte) {
        return new Error("encoding/hex: invalid byte: " +
            new TextDecoder().decode(new Uint8Array([byte])));
    }
    exports_71("errInvalidByte", errInvalidByte);
    function errLength() {
        return new Error("encoding/hex: odd length hex string");
    }
    exports_71("errLength", errLength);
    function fromHexChar(byte) {
        if (48 <= byte && byte <= 57)
            return byte - 48;
        if (97 <= byte && byte <= 102)
            return byte - 97 + 10;
        if (65 <= byte && byte <= 70)
            return byte - 65 + 10;
        throw errInvalidByte(byte);
    }
    function encodedLen(n) {
        return n * 2;
    }
    exports_71("encodedLen", encodedLen);
    function encode(src) {
        const dst = new Uint8Array(encodedLen(src.length));
        for (let i = 0; i < dst.length; i++) {
            const v = src[i];
            dst[i * 2] = hextable[v >> 4];
            dst[i * 2 + 1] = hextable[v & 0x0f];
        }
        return dst;
    }
    exports_71("encode", encode);
    function encodeToString(src) {
        return new TextDecoder().decode(encode(src));
    }
    exports_71("encodeToString", encodeToString);
    function decode(src) {
        const dst = new Uint8Array(decodedLen(src.length));
        for (let i = 0; i < dst.length; i++) {
            const a = fromHexChar(src[i * 2]);
            const b = fromHexChar(src[i * 2 + 1]);
            dst[i] = (a << 4) | b;
        }
        if (src.length % 2 == 1) {
            fromHexChar(src[dst.length * 2]);
            throw errLength();
        }
        return dst;
    }
    exports_71("decode", decode);
    function decodedLen(x) {
        return x >>> 1;
    }
    exports_71("decodedLen", decodedLen);
    function decodeString(s) {
        return decode(new TextEncoder().encode(s));
    }
    exports_71("decodeString", decodeString);
    return {
        setters: [],
        execute: function () {
            hextable = new TextEncoder().encode("0123456789abcdef");
        }
    };
});
System.register("https://deno.land/std@0.63.0/hash/sha256", [], function (exports_72, context_72) {
    "use strict";
    var HEX_CHARS, EXTRA, SHIFT, K, blocks, Sha256, HmacSha256;
    var __moduleName = context_72 && context_72.id;
    return {
        setters: [],
        execute: function () {
            HEX_CHARS = "0123456789abcdef".split("");
            EXTRA = [-2147483648, 8388608, 32768, 128];
            SHIFT = [24, 16, 8, 0];
            K = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
                0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
                0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
                0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
                0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
                0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
                0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
                0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
                0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
            ];
            blocks = [];
            Sha256 = class Sha256 {
                constructor(is224 = false, sharedMemory = false) {
                    this.#lastByteIndex = 0;
                    this.init(is224, sharedMemory);
                }
                #block;
                #blocks;
                #bytes;
                #finalized;
                #first;
                #h0;
                #h1;
                #h2;
                #h3;
                #h4;
                #h5;
                #h6;
                #h7;
                #hashed;
                #hBytes;
                #is224;
                #lastByteIndex;
                #start;
                init(is224, sharedMemory) {
                    if (sharedMemory) {
                        blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        this.#blocks = blocks;
                    }
                    else {
                        this.#blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                    if (is224) {
                        this.#h0 = 0xc1059ed8;
                        this.#h1 = 0x367cd507;
                        this.#h2 = 0x3070dd17;
                        this.#h3 = 0xf70e5939;
                        this.#h4 = 0xffc00b31;
                        this.#h5 = 0x68581511;
                        this.#h6 = 0x64f98fa7;
                        this.#h7 = 0xbefa4fa4;
                    }
                    else {
                        this.#h0 = 0x6a09e667;
                        this.#h1 = 0xbb67ae85;
                        this.#h2 = 0x3c6ef372;
                        this.#h3 = 0xa54ff53a;
                        this.#h4 = 0x510e527f;
                        this.#h5 = 0x9b05688c;
                        this.#h6 = 0x1f83d9ab;
                        this.#h7 = 0x5be0cd19;
                    }
                    this.#block = this.#start = this.#bytes = this.#hBytes = 0;
                    this.#finalized = this.#hashed = false;
                    this.#first = true;
                    this.#is224 = is224;
                }
                update(message) {
                    if (this.#finalized) {
                        return this;
                    }
                    let msg;
                    if (message instanceof ArrayBuffer) {
                        msg = new Uint8Array(message);
                    }
                    else {
                        msg = message;
                    }
                    let index = 0;
                    const length = msg.length;
                    const blocks = this.#blocks;
                    while (index < length) {
                        let i;
                        if (this.#hashed) {
                            this.#hashed = false;
                            blocks[0] = this.#block;
                            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                        }
                        if (typeof msg !== "string") {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                            }
                        }
                        else {
                            for (i = this.#start; index < length && i < 64; ++index) {
                                let code = msg.charCodeAt(index);
                                if (code < 0x80) {
                                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                                }
                                else if (code < 0x800) {
                                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else if (code < 0xd800 || code >= 0xe000) {
                                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else {
                                    code = 0x10000 +
                                        (((code & 0x3ff) << 10) | (msg.charCodeAt(++index) & 0x3ff));
                                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                            }
                        }
                        this.#lastByteIndex = i;
                        this.#bytes += i - this.#start;
                        if (i >= 64) {
                            this.#block = blocks[16];
                            this.#start = i - 64;
                            this.hash();
                            this.#hashed = true;
                        }
                        else {
                            this.#start = i;
                        }
                    }
                    if (this.#bytes > 4294967295) {
                        this.#hBytes += (this.#bytes / 4294967296) << 0;
                        this.#bytes = this.#bytes % 4294967296;
                    }
                    return this;
                }
                finalize() {
                    if (this.#finalized) {
                        return;
                    }
                    this.#finalized = true;
                    const blocks = this.#blocks;
                    const i = this.#lastByteIndex;
                    blocks[16] = this.#block;
                    blocks[i >> 2] |= EXTRA[i & 3];
                    this.#block = blocks[16];
                    if (i >= 56) {
                        if (!this.#hashed) {
                            this.hash();
                        }
                        blocks[0] = this.#block;
                        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
                    }
                    blocks[14] = (this.#hBytes << 3) | (this.#bytes >>> 29);
                    blocks[15] = this.#bytes << 3;
                    this.hash();
                }
                hash() {
                    let a = this.#h0;
                    let b = this.#h1;
                    let c = this.#h2;
                    let d = this.#h3;
                    let e = this.#h4;
                    let f = this.#h5;
                    let g = this.#h6;
                    let h = this.#h7;
                    const blocks = this.#blocks;
                    let s0;
                    let s1;
                    let maj;
                    let t1;
                    let t2;
                    let ch;
                    let ab;
                    let da;
                    let cd;
                    let bc;
                    for (let j = 16; j < 64; ++j) {
                        t1 = blocks[j - 15];
                        s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
                        t1 = blocks[j - 2];
                        s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^
                            (t1 >>> 10);
                        blocks[j] = (blocks[j - 16] + s0 + blocks[j - 7] + s1) << 0;
                    }
                    bc = b & c;
                    for (let j = 0; j < 64; j += 4) {
                        if (this.#first) {
                            if (this.#is224) {
                                ab = 300032;
                                t1 = blocks[0] - 1413257819;
                                h = (t1 - 150054599) << 0;
                                d = (t1 + 24177077) << 0;
                            }
                            else {
                                ab = 704751109;
                                t1 = blocks[0] - 210244248;
                                h = (t1 - 1521486534) << 0;
                                d = (t1 + 143694565) << 0;
                            }
                            this.#first = false;
                        }
                        else {
                            s0 = ((a >>> 2) | (a << 30)) ^
                                ((a >>> 13) | (a << 19)) ^
                                ((a >>> 22) | (a << 10));
                            s1 = ((e >>> 6) | (e << 26)) ^
                                ((e >>> 11) | (e << 21)) ^
                                ((e >>> 25) | (e << 7));
                            ab = a & b;
                            maj = ab ^ (a & c) ^ bc;
                            ch = (e & f) ^ (~e & g);
                            t1 = h + s1 + ch + K[j] + blocks[j];
                            t2 = s0 + maj;
                            h = (d + t1) << 0;
                            d = (t1 + t2) << 0;
                        }
                        s0 = ((d >>> 2) | (d << 30)) ^
                            ((d >>> 13) | (d << 19)) ^
                            ((d >>> 22) | (d << 10));
                        s1 = ((h >>> 6) | (h << 26)) ^
                            ((h >>> 11) | (h << 21)) ^
                            ((h >>> 25) | (h << 7));
                        da = d & a;
                        maj = da ^ (d & b) ^ ab;
                        ch = (h & e) ^ (~h & f);
                        t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
                        t2 = s0 + maj;
                        g = (c + t1) << 0;
                        c = (t1 + t2) << 0;
                        s0 = ((c >>> 2) | (c << 30)) ^
                            ((c >>> 13) | (c << 19)) ^
                            ((c >>> 22) | (c << 10));
                        s1 = ((g >>> 6) | (g << 26)) ^
                            ((g >>> 11) | (g << 21)) ^
                            ((g >>> 25) | (g << 7));
                        cd = c & d;
                        maj = cd ^ (c & a) ^ da;
                        ch = (g & h) ^ (~g & e);
                        t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
                        t2 = s0 + maj;
                        f = (b + t1) << 0;
                        b = (t1 + t2) << 0;
                        s0 = ((b >>> 2) | (b << 30)) ^
                            ((b >>> 13) | (b << 19)) ^
                            ((b >>> 22) | (b << 10));
                        s1 = ((f >>> 6) | (f << 26)) ^
                            ((f >>> 11) | (f << 21)) ^
                            ((f >>> 25) | (f << 7));
                        bc = b & c;
                        maj = bc ^ (b & d) ^ cd;
                        ch = (f & g) ^ (~f & h);
                        t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
                        t2 = s0 + maj;
                        e = (a + t1) << 0;
                        a = (t1 + t2) << 0;
                    }
                    this.#h0 = (this.#h0 + a) << 0;
                    this.#h1 = (this.#h1 + b) << 0;
                    this.#h2 = (this.#h2 + c) << 0;
                    this.#h3 = (this.#h3 + d) << 0;
                    this.#h4 = (this.#h4 + e) << 0;
                    this.#h5 = (this.#h5 + f) << 0;
                    this.#h6 = (this.#h6 + g) << 0;
                    this.#h7 = (this.#h7 + h) << 0;
                }
                hex() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    const h5 = this.#h5;
                    const h6 = this.#h6;
                    const h7 = this.#h7;
                    let hex = HEX_CHARS[(h0 >> 28) & 0x0f] +
                        HEX_CHARS[(h0 >> 24) & 0x0f] +
                        HEX_CHARS[(h0 >> 20) & 0x0f] +
                        HEX_CHARS[(h0 >> 16) & 0x0f] +
                        HEX_CHARS[(h0 >> 12) & 0x0f] +
                        HEX_CHARS[(h0 >> 8) & 0x0f] +
                        HEX_CHARS[(h0 >> 4) & 0x0f] +
                        HEX_CHARS[h0 & 0x0f] +
                        HEX_CHARS[(h1 >> 28) & 0x0f] +
                        HEX_CHARS[(h1 >> 24) & 0x0f] +
                        HEX_CHARS[(h1 >> 20) & 0x0f] +
                        HEX_CHARS[(h1 >> 16) & 0x0f] +
                        HEX_CHARS[(h1 >> 12) & 0x0f] +
                        HEX_CHARS[(h1 >> 8) & 0x0f] +
                        HEX_CHARS[(h1 >> 4) & 0x0f] +
                        HEX_CHARS[h1 & 0x0f] +
                        HEX_CHARS[(h2 >> 28) & 0x0f] +
                        HEX_CHARS[(h2 >> 24) & 0x0f] +
                        HEX_CHARS[(h2 >> 20) & 0x0f] +
                        HEX_CHARS[(h2 >> 16) & 0x0f] +
                        HEX_CHARS[(h2 >> 12) & 0x0f] +
                        HEX_CHARS[(h2 >> 8) & 0x0f] +
                        HEX_CHARS[(h2 >> 4) & 0x0f] +
                        HEX_CHARS[h2 & 0x0f] +
                        HEX_CHARS[(h3 >> 28) & 0x0f] +
                        HEX_CHARS[(h3 >> 24) & 0x0f] +
                        HEX_CHARS[(h3 >> 20) & 0x0f] +
                        HEX_CHARS[(h3 >> 16) & 0x0f] +
                        HEX_CHARS[(h3 >> 12) & 0x0f] +
                        HEX_CHARS[(h3 >> 8) & 0x0f] +
                        HEX_CHARS[(h3 >> 4) & 0x0f] +
                        HEX_CHARS[h3 & 0x0f] +
                        HEX_CHARS[(h4 >> 28) & 0x0f] +
                        HEX_CHARS[(h4 >> 24) & 0x0f] +
                        HEX_CHARS[(h4 >> 20) & 0x0f] +
                        HEX_CHARS[(h4 >> 16) & 0x0f] +
                        HEX_CHARS[(h4 >> 12) & 0x0f] +
                        HEX_CHARS[(h4 >> 8) & 0x0f] +
                        HEX_CHARS[(h4 >> 4) & 0x0f] +
                        HEX_CHARS[h4 & 0x0f] +
                        HEX_CHARS[(h5 >> 28) & 0x0f] +
                        HEX_CHARS[(h5 >> 24) & 0x0f] +
                        HEX_CHARS[(h5 >> 20) & 0x0f] +
                        HEX_CHARS[(h5 >> 16) & 0x0f] +
                        HEX_CHARS[(h5 >> 12) & 0x0f] +
                        HEX_CHARS[(h5 >> 8) & 0x0f] +
                        HEX_CHARS[(h5 >> 4) & 0x0f] +
                        HEX_CHARS[h5 & 0x0f] +
                        HEX_CHARS[(h6 >> 28) & 0x0f] +
                        HEX_CHARS[(h6 >> 24) & 0x0f] +
                        HEX_CHARS[(h6 >> 20) & 0x0f] +
                        HEX_CHARS[(h6 >> 16) & 0x0f] +
                        HEX_CHARS[(h6 >> 12) & 0x0f] +
                        HEX_CHARS[(h6 >> 8) & 0x0f] +
                        HEX_CHARS[(h6 >> 4) & 0x0f] +
                        HEX_CHARS[h6 & 0x0f];
                    if (!this.#is224) {
                        hex += HEX_CHARS[(h7 >> 28) & 0x0f] +
                            HEX_CHARS[(h7 >> 24) & 0x0f] +
                            HEX_CHARS[(h7 >> 20) & 0x0f] +
                            HEX_CHARS[(h7 >> 16) & 0x0f] +
                            HEX_CHARS[(h7 >> 12) & 0x0f] +
                            HEX_CHARS[(h7 >> 8) & 0x0f] +
                            HEX_CHARS[(h7 >> 4) & 0x0f] +
                            HEX_CHARS[h7 & 0x0f];
                    }
                    return hex;
                }
                toString() {
                    return this.hex();
                }
                digest() {
                    this.finalize();
                    const h0 = this.#h0;
                    const h1 = this.#h1;
                    const h2 = this.#h2;
                    const h3 = this.#h3;
                    const h4 = this.#h4;
                    const h5 = this.#h5;
                    const h6 = this.#h6;
                    const h7 = this.#h7;
                    const arr = [
                        (h0 >> 24) & 0xff,
                        (h0 >> 16) & 0xff,
                        (h0 >> 8) & 0xff,
                        h0 & 0xff,
                        (h1 >> 24) & 0xff,
                        (h1 >> 16) & 0xff,
                        (h1 >> 8) & 0xff,
                        h1 & 0xff,
                        (h2 >> 24) & 0xff,
                        (h2 >> 16) & 0xff,
                        (h2 >> 8) & 0xff,
                        h2 & 0xff,
                        (h3 >> 24) & 0xff,
                        (h3 >> 16) & 0xff,
                        (h3 >> 8) & 0xff,
                        h3 & 0xff,
                        (h4 >> 24) & 0xff,
                        (h4 >> 16) & 0xff,
                        (h4 >> 8) & 0xff,
                        h4 & 0xff,
                        (h5 >> 24) & 0xff,
                        (h5 >> 16) & 0xff,
                        (h5 >> 8) & 0xff,
                        h5 & 0xff,
                        (h6 >> 24) & 0xff,
                        (h6 >> 16) & 0xff,
                        (h6 >> 8) & 0xff,
                        h6 & 0xff,
                    ];
                    if (!this.#is224) {
                        arr.push((h7 >> 24) & 0xff, (h7 >> 16) & 0xff, (h7 >> 8) & 0xff, h7 & 0xff);
                    }
                    return arr;
                }
                array() {
                    return this.digest();
                }
                arrayBuffer() {
                    this.finalize();
                    const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
                    const dataView = new DataView(buffer);
                    dataView.setUint32(0, this.#h0);
                    dataView.setUint32(4, this.#h1);
                    dataView.setUint32(8, this.#h2);
                    dataView.setUint32(12, this.#h3);
                    dataView.setUint32(16, this.#h4);
                    dataView.setUint32(20, this.#h5);
                    dataView.setUint32(24, this.#h6);
                    if (!this.#is224) {
                        dataView.setUint32(28, this.#h7);
                    }
                    return buffer;
                }
            };
            exports_72("Sha256", Sha256);
            HmacSha256 = class HmacSha256 extends Sha256 {
                constructor(secretKey, is224 = false, sharedMemory = false) {
                    super(is224, sharedMemory);
                    let key;
                    if (typeof secretKey === "string") {
                        const bytes = [];
                        const length = secretKey.length;
                        let index = 0;
                        for (let i = 0; i < length; ++i) {
                            let code = secretKey.charCodeAt(i);
                            if (code < 0x80) {
                                bytes[index++] = code;
                            }
                            else if (code < 0x800) {
                                bytes[index++] = 0xc0 | (code >> 6);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else if (code < 0xd800 || code >= 0xe000) {
                                bytes[index++] = 0xe0 | (code >> 12);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else {
                                code = 0x10000 +
                                    (((code & 0x3ff) << 10) | (secretKey.charCodeAt(++i) & 0x3ff));
                                bytes[index++] = 0xf0 | (code >> 18);
                                bytes[index++] = 0x80 | ((code >> 12) & 0x3f);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                        }
                        key = bytes;
                    }
                    else {
                        if (secretKey instanceof ArrayBuffer) {
                            key = new Uint8Array(secretKey);
                        }
                        else {
                            key = secretKey;
                        }
                    }
                    if (key.length > 64) {
                        key = new Sha256(is224, true).update(key).array();
                    }
                    const oKeyPad = [];
                    const iKeyPad = [];
                    for (let i = 0; i < 64; ++i) {
                        const b = key[i] || 0;
                        oKeyPad[i] = 0x5c ^ b;
                        iKeyPad[i] = 0x36 ^ b;
                    }
                    this.update(iKeyPad);
                    this.#oKeyPad = oKeyPad;
                    this.#inner = true;
                    this.#is224 = is224;
                    this.#sharedMemory = sharedMemory;
                }
                #inner;
                #is224;
                #oKeyPad;
                #sharedMemory;
                finalize() {
                    super.finalize();
                    if (this.#inner) {
                        this.#inner = false;
                        const innerHash = this.array();
                        super.init(this.#is224, this.#sharedMemory);
                        this.update(this.#oKeyPad);
                        this.update(innerHash);
                        super.finalize();
                    }
                }
            };
            exports_72("HmacSha256", HmacSha256);
        }
    };
});
System.register("https://deno.land/std@0.63.0/hash/sha512", [], function (exports_73, context_73) {
    "use strict";
    var HEX_CHARS, EXTRA, SHIFT, K, blocks, Sha512, HmacSha512;
    var __moduleName = context_73 && context_73.id;
    return {
        setters: [],
        execute: function () {
            HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
            EXTRA = [-2147483648, 8388608, 32768, 128];
            SHIFT = [24, 16, 8, 0];
            K = [
                0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc, 0x3956c25b,
                0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118, 0xd807aa98, 0xa3030242,
                0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74, 0xf27b896f, 0x80deb1fe,
                0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694, 0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
                0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc,
                0xbd41fbd4, 0x76f988da, 0x831153b5, 0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f,
                0xbf597fc7, 0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967,
                0x0a0e6e70, 0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
                0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b, 0xa2bfe8a1,
                0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218,
                0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8, 0x19a4c116, 0xb8d2d0c8, 0x1e376c08,
                0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
                0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3, 0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814,
                0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915,
                0xc67178f2, 0xe372532b, 0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f,
                0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
                0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c, 0x4cc5d4be,
                0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
            ];
            blocks = [];
            Sha512 = class Sha512 {
                constructor(bits = 512, sharedMemory = false) {
                    this.#lastByteIndex = 0;
                    this.init(bits, sharedMemory);
                }
                #blocks;
                #block;
                #bits;
                #start;
                #bytes;
                #hBytes;
                #lastByteIndex;
                #finalized;
                #hashed;
                #h0h;
                #h0l;
                #h1h;
                #h1l;
                #h2h;
                #h2l;
                #h3h;
                #h3l;
                #h4h;
                #h4l;
                #h5h;
                #h5l;
                #h6h;
                #h6l;
                #h7h;
                #h7l;
                init(bits, sharedMemory) {
                    if (sharedMemory) {
                        blocks[0] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] =
                            blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] =
                                blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] =
                                    blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
                        this.#blocks = blocks;
                    }
                    else {
                        this.#blocks =
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                    if (bits === 224) {
                        this.#h0h = 0x8c3d37c8;
                        this.#h0l = 0x19544da2;
                        this.#h1h = 0x73e19966;
                        this.#h1l = 0x89dcd4d6;
                        this.#h2h = 0x1dfab7ae;
                        this.#h2l = 0x32ff9c82;
                        this.#h3h = 0x679dd514;
                        this.#h3l = 0x582f9fcf;
                        this.#h4h = 0x0f6d2b69;
                        this.#h4l = 0x7bd44da8;
                        this.#h5h = 0x77e36f73;
                        this.#h5l = 0x04c48942;
                        this.#h6h = 0x3f9d85a8;
                        this.#h6l = 0x6a1d36c8;
                        this.#h7h = 0x1112e6ad;
                        this.#h7l = 0x91d692a1;
                    }
                    else if (bits === 256) {
                        this.#h0h = 0x22312194;
                        this.#h0l = 0xfc2bf72c;
                        this.#h1h = 0x9f555fa3;
                        this.#h1l = 0xc84c64c2;
                        this.#h2h = 0x2393b86b;
                        this.#h2l = 0x6f53b151;
                        this.#h3h = 0x96387719;
                        this.#h3l = 0x5940eabd;
                        this.#h4h = 0x96283ee2;
                        this.#h4l = 0xa88effe3;
                        this.#h5h = 0xbe5e1e25;
                        this.#h5l = 0x53863992;
                        this.#h6h = 0x2b0199fc;
                        this.#h6l = 0x2c85b8aa;
                        this.#h7h = 0x0eb72ddc;
                        this.#h7l = 0x81c52ca2;
                    }
                    else if (bits === 384) {
                        this.#h0h = 0xcbbb9d5d;
                        this.#h0l = 0xc1059ed8;
                        this.#h1h = 0x629a292a;
                        this.#h1l = 0x367cd507;
                        this.#h2h = 0x9159015a;
                        this.#h2l = 0x3070dd17;
                        this.#h3h = 0x152fecd8;
                        this.#h3l = 0xf70e5939;
                        this.#h4h = 0x67332667;
                        this.#h4l = 0xffc00b31;
                        this.#h5h = 0x8eb44a87;
                        this.#h5l = 0x68581511;
                        this.#h6h = 0xdb0c2e0d;
                        this.#h6l = 0x64f98fa7;
                        this.#h7h = 0x47b5481d;
                        this.#h7l = 0xbefa4fa4;
                    }
                    else {
                        this.#h0h = 0x6a09e667;
                        this.#h0l = 0xf3bcc908;
                        this.#h1h = 0xbb67ae85;
                        this.#h1l = 0x84caa73b;
                        this.#h2h = 0x3c6ef372;
                        this.#h2l = 0xfe94f82b;
                        this.#h3h = 0xa54ff53a;
                        this.#h3l = 0x5f1d36f1;
                        this.#h4h = 0x510e527f;
                        this.#h4l = 0xade682d1;
                        this.#h5h = 0x9b05688c;
                        this.#h5l = 0x2b3e6c1f;
                        this.#h6h = 0x1f83d9ab;
                        this.#h6l = 0xfb41bd6b;
                        this.#h7h = 0x5be0cd19;
                        this.#h7l = 0x137e2179;
                    }
                    this.#bits = bits;
                    this.#block = this.#start = this.#bytes = this.#hBytes = 0;
                    this.#finalized = this.#hashed = false;
                }
                update(message) {
                    if (this.#finalized) {
                        return this;
                    }
                    let msg;
                    if (message instanceof ArrayBuffer) {
                        msg = new Uint8Array(message);
                    }
                    else {
                        msg = message;
                    }
                    const length = msg.length;
                    const blocks = this.#blocks;
                    let index = 0;
                    while (index < length) {
                        let i;
                        if (this.#hashed) {
                            this.#hashed = false;
                            blocks[0] = this.#block;
                            blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] =
                                blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] =
                                    blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] =
                                        blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
                        }
                        if (typeof msg !== "string") {
                            for (i = this.#start; index < length && i < 128; ++index) {
                                blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                            }
                        }
                        else {
                            for (i = this.#start; index < length && i < 128; ++index) {
                                let code = msg.charCodeAt(index);
                                if (code < 0x80) {
                                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                                }
                                else if (code < 0x800) {
                                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else if (code < 0xd800 || code >= 0xe000) {
                                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                                else {
                                    code = 0x10000 + (((code & 0x3ff) << 10) | (msg.charCodeAt(++index) & 0x3ff));
                                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                                }
                            }
                        }
                        this.#lastByteIndex = i;
                        this.#bytes += i - this.#start;
                        if (i >= 128) {
                            this.#block = blocks[32];
                            this.#start = i - 128;
                            this.hash();
                            this.#hashed = true;
                        }
                        else {
                            this.#start = i;
                        }
                    }
                    if (this.#bytes > 4294967295) {
                        this.#hBytes += (this.#bytes / 4294967296) << 0;
                        this.#bytes = this.#bytes % 4294967296;
                    }
                    return this;
                }
                finalize() {
                    if (this.#finalized) {
                        return;
                    }
                    this.#finalized = true;
                    const blocks = this.#blocks;
                    const i = this.#lastByteIndex;
                    blocks[32] = this.#block;
                    blocks[i >> 2] |= EXTRA[i & 3];
                    this.#block = blocks[32];
                    if (i >= 112) {
                        if (!this.#hashed) {
                            this.hash();
                        }
                        blocks[0] = this.#block;
                        blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] =
                            blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] =
                                blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] =
                                    blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
                    }
                    blocks[30] = (this.#hBytes << 3) | (this.#bytes >>> 29);
                    blocks[31] = this.#bytes << 3;
                    this.hash();
                }
                hash() {
                    const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l;
                    let s0h, s0l, s1h, s1l, c1, c2, c3, c4, abh, abl, dah, dal, cdh, cdl, bch, bcl, majh, majl, t1h, t1l, t2h, t2l, chh, chl;
                    const blocks = this.#blocks;
                    for (let j = 32; j < 160; j += 2) {
                        t1h = blocks[j - 30];
                        t1l = blocks[j - 29];
                        s0h = ((t1h >>> 1) | (t1l << 31)) ^ ((t1h >>> 8) | (t1l << 24)) ^ (t1h >>> 7);
                        s0l = ((t1l >>> 1) | (t1h << 31)) ^ ((t1l >>> 8) | (t1h << 24)) ^ ((t1l >>> 7) | (t1h << 25));
                        t1h = blocks[j - 4];
                        t1l = blocks[j - 3];
                        s1h = ((t1h >>> 19) | (t1l << 13)) ^ ((t1l >>> 29) | (t1h << 3)) ^ (t1h >>> 6);
                        s1l = ((t1l >>> 19) | (t1h << 13)) ^ ((t1h >>> 29) | (t1l << 3)) ^ ((t1l >>> 6) | (t1h << 26));
                        t1h = blocks[j - 32];
                        t1l = blocks[j - 31];
                        t2h = blocks[j - 14];
                        t2l = blocks[j - 13];
                        c1 = (t2l & 0xffff) + (t1l & 0xffff) + (s0l & 0xffff) + (s1l & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (s0l >>> 16) + (s1l >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (s0h & 0xffff) + (s1h & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (s0h >>> 16) + (s1h >>> 16) + (c3 >>> 16);
                        blocks[j] = (c4 << 16) | (c3 & 0xffff);
                        blocks[j + 1] = (c2 << 16) | (c1 & 0xffff);
                    }
                    let ah = h0h, al = h0l, bh = h1h, bl = h1l, ch = h2h, cl = h2l, dh = h3h, dl = h3l, eh = h4h, el = h4l, fh = h5h, fl = h5l, gh = h6h, gl = h6l, hh = h7h, hl = h7l;
                    bch = bh & ch;
                    bcl = bl & cl;
                    for (let j = 0; j < 160; j += 8) {
                        s0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
                        s0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
                        s1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
                        s1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
                        abh = ah & bh;
                        abl = al & bl;
                        majh = abh ^ (ah & ch) ^ bch;
                        majl = abl ^ (al & cl) ^ bcl;
                        chh = (eh & fh) ^ (~eh & gh);
                        chl = (el & fl) ^ (~el & gl);
                        t1h = blocks[j];
                        t1l = blocks[j + 1];
                        t2h = K[j];
                        t2l = K[j + 1];
                        c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (hl & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (hl >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (hh & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (hh >>> 16) + (c3 >>> 16);
                        t1h = (c4 << 16) | (c3 & 0xffff);
                        t1l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (majl & 0xffff) + (s0l & 0xffff);
                        c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
                        c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
                        c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
                        t2h = (c4 << 16) | (c3 & 0xffff);
                        t2l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (dl & 0xffff) + (t1l & 0xffff);
                        c2 = (dl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (dh & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (dh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        hh = (c4 << 16) | (c3 & 0xffff);
                        hl = (c2 << 16) | (c1 & 0xffff);
                        c1 = (t2l & 0xffff) + (t1l & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        dh = (c4 << 16) | (c3 & 0xffff);
                        dl = (c2 << 16) | (c1 & 0xffff);
                        s0h = ((dh >>> 28) | (dl << 4)) ^ ((dl >>> 2) | (dh << 30)) ^ ((dl >>> 7) | (dh << 25));
                        s0l = ((dl >>> 28) | (dh << 4)) ^ ((dh >>> 2) | (dl << 30)) ^ ((dh >>> 7) | (dl << 25));
                        s1h = ((hh >>> 14) | (hl << 18)) ^ ((hh >>> 18) | (hl << 14)) ^ ((hl >>> 9) | (hh << 23));
                        s1l = ((hl >>> 14) | (hh << 18)) ^ ((hl >>> 18) | (hh << 14)) ^ ((hh >>> 9) | (hl << 23));
                        dah = dh & ah;
                        dal = dl & al;
                        majh = dah ^ (dh & bh) ^ abh;
                        majl = dal ^ (dl & bl) ^ abl;
                        chh = (hh & eh) ^ (~hh & fh);
                        chl = (hl & el) ^ (~hl & fl);
                        t1h = blocks[j + 2];
                        t1l = blocks[j + 3];
                        t2h = K[j + 2];
                        t2l = K[j + 3];
                        c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (gl & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (gl >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (gh & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (gh >>> 16) + (c3 >>> 16);
                        t1h = (c4 << 16) | (c3 & 0xffff);
                        t1l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (majl & 0xffff) + (s0l & 0xffff);
                        c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
                        c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
                        c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
                        t2h = (c4 << 16) | (c3 & 0xffff);
                        t2l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (cl & 0xffff) + (t1l & 0xffff);
                        c2 = (cl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (ch & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (ch >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        gh = (c4 << 16) | (c3 & 0xffff);
                        gl = (c2 << 16) | (c1 & 0xffff);
                        c1 = (t2l & 0xffff) + (t1l & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        ch = (c4 << 16) | (c3 & 0xffff);
                        cl = (c2 << 16) | (c1 & 0xffff);
                        s0h = ((ch >>> 28) | (cl << 4)) ^ ((cl >>> 2) | (ch << 30)) ^ ((cl >>> 7) | (ch << 25));
                        s0l = ((cl >>> 28) | (ch << 4)) ^ ((ch >>> 2) | (cl << 30)) ^ ((ch >>> 7) | (cl << 25));
                        s1h = ((gh >>> 14) | (gl << 18)) ^ ((gh >>> 18) | (gl << 14)) ^ ((gl >>> 9) | (gh << 23));
                        s1l = ((gl >>> 14) | (gh << 18)) ^ ((gl >>> 18) | (gh << 14)) ^ ((gh >>> 9) | (gl << 23));
                        cdh = ch & dh;
                        cdl = cl & dl;
                        majh = cdh ^ (ch & ah) ^ dah;
                        majl = cdl ^ (cl & al) ^ dal;
                        chh = (gh & hh) ^ (~gh & eh);
                        chl = (gl & hl) ^ (~gl & el);
                        t1h = blocks[j + 4];
                        t1l = blocks[j + 5];
                        t2h = K[j + 4];
                        t2l = K[j + 5];
                        c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (fl & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (fl >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (fh & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (fh >>> 16) + (c3 >>> 16);
                        t1h = (c4 << 16) | (c3 & 0xffff);
                        t1l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (majl & 0xffff) + (s0l & 0xffff);
                        c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
                        c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
                        c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
                        t2h = (c4 << 16) | (c3 & 0xffff);
                        t2l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (bl & 0xffff) + (t1l & 0xffff);
                        c2 = (bl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (bh & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (bh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        fh = (c4 << 16) | (c3 & 0xffff);
                        fl = (c2 << 16) | (c1 & 0xffff);
                        c1 = (t2l & 0xffff) + (t1l & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        bh = (c4 << 16) | (c3 & 0xffff);
                        bl = (c2 << 16) | (c1 & 0xffff);
                        s0h = ((bh >>> 28) | (bl << 4)) ^ ((bl >>> 2) | (bh << 30)) ^ ((bl >>> 7) | (bh << 25));
                        s0l = ((bl >>> 28) | (bh << 4)) ^ ((bh >>> 2) | (bl << 30)) ^ ((bh >>> 7) | (bl << 25));
                        s1h = ((fh >>> 14) | (fl << 18)) ^ ((fh >>> 18) | (fl << 14)) ^ ((fl >>> 9) | (fh << 23));
                        s1l = ((fl >>> 14) | (fh << 18)) ^ ((fl >>> 18) | (fh << 14)) ^ ((fh >>> 9) | (fl << 23));
                        bch = bh & ch;
                        bcl = bl & cl;
                        majh = bch ^ (bh & dh) ^ cdh;
                        majl = bcl ^ (bl & dl) ^ cdl;
                        chh = (fh & gh) ^ (~fh & hh);
                        chl = (fl & gl) ^ (~fl & hl);
                        t1h = blocks[j + 6];
                        t1l = blocks[j + 7];
                        t2h = K[j + 6];
                        t2l = K[j + 7];
                        c1 = (t2l & 0xffff) + (t1l & 0xffff) + (chl & 0xffff) + (s1l & 0xffff) + (el & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (el >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (chh & 0xffff) + (s1h & 0xffff) + (eh & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (eh >>> 16) + (c3 >>> 16);
                        t1h = (c4 << 16) | (c3 & 0xffff);
                        t1l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (majl & 0xffff) + (s0l & 0xffff);
                        c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
                        c3 = (majh & 0xffff) + (s0h & 0xffff) + (c2 >>> 16);
                        c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
                        t2h = (c4 << 16) | (c3 & 0xffff);
                        t2l = (c2 << 16) | (c1 & 0xffff);
                        c1 = (al & 0xffff) + (t1l & 0xffff);
                        c2 = (al >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (ah & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (ah >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        eh = (c4 << 16) | (c3 & 0xffff);
                        el = (c2 << 16) | (c1 & 0xffff);
                        c1 = (t2l & 0xffff) + (t1l & 0xffff);
                        c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
                        c3 = (t2h & 0xffff) + (t1h & 0xffff) + (c2 >>> 16);
                        c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
                        ah = (c4 << 16) | (c3 & 0xffff);
                        al = (c2 << 16) | (c1 & 0xffff);
                    }
                    c1 = (h0l & 0xffff) + (al & 0xffff);
                    c2 = (h0l >>> 16) + (al >>> 16) + (c1 >>> 16);
                    c3 = (h0h & 0xffff) + (ah & 0xffff) + (c2 >>> 16);
                    c4 = (h0h >>> 16) + (ah >>> 16) + (c3 >>> 16);
                    this.#h0h = (c4 << 16) | (c3 & 0xffff);
                    this.#h0l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h1l & 0xffff) + (bl & 0xffff);
                    c2 = (h1l >>> 16) + (bl >>> 16) + (c1 >>> 16);
                    c3 = (h1h & 0xffff) + (bh & 0xffff) + (c2 >>> 16);
                    c4 = (h1h >>> 16) + (bh >>> 16) + (c3 >>> 16);
                    this.#h1h = (c4 << 16) | (c3 & 0xffff);
                    this.#h1l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h2l & 0xffff) + (cl & 0xffff);
                    c2 = (h2l >>> 16) + (cl >>> 16) + (c1 >>> 16);
                    c3 = (h2h & 0xffff) + (ch & 0xffff) + (c2 >>> 16);
                    c4 = (h2h >>> 16) + (ch >>> 16) + (c3 >>> 16);
                    this.#h2h = (c4 << 16) | (c3 & 0xffff);
                    this.#h2l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h3l & 0xffff) + (dl & 0xffff);
                    c2 = (h3l >>> 16) + (dl >>> 16) + (c1 >>> 16);
                    c3 = (h3h & 0xffff) + (dh & 0xffff) + (c2 >>> 16);
                    c4 = (h3h >>> 16) + (dh >>> 16) + (c3 >>> 16);
                    this.#h3h = (c4 << 16) | (c3 & 0xffff);
                    this.#h3l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h4l & 0xffff) + (el & 0xffff);
                    c2 = (h4l >>> 16) + (el >>> 16) + (c1 >>> 16);
                    c3 = (h4h & 0xffff) + (eh & 0xffff) + (c2 >>> 16);
                    c4 = (h4h >>> 16) + (eh >>> 16) + (c3 >>> 16);
                    this.#h4h = (c4 << 16) | (c3 & 0xffff);
                    this.#h4l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h5l & 0xffff) + (fl & 0xffff);
                    c2 = (h5l >>> 16) + (fl >>> 16) + (c1 >>> 16);
                    c3 = (h5h & 0xffff) + (fh & 0xffff) + (c2 >>> 16);
                    c4 = (h5h >>> 16) + (fh >>> 16) + (c3 >>> 16);
                    this.#h5h = (c4 << 16) | (c3 & 0xffff);
                    this.#h5l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h6l & 0xffff) + (gl & 0xffff);
                    c2 = (h6l >>> 16) + (gl >>> 16) + (c1 >>> 16);
                    c3 = (h6h & 0xffff) + (gh & 0xffff) + (c2 >>> 16);
                    c4 = (h6h >>> 16) + (gh >>> 16) + (c3 >>> 16);
                    this.#h6h = (c4 << 16) | (c3 & 0xffff);
                    this.#h6l = (c2 << 16) | (c1 & 0xffff);
                    c1 = (h7l & 0xffff) + (hl & 0xffff);
                    c2 = (h7l >>> 16) + (hl >>> 16) + (c1 >>> 16);
                    c3 = (h7h & 0xffff) + (hh & 0xffff) + (c2 >>> 16);
                    c4 = (h7h >>> 16) + (hh >>> 16) + (c3 >>> 16);
                    this.#h7h = (c4 << 16) | (c3 & 0xffff);
                    this.#h7l = (c2 << 16) | (c1 & 0xffff);
                }
                hex() {
                    this.finalize();
                    const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l, bits = this.#bits;
                    let hex = HEX_CHARS[(h0h >> 28) & 0x0f] + HEX_CHARS[(h0h >> 24) & 0x0f] +
                        HEX_CHARS[(h0h >> 20) & 0x0f] + HEX_CHARS[(h0h >> 16) & 0x0f] +
                        HEX_CHARS[(h0h >> 12) & 0x0f] + HEX_CHARS[(h0h >> 8) & 0x0f] +
                        HEX_CHARS[(h0h >> 4) & 0x0f] + HEX_CHARS[h0h & 0x0f] +
                        HEX_CHARS[(h0l >> 28) & 0x0f] + HEX_CHARS[(h0l >> 24) & 0x0f] +
                        HEX_CHARS[(h0l >> 20) & 0x0f] + HEX_CHARS[(h0l >> 16) & 0x0f] +
                        HEX_CHARS[(h0l >> 12) & 0x0f] + HEX_CHARS[(h0l >> 8) & 0x0f] +
                        HEX_CHARS[(h0l >> 4) & 0x0f] + HEX_CHARS[h0l & 0x0f] +
                        HEX_CHARS[(h1h >> 28) & 0x0f] + HEX_CHARS[(h1h >> 24) & 0x0f] +
                        HEX_CHARS[(h1h >> 20) & 0x0f] + HEX_CHARS[(h1h >> 16) & 0x0f] +
                        HEX_CHARS[(h1h >> 12) & 0x0f] + HEX_CHARS[(h1h >> 8) & 0x0f] +
                        HEX_CHARS[(h1h >> 4) & 0x0f] + HEX_CHARS[h1h & 0x0f] +
                        HEX_CHARS[(h1l >> 28) & 0x0f] + HEX_CHARS[(h1l >> 24) & 0x0f] +
                        HEX_CHARS[(h1l >> 20) & 0x0f] + HEX_CHARS[(h1l >> 16) & 0x0f] +
                        HEX_CHARS[(h1l >> 12) & 0x0f] + HEX_CHARS[(h1l >> 8) & 0x0f] +
                        HEX_CHARS[(h1l >> 4) & 0x0f] + HEX_CHARS[h1l & 0x0f] +
                        HEX_CHARS[(h2h >> 28) & 0x0f] + HEX_CHARS[(h2h >> 24) & 0x0f] +
                        HEX_CHARS[(h2h >> 20) & 0x0f] + HEX_CHARS[(h2h >> 16) & 0x0f] +
                        HEX_CHARS[(h2h >> 12) & 0x0f] + HEX_CHARS[(h2h >> 8) & 0x0f] +
                        HEX_CHARS[(h2h >> 4) & 0x0f] + HEX_CHARS[h2h & 0x0f] +
                        HEX_CHARS[(h2l >> 28) & 0x0f] + HEX_CHARS[(h2l >> 24) & 0x0f] +
                        HEX_CHARS[(h2l >> 20) & 0x0f] + HEX_CHARS[(h2l >> 16) & 0x0f] +
                        HEX_CHARS[(h2l >> 12) & 0x0f] + HEX_CHARS[(h2l >> 8) & 0x0f] +
                        HEX_CHARS[(h2l >> 4) & 0x0f] + HEX_CHARS[h2l & 0x0f] +
                        HEX_CHARS[(h3h >> 28) & 0x0f] + HEX_CHARS[(h3h >> 24) & 0x0f] +
                        HEX_CHARS[(h3h >> 20) & 0x0f] + HEX_CHARS[(h3h >> 16) & 0x0f] +
                        HEX_CHARS[(h3h >> 12) & 0x0f] + HEX_CHARS[(h3h >> 8) & 0x0f] +
                        HEX_CHARS[(h3h >> 4) & 0x0f] + HEX_CHARS[h3h & 0x0f];
                    if (bits >= 256) {
                        hex +=
                            HEX_CHARS[(h3l >> 28) & 0x0f] + HEX_CHARS[(h3l >> 24) & 0x0f] +
                                HEX_CHARS[(h3l >> 20) & 0x0f] + HEX_CHARS[(h3l >> 16) & 0x0f] +
                                HEX_CHARS[(h3l >> 12) & 0x0f] + HEX_CHARS[(h3l >> 8) & 0x0f] +
                                HEX_CHARS[(h3l >> 4) & 0x0f] + HEX_CHARS[h3l & 0x0f];
                    }
                    if (bits >= 384) {
                        hex +=
                            HEX_CHARS[(h4h >> 28) & 0x0f] + HEX_CHARS[(h4h >> 24) & 0x0f] +
                                HEX_CHARS[(h4h >> 20) & 0x0f] + HEX_CHARS[(h4h >> 16) & 0x0f] +
                                HEX_CHARS[(h4h >> 12) & 0x0f] + HEX_CHARS[(h4h >> 8) & 0x0f] +
                                HEX_CHARS[(h4h >> 4) & 0x0f] + HEX_CHARS[h4h & 0x0f] +
                                HEX_CHARS[(h4l >> 28) & 0x0f] + HEX_CHARS[(h4l >> 24) & 0x0f] +
                                HEX_CHARS[(h4l >> 20) & 0x0f] + HEX_CHARS[(h4l >> 16) & 0x0f] +
                                HEX_CHARS[(h4l >> 12) & 0x0f] + HEX_CHARS[(h4l >> 8) & 0x0f] +
                                HEX_CHARS[(h4l >> 4) & 0x0f] + HEX_CHARS[h4l & 0x0f] +
                                HEX_CHARS[(h5h >> 28) & 0x0f] + HEX_CHARS[(h5h >> 24) & 0x0f] +
                                HEX_CHARS[(h5h >> 20) & 0x0f] + HEX_CHARS[(h5h >> 16) & 0x0f] +
                                HEX_CHARS[(h5h >> 12) & 0x0f] + HEX_CHARS[(h5h >> 8) & 0x0f] +
                                HEX_CHARS[(h5h >> 4) & 0x0f] + HEX_CHARS[h5h & 0x0f] +
                                HEX_CHARS[(h5l >> 28) & 0x0f] + HEX_CHARS[(h5l >> 24) & 0x0f] +
                                HEX_CHARS[(h5l >> 20) & 0x0f] + HEX_CHARS[(h5l >> 16) & 0x0f] +
                                HEX_CHARS[(h5l >> 12) & 0x0f] + HEX_CHARS[(h5l >> 8) & 0x0f] +
                                HEX_CHARS[(h5l >> 4) & 0x0f] + HEX_CHARS[h5l & 0x0f];
                    }
                    if (bits === 512) {
                        hex +=
                            HEX_CHARS[(h6h >> 28) & 0x0f] + HEX_CHARS[(h6h >> 24) & 0x0f] +
                                HEX_CHARS[(h6h >> 20) & 0x0f] + HEX_CHARS[(h6h >> 16) & 0x0f] +
                                HEX_CHARS[(h6h >> 12) & 0x0f] + HEX_CHARS[(h6h >> 8) & 0x0f] +
                                HEX_CHARS[(h6h >> 4) & 0x0f] + HEX_CHARS[h6h & 0x0f] +
                                HEX_CHARS[(h6l >> 28) & 0x0f] + HEX_CHARS[(h6l >> 24) & 0x0f] +
                                HEX_CHARS[(h6l >> 20) & 0x0f] + HEX_CHARS[(h6l >> 16) & 0x0f] +
                                HEX_CHARS[(h6l >> 12) & 0x0f] + HEX_CHARS[(h6l >> 8) & 0x0f] +
                                HEX_CHARS[(h6l >> 4) & 0x0f] + HEX_CHARS[h6l & 0x0f] +
                                HEX_CHARS[(h7h >> 28) & 0x0f] + HEX_CHARS[(h7h >> 24) & 0x0f] +
                                HEX_CHARS[(h7h >> 20) & 0x0f] + HEX_CHARS[(h7h >> 16) & 0x0f] +
                                HEX_CHARS[(h7h >> 12) & 0x0f] + HEX_CHARS[(h7h >> 8) & 0x0f] +
                                HEX_CHARS[(h7h >> 4) & 0x0f] + HEX_CHARS[h7h & 0x0f] +
                                HEX_CHARS[(h7l >> 28) & 0x0f] + HEX_CHARS[(h7l >> 24) & 0x0f] +
                                HEX_CHARS[(h7l >> 20) & 0x0f] + HEX_CHARS[(h7l >> 16) & 0x0f] +
                                HEX_CHARS[(h7l >> 12) & 0x0f] + HEX_CHARS[(h7l >> 8) & 0x0f] +
                                HEX_CHARS[(h7l >> 4) & 0x0f] + HEX_CHARS[h7l & 0x0f];
                    }
                    return hex;
                }
                toString() {
                    return this.hex();
                }
                digest() {
                    this.finalize();
                    const h0h = this.#h0h, h0l = this.#h0l, h1h = this.#h1h, h1l = this.#h1l, h2h = this.#h2h, h2l = this.#h2l, h3h = this.#h3h, h3l = this.#h3l, h4h = this.#h4h, h4l = this.#h4l, h5h = this.#h5h, h5l = this.#h5l, h6h = this.#h6h, h6l = this.#h6l, h7h = this.#h7h, h7l = this.#h7l, bits = this.#bits;
                    const arr = [
                        (h0h >> 24) & 0xff, (h0h >> 16) & 0xff, (h0h >> 8) & 0xff, h0h & 0xff,
                        (h0l >> 24) & 0xff, (h0l >> 16) & 0xff, (h0l >> 8) & 0xff, h0l & 0xff,
                        (h1h >> 24) & 0xff, (h1h >> 16) & 0xff, (h1h >> 8) & 0xff, h1h & 0xff,
                        (h1l >> 24) & 0xff, (h1l >> 16) & 0xff, (h1l >> 8) & 0xff, h1l & 0xff,
                        (h2h >> 24) & 0xff, (h2h >> 16) & 0xff, (h2h >> 8) & 0xff, h2h & 0xff,
                        (h2l >> 24) & 0xff, (h2l >> 16) & 0xff, (h2l >> 8) & 0xff, h2l & 0xff,
                        (h3h >> 24) & 0xff, (h3h >> 16) & 0xff, (h3h >> 8) & 0xff, h3h & 0xff
                    ];
                    if (bits >= 256) {
                        arr.push((h3l >> 24) & 0xff, (h3l >> 16) & 0xff, (h3l >> 8) & 0xff, h3l & 0xff);
                    }
                    if (bits >= 384) {
                        arr.push((h4h >> 24) & 0xff, (h4h >> 16) & 0xff, (h4h >> 8) & 0xff, h4h & 0xff, (h4l >> 24) & 0xff, (h4l >> 16) & 0xff, (h4l >> 8) & 0xff, h4l & 0xff, (h5h >> 24) & 0xff, (h5h >> 16) & 0xff, (h5h >> 8) & 0xff, h5h & 0xff, (h5l >> 24) & 0xff, (h5l >> 16) & 0xff, (h5l >> 8) & 0xff, h5l & 0xff);
                    }
                    if (bits === 512) {
                        arr.push((h6h >> 24) & 0xff, (h6h >> 16) & 0xff, (h6h >> 8) & 0xff, h6h & 0xff, (h6l >> 24) & 0xff, (h6l >> 16) & 0xff, (h6l >> 8) & 0xff, h6l & 0xff, (h7h >> 24) & 0xff, (h7h >> 16) & 0xff, (h7h >> 8) & 0xff, h7h & 0xff, (h7l >> 24) & 0xff, (h7l >> 16) & 0xff, (h7l >> 8) & 0xff, h7l & 0xff);
                    }
                    return arr;
                }
                array() {
                    return this.digest();
                }
                arrayBuffer() {
                    this.finalize();
                    const bits = this.#bits;
                    const buffer = new ArrayBuffer(bits / 8);
                    const dataView = new DataView(buffer);
                    dataView.setUint32(0, this.#h0h);
                    dataView.setUint32(4, this.#h0l);
                    dataView.setUint32(8, this.#h1h);
                    dataView.setUint32(12, this.#h1l);
                    dataView.setUint32(16, this.#h2h);
                    dataView.setUint32(20, this.#h2l);
                    dataView.setUint32(24, this.#h3h);
                    if (bits >= 256) {
                        dataView.setUint32(28, this.#h3l);
                    }
                    if (bits >= 384) {
                        dataView.setUint32(32, this.#h4h);
                        dataView.setUint32(36, this.#h4l);
                        dataView.setUint32(40, this.#h5h);
                        dataView.setUint32(44, this.#h5l);
                    }
                    if (bits === 512) {
                        dataView.setUint32(48, this.#h6h);
                        dataView.setUint32(52, this.#h6l);
                        dataView.setUint32(56, this.#h7h);
                        dataView.setUint32(60, this.#h7l);
                    }
                    return buffer;
                }
            };
            exports_73("Sha512", Sha512);
            HmacSha512 = class HmacSha512 extends Sha512 {
                constructor(secretKey, bits = 512, sharedMemory = false) {
                    super(bits, sharedMemory);
                    let key;
                    if (secretKey instanceof ArrayBuffer) {
                        key = new Uint8Array(secretKey);
                    }
                    else if (typeof secretKey === "string") {
                        const bytes = [];
                        const length = secretKey.length;
                        let index = 0;
                        let code;
                        for (let i = 0; i < length; ++i) {
                            code = secretKey.charCodeAt(i);
                            if (code < 0x80) {
                                bytes[index++] = code;
                            }
                            else if (code < 0x800) {
                                bytes[index++] = 0xc0 | (code >> 6);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else if (code < 0xd800 || code >= 0xe000) {
                                bytes[index++] = 0xe0 | (code >> 12);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                            else {
                                code = 0x10000 +
                                    (((code & 0x3ff) << 10) | (secretKey.charCodeAt(++i) & 0x3ff));
                                bytes[index++] = 0xf0 | (code >> 18);
                                bytes[index++] = 0x80 | ((code >> 12) & 0x3f);
                                bytes[index++] = 0x80 | ((code >> 6) & 0x3f);
                                bytes[index++] = 0x80 | (code & 0x3f);
                            }
                        }
                        key = bytes;
                    }
                    else {
                        key = secretKey;
                    }
                    if (key.length > 128) {
                        key = new Sha512(bits, true).update(key).array();
                    }
                    const oKeyPad = [];
                    const iKeyPad = [];
                    for (let i = 0; i < 128; ++i) {
                        const b = key[i] || 0;
                        oKeyPad[i] = 0x5c ^ b;
                        iKeyPad[i] = 0x36 ^ b;
                    }
                    this.update(iKeyPad);
                    this.#inner = true;
                    this.#bits = bits;
                    this.#oKeyPad = oKeyPad;
                    this.#sharedMemory = sharedMemory;
                }
                #inner;
                #bits;
                #oKeyPad;
                #sharedMemory;
                finalize() {
                    super.finalize();
                    if (this.#inner) {
                        this.#inner = false;
                        const innerHash = this.array();
                        super.init(this.#bits, this.#sharedMemory);
                        this.update(this.#oKeyPad);
                        this.update(innerHash);
                        super.finalize();
                    }
                }
            };
            exports_73("HmacSha512", HmacSha512);
        }
    };
});
System.register("https://deno.land/std@0.63.0/encoding/base64", [], function (exports_74, context_74) {
    "use strict";
    var __moduleName = context_74 && context_74.id;
    function encode(data) {
        if (typeof data === "string") {
            return btoa(data);
        }
        else {
            const d = new Uint8Array(data);
            let dataString = "";
            for (let i = 0; i < d.length; ++i) {
                dataString += String.fromCharCode(d[i]);
            }
            return btoa(dataString);
        }
    }
    exports_74("encode", encode);
    function decode(data) {
        const binaryString = decodeString(data);
        const binary = new Uint8Array(binaryString.length);
        for (let i = 0; i < binary.length; ++i) {
            binary[i] = binaryString.charCodeAt(i);
        }
        return binary.buffer;
    }
    exports_74("decode", decode);
    function decodeString(data) {
        return atob(data);
    }
    exports_74("decodeString", decodeString);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@0.63.0/encoding/base64url", ["https://deno.land/std@0.63.0/encoding/base64"], function (exports_75, context_75) {
    "use strict";
    var base64_ts_1;
    var __moduleName = context_75 && context_75.id;
    function addPaddingToBase64url(base64url) {
        if (base64url.length % 4 === 2)
            return base64url + "==";
        if (base64url.length % 4 === 3)
            return base64url + "=";
        if (base64url.length % 4 === 1) {
            throw new TypeError("Illegal base64url string!");
        }
        return base64url;
    }
    exports_75("addPaddingToBase64url", addPaddingToBase64url);
    function convertBase64urlToBase64(base64url) {
        return addPaddingToBase64url(base64url)
            .replace(/\-/g, "+")
            .replace(/_/g, "/");
    }
    function convertBase64ToBase64url(base64) {
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function encode(data) {
        return convertBase64ToBase64url(base64_ts_1.encode(data));
    }
    exports_75("encode", encode);
    function decode(data) {
        return base64_ts_1.decode(convertBase64urlToBase64(data));
    }
    exports_75("decode", decode);
    return {
        setters: [
            function (base64_ts_1_1) {
                base64_ts_1 = base64_ts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/djwt@v1.2/deps", ["https://deno.land/std@0.63.0/encoding/hex", "https://deno.land/std@0.63.0/hash/sha256", "https://deno.land/std@0.63.0/hash/sha512", "https://deno.land/std@0.63.0/encoding/base64url"], function (exports_76, context_76) {
    "use strict";
    var __moduleName = context_76 && context_76.id;
    return {
        setters: [
            function (hex_ts_1_1) {
                exports_76({
                    "convertHexToUint8Array": hex_ts_1_1["decodeString"]
                });
            },
            function (sha256_ts_2_1) {
                exports_76({
                    "HmacSha256": sha256_ts_2_1["HmacSha256"]
                });
            },
            function (sha512_ts_1_1) {
                exports_76({
                    "HmacSha512": sha512_ts_1_1["HmacSha512"]
                });
            },
            function (base64url_ts_1_1) {
                exports_76({
                    "addPaddingToBase64url": base64url_ts_1_1["addPaddingToBase64url"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/djwt@v1.2/base64/base64url", ["https://deno.land/x/djwt@v1.2/base64/base64", "https://deno.land/x/djwt@v1.2/deps"], function (exports_77, context_77) {
    "use strict";
    var base64_ts_2, deps_ts_18;
    var __moduleName = context_77 && context_77.id;
    function convertBase64urlToBase64(base64url) {
        return deps_ts_18.addPaddingToBase64url(base64url).replace(/\-/g, "+").replace(/_/g, "/");
    }
    exports_77("convertBase64urlToBase64", convertBase64urlToBase64);
    function convertBase64ToBase64url(base64) {
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    exports_77("convertBase64ToBase64url", convertBase64ToBase64url);
    function convertBase64urlToUint8Array(base64url) {
        return base64_ts_2.convertBase64ToUint8Array(convertBase64urlToBase64(base64url));
    }
    exports_77("convertBase64urlToUint8Array", convertBase64urlToUint8Array);
    function convertUint8ArrayToBase64url(uint8Array) {
        return convertBase64ToBase64url(base64_ts_2.convertUint8ArrayToBase64(uint8Array));
    }
    exports_77("convertUint8ArrayToBase64url", convertUint8ArrayToBase64url);
    return {
        setters: [
            function (base64_ts_2_1) {
                base64_ts_2 = base64_ts_2_1;
            },
            function (deps_ts_18_1) {
                deps_ts_18 = deps_ts_18_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/djwt@v1.2/create", ["https://deno.land/x/djwt@v1.2/base64/base64url", "https://deno.land/x/djwt@v1.2/deps"], function (exports_78, context_78) {
    "use strict";
    var base64url_ts_2, deps_ts_19;
    var __moduleName = context_78 && context_78.id;
    function setExpiration(exp) {
        return Math.round((exp instanceof Date ? exp.getTime() : Date.now() + exp * 1000) / 1000);
    }
    exports_78("setExpiration", setExpiration);
    function convertHexToBase64url(input) {
        return base64url_ts_2.convertUint8ArrayToBase64url(deps_ts_19.convertHexToUint8Array(input));
    }
    exports_78("convertHexToBase64url", convertHexToBase64url);
    function convertStringToBase64url(input) {
        return base64url_ts_2.convertUint8ArrayToBase64url(new TextEncoder().encode(input));
    }
    exports_78("convertStringToBase64url", convertStringToBase64url);
    function makeSigningInput(header, payload) {
        return `${convertStringToBase64url(JSON.stringify(header))}.${convertStringToBase64url(JSON.stringify(payload))}`;
    }
    function encrypt(alg, key, msg) {
        function assertNever(alg) {
            throw new RangeError("no matching crypto algorithm in the header: " + alg);
        }
        switch (alg) {
            case "none":
                return null;
            case "HS256":
                return new deps_ts_19.HmacSha256(key).update(msg).toString();
            case "HS512":
                return new deps_ts_19.HmacSha512(key).update(msg).toString();
            default:
                assertNever(alg);
        }
    }
    function makeSignature(alg, key, input) {
        const encryptionInHex = encrypt(alg, key, input);
        return encryptionInHex ? convertHexToBase64url(encryptionInHex) : "";
    }
    exports_78("makeSignature", makeSignature);
    async function makeJwt({ key, header, payload }) {
        try {
            const signingInput = makeSigningInput(header, payload);
            return `${signingInput}.${makeSignature(header.alg, key, signingInput)}`;
        }
        catch (err) {
            err.message = `Failed to create JWT: ${err.message}`;
            throw err;
        }
    }
    exports_78("makeJwt", makeJwt);
    return {
        setters: [
            function (base64url_ts_2_1) {
                base64url_ts_2 = base64url_ts_2_1;
            },
            function (deps_ts_19_1) {
                deps_ts_19 = deps_ts_19_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/djwt@v1.2/validate", ["https://deno.land/x/djwt@v1.2/create", "https://deno.land/x/djwt@v1.2/base64/base64url", "https://deno.land/std@0.63.0/encoding/hex"], function (exports_79, context_79) {
    "use strict";
    var create_ts_1, base64url_ts_3, hex_ts_2, JwtError;
    var __moduleName = context_79 && context_79.id;
    function isObject(obj) {
        return (obj !== null && typeof obj === "object" && Array.isArray(obj) === false);
    }
    function has(key, x) {
        return key in x;
    }
    function isExpired(exp, leeway = 0) {
        return exp + leeway < Date.now() / 1000;
    }
    exports_79("isExpired", isExpired);
    function makeArray(...arg) {
        return arg.flat(1);
    }
    function checkHeaderCrit(header, handlers) {
        const reservedWords = new Set([
            "alg",
            "jku",
            "jwk",
            "kid",
            "x5u",
            "x5c",
            "x5t",
            "x5t#S256",
            "typ",
            "cty",
            "crit",
            "enc",
            "zip",
            "epk",
            "apu",
            "apv",
            "iv",
            "tag",
            "p2s",
            "p2c",
        ]);
        if (!Array.isArray(header.crit) ||
            header.crit.some((str) => typeof str !== "string" || !str)) {
            throw Error("header parameter 'crit' must be an array of non-empty strings");
        }
        if (header.crit.some((str) => reservedWords.has(str))) {
            throw Error("the 'crit' list contains a non-extension header parameter");
        }
        if (header.crit.some((str) => typeof header[str] === "undefined" ||
            typeof handlers?.[str] !== "function")) {
            throw Error("critical extension header parameters are not understood");
        }
        return Promise.all(header.crit.map((str) => handlers[str](header[str])));
    }
    exports_79("checkHeaderCrit", checkHeaderCrit);
    function validateJwtObject(maybeJwtObject) {
        if (typeof maybeJwtObject.signature !== "string") {
            throw ReferenceError("the signature is no string");
        }
        if (!(isObject(maybeJwtObject.header) &&
            has("alg", maybeJwtObject.header) &&
            typeof maybeJwtObject.header.alg === "string")) {
            throw ReferenceError("header parameter 'alg' is not a string");
        }
        if (isObject(maybeJwtObject.payload) && has("exp", maybeJwtObject.payload)) {
            if (typeof maybeJwtObject.payload.exp !== "number") {
                throw RangeError("claim 'exp' is not a number");
            }
            else if (isExpired(maybeJwtObject.payload.exp, 1)) {
                throw RangeError("the jwt is expired");
            }
        }
        return maybeJwtObject;
    }
    exports_79("validateJwtObject", validateJwtObject);
    async function handleJwtObject(jwtObject, critHandlers) {
        return [
            jwtObject,
            "crit" in jwtObject.header
                ? await checkHeaderCrit(jwtObject.header, critHandlers)
                : undefined,
        ];
    }
    function parseAndDecode(jwt) {
        const parsedArray = jwt
            .split(".")
            .map(base64url_ts_3.convertBase64urlToUint8Array)
            .map((uint8Array, index) => index === 2
            ? hex_ts_2.encodeToString(uint8Array)
            : JSON.parse(new TextDecoder().decode(uint8Array)));
        if (parsedArray.length !== 3)
            throw TypeError("invalid serialization");
        return {
            header: parsedArray[0],
            payload: parsedArray[1],
            signature: parsedArray[2],
        };
    }
    exports_79("parseAndDecode", parseAndDecode);
    async function validateJwt({ jwt, key, critHandlers, algorithm, }) {
        try {
            const [oldJwtObject, critResult] = await handleJwtObject(validateJwtObject(parseAndDecode(jwt)), critHandlers);
            if (!makeArray(algorithm).includes(oldJwtObject.header.alg)) {
                throw Error("no matching algorithm: " + oldJwtObject.header.alg);
            }
            if (oldJwtObject.signature !==
                parseAndDecode(await create_ts_1.makeJwt({ ...oldJwtObject, key })).signature) {
                throw Error("signatures don't match");
            }
            return { ...oldJwtObject, jwt, critResult, isValid: true };
        }
        catch (err) {
            return {
                jwt,
                error: new JwtError(err.message),
                isValid: false,
                isExpired: err.message === "the jwt is expired" ? true : false,
            };
        }
    }
    exports_79("validateJwt", validateJwt);
    return {
        setters: [
            function (create_ts_1_1) {
                create_ts_1 = create_ts_1_1;
            },
            function (base64url_ts_3_1) {
                base64url_ts_3 = base64url_ts_3_1;
            },
            function (hex_ts_2_1) {
                hex_ts_2 = hex_ts_2_1;
            }
        ],
        execute: function () {
            JwtError = class JwtError extends Error {
                constructor(message) {
                    super(message);
                    this.message = message;
                    this.name = this.constructor.name;
                    this.date = new Date();
                }
            };
        }
    };
});
System.register("https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/std/encoding/utf8", ["https://deno.land/std@0.61.0/encoding/utf8"], function (exports_80, context_80) {
    "use strict";
    var __moduleName = context_80 && context_80.id;
    function exportStar_3(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_80(exports);
    }
    return {
        setters: [
            function (utf8_ts_6_1) {
                exportStar_3(utf8_ts_6_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@v0.61.0/bytes/mod", [], function (exports_81, context_81) {
    "use strict";
    var __moduleName = context_81 && context_81.id;
    function findIndex(source, pat) {
        const s = pat[0];
        for (let i = 0; i < source.length; i++) {
            if (source[i] !== s)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j++;
                if (source[j] !== pat[j - pin]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin;
            }
        }
        return -1;
    }
    exports_81("findIndex", findIndex);
    function findLastIndex(source, pat) {
        const e = pat[pat.length - 1];
        for (let i = source.length - 1; i >= 0; i--) {
            if (source[i] !== e)
                continue;
            const pin = i;
            let matched = 1;
            let j = i;
            while (matched < pat.length) {
                j--;
                if (source[j] !== pat[pat.length - 1 - (pin - j)]) {
                    break;
                }
                matched++;
            }
            if (matched === pat.length) {
                return pin - pat.length + 1;
            }
        }
        return -1;
    }
    exports_81("findLastIndex", findLastIndex);
    function equal(source, match) {
        if (source.length !== match.length)
            return false;
        for (let i = 0; i < match.length; i++) {
            if (source[i] !== match[i])
                return false;
        }
        return true;
    }
    exports_81("equal", equal);
    function hasPrefix(source, prefix) {
        for (let i = 0, max = prefix.length; i < max; i++) {
            if (source[i] !== prefix[i])
                return false;
        }
        return true;
    }
    exports_81("hasPrefix", hasPrefix);
    function hasSuffix(source, suffix) {
        for (let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--) {
            if (source[srci] !== suffix[sfxi])
                return false;
        }
        return true;
    }
    exports_81("hasSuffix", hasSuffix);
    function repeat(origin, count) {
        if (count === 0) {
            return new Uint8Array();
        }
        if (count < 0) {
            throw new Error("bytes: negative repeat count");
        }
        else if ((origin.length * count) / count !== origin.length) {
            throw new Error("bytes: repeat count causes overflow");
        }
        const int = Math.floor(count);
        if (int !== count) {
            throw new Error("bytes: repeat count must be an integer");
        }
        const nb = new Uint8Array(origin.length * count);
        let bp = copyBytes(origin, nb);
        for (; bp < nb.length; bp *= 2) {
            copyBytes(nb.slice(0, bp), nb, bp);
        }
        return nb;
    }
    exports_81("repeat", repeat);
    function concat(origin, b) {
        const output = new Uint8Array(origin.length + b.length);
        output.set(origin, 0);
        output.set(b, origin.length);
        return output;
    }
    exports_81("concat", concat);
    function contains(source, pat) {
        return findIndex(source, pat) != -1;
    }
    exports_81("contains", contains);
    function copyBytes(src, dst, off = 0) {
        off = Math.max(0, Math.min(off, dst.byteLength));
        const dstBytesAvailable = dst.byteLength - off;
        if (src.byteLength > dstBytesAvailable) {
            src = src.subarray(0, dstBytesAvailable);
        }
        dst.set(src, off);
        return src.byteLength;
    }
    exports_81("copyBytes", copyBytes);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("https://deno.land/std@v0.61.0/_util/assert", [], function (exports_82, context_82) {
    "use strict";
    var DenoStdInternalError;
    var __moduleName = context_82 && context_82.id;
    function assert(expr, msg = "") {
        if (!expr) {
            throw new DenoStdInternalError(msg);
        }
    }
    exports_82("assert", assert);
    return {
        setters: [],
        execute: function () {
            DenoStdInternalError = class DenoStdInternalError extends Error {
                constructor(message) {
                    super(message);
                    this.name = "DenoStdInternalError";
                }
            };
            exports_82("DenoStdInternalError", DenoStdInternalError);
        }
    };
});
System.register("https://deno.land/std@v0.61.0/io/bufio", ["https://deno.land/std@v0.61.0/bytes/mod", "https://deno.land/std@v0.61.0/_util/assert"], function (exports_83, context_83) {
    "use strict";
    var mod_ts_13, assert_ts_8, DEFAULT_BUF_SIZE, MIN_BUF_SIZE, MAX_CONSECUTIVE_EMPTY_READS, CR, LF, BufferFullError, PartialReadError, BufReader, AbstractBufBase, BufWriter, BufWriterSync;
    var __moduleName = context_83 && context_83.id;
    function createLPS(pat) {
        const lps = new Uint8Array(pat.length);
        lps[0] = 0;
        let prefixEnd = 0;
        let i = 1;
        while (i < lps.length) {
            if (pat[i] == pat[prefixEnd]) {
                prefixEnd++;
                lps[i] = prefixEnd;
                i++;
            }
            else if (prefixEnd === 0) {
                lps[i] = 0;
                i++;
            }
            else {
                prefixEnd = pat[prefixEnd - 1];
            }
        }
        return lps;
    }
    async function* readDelim(reader, delim) {
        const delimLen = delim.length;
        const delimLPS = createLPS(delim);
        let inputBuffer = new Deno.Buffer();
        const inspectArr = new Uint8Array(Math.max(1024, delimLen + 1));
        let inspectIndex = 0;
        let matchIndex = 0;
        while (true) {
            const result = await reader.read(inspectArr);
            if (result === null) {
                yield inputBuffer.bytes();
                return;
            }
            if (result < 0) {
                return;
            }
            const sliceRead = inspectArr.subarray(0, result);
            await Deno.writeAll(inputBuffer, sliceRead);
            let sliceToProcess = inputBuffer.bytes();
            while (inspectIndex < sliceToProcess.length) {
                if (sliceToProcess[inspectIndex] === delim[matchIndex]) {
                    inspectIndex++;
                    matchIndex++;
                    if (matchIndex === delimLen) {
                        const matchEnd = inspectIndex - delimLen;
                        const readyBytes = sliceToProcess.subarray(0, matchEnd);
                        const pendingBytes = sliceToProcess.slice(inspectIndex);
                        yield readyBytes;
                        sliceToProcess = pendingBytes;
                        inspectIndex = 0;
                        matchIndex = 0;
                    }
                }
                else {
                    if (matchIndex === 0) {
                        inspectIndex++;
                    }
                    else {
                        matchIndex = delimLPS[matchIndex - 1];
                    }
                }
            }
            inputBuffer = new Deno.Buffer(sliceToProcess);
        }
    }
    exports_83("readDelim", readDelim);
    async function* readStringDelim(reader, delim) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        for await (const chunk of readDelim(reader, encoder.encode(delim))) {
            yield decoder.decode(chunk);
        }
    }
    exports_83("readStringDelim", readStringDelim);
    async function* readLines(reader) {
        yield* readStringDelim(reader, "\n");
    }
    exports_83("readLines", readLines);
    return {
        setters: [
            function (mod_ts_13_1) {
                mod_ts_13 = mod_ts_13_1;
            },
            function (assert_ts_8_1) {
                assert_ts_8 = assert_ts_8_1;
            }
        ],
        execute: function () {
            DEFAULT_BUF_SIZE = 4096;
            MIN_BUF_SIZE = 16;
            MAX_CONSECUTIVE_EMPTY_READS = 100;
            CR = "\r".charCodeAt(0);
            LF = "\n".charCodeAt(0);
            BufferFullError = class BufferFullError extends Error {
                constructor(partial) {
                    super("Buffer full");
                    this.partial = partial;
                    this.name = "BufferFullError";
                }
            };
            exports_83("BufferFullError", BufferFullError);
            PartialReadError = class PartialReadError extends Deno.errors.UnexpectedEof {
                constructor() {
                    super("Encountered UnexpectedEof, data only partially read");
                    this.name = "PartialReadError";
                }
            };
            exports_83("PartialReadError", PartialReadError);
            BufReader = class BufReader {
                constructor(rd, size = DEFAULT_BUF_SIZE) {
                    this.r = 0;
                    this.w = 0;
                    this.eof = false;
                    if (size < MIN_BUF_SIZE) {
                        size = MIN_BUF_SIZE;
                    }
                    this._reset(new Uint8Array(size), rd);
                }
                static create(r, size = DEFAULT_BUF_SIZE) {
                    return r instanceof BufReader ? r : new BufReader(r, size);
                }
                size() {
                    return this.buf.byteLength;
                }
                buffered() {
                    return this.w - this.r;
                }
                async _fill() {
                    if (this.r > 0) {
                        this.buf.copyWithin(0, this.r, this.w);
                        this.w -= this.r;
                        this.r = 0;
                    }
                    if (this.w >= this.buf.byteLength) {
                        throw Error("bufio: tried to fill full buffer");
                    }
                    for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
                        const rr = await this.rd.read(this.buf.subarray(this.w));
                        if (rr === null) {
                            this.eof = true;
                            return;
                        }
                        assert_ts_8.assert(rr >= 0, "negative read");
                        this.w += rr;
                        if (rr > 0) {
                            return;
                        }
                    }
                    throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
                }
                reset(r) {
                    this._reset(this.buf, r);
                }
                _reset(buf, rd) {
                    this.buf = buf;
                    this.rd = rd;
                    this.eof = false;
                }
                async read(p) {
                    let rr = p.byteLength;
                    if (p.byteLength === 0)
                        return rr;
                    if (this.r === this.w) {
                        if (p.byteLength >= this.buf.byteLength) {
                            const rr = await this.rd.read(p);
                            const nread = rr ?? 0;
                            assert_ts_8.assert(nread >= 0, "negative read");
                            return rr;
                        }
                        this.r = 0;
                        this.w = 0;
                        rr = await this.rd.read(this.buf);
                        if (rr === 0 || rr === null)
                            return rr;
                        assert_ts_8.assert(rr >= 0, "negative read");
                        this.w += rr;
                    }
                    const copied = mod_ts_13.copyBytes(this.buf.subarray(this.r, this.w), p, 0);
                    this.r += copied;
                    return copied;
                }
                async readFull(p) {
                    let bytesRead = 0;
                    while (bytesRead < p.length) {
                        try {
                            const rr = await this.read(p.subarray(bytesRead));
                            if (rr === null) {
                                if (bytesRead === 0) {
                                    return null;
                                }
                                else {
                                    throw new PartialReadError();
                                }
                            }
                            bytesRead += rr;
                        }
                        catch (err) {
                            err.partial = p.subarray(0, bytesRead);
                            throw err;
                        }
                    }
                    return p;
                }
                async readByte() {
                    while (this.r === this.w) {
                        if (this.eof)
                            return null;
                        await this._fill();
                    }
                    const c = this.buf[this.r];
                    this.r++;
                    return c;
                }
                async readString(delim) {
                    if (delim.length !== 1) {
                        throw new Error("Delimiter should be a single character");
                    }
                    const buffer = await this.readSlice(delim.charCodeAt(0));
                    if (buffer === null)
                        return null;
                    return new TextDecoder().decode(buffer);
                }
                async readLine() {
                    let line;
                    try {
                        line = await this.readSlice(LF);
                    }
                    catch (err) {
                        let { partial } = err;
                        assert_ts_8.assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
                        if (!(err instanceof BufferFullError)) {
                            throw err;
                        }
                        if (!this.eof &&
                            partial.byteLength > 0 &&
                            partial[partial.byteLength - 1] === CR) {
                            assert_ts_8.assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                            this.r--;
                            partial = partial.subarray(0, partial.byteLength - 1);
                        }
                        return { line: partial, more: !this.eof };
                    }
                    if (line === null) {
                        return null;
                    }
                    if (line.byteLength === 0) {
                        return { line, more: false };
                    }
                    if (line[line.byteLength - 1] == LF) {
                        let drop = 1;
                        if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                            drop = 2;
                        }
                        line = line.subarray(0, line.byteLength - drop);
                    }
                    return { line, more: false };
                }
                async readSlice(delim) {
                    let s = 0;
                    let slice;
                    while (true) {
                        let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
                        if (i >= 0) {
                            i += s;
                            slice = this.buf.subarray(this.r, this.r + i + 1);
                            this.r += i + 1;
                            break;
                        }
                        if (this.eof) {
                            if (this.r === this.w) {
                                return null;
                            }
                            slice = this.buf.subarray(this.r, this.w);
                            this.r = this.w;
                            break;
                        }
                        if (this.buffered() >= this.buf.byteLength) {
                            this.r = this.w;
                            const oldbuf = this.buf;
                            const newbuf = this.buf.slice(0);
                            this.buf = newbuf;
                            throw new BufferFullError(oldbuf);
                        }
                        s = this.w - this.r;
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = slice;
                            throw err;
                        }
                    }
                    return slice;
                }
                async peek(n) {
                    if (n < 0) {
                        throw Error("negative count");
                    }
                    let avail = this.w - this.r;
                    while (avail < n && avail < this.buf.byteLength && !this.eof) {
                        try {
                            await this._fill();
                        }
                        catch (err) {
                            err.partial = this.buf.subarray(this.r, this.w);
                            throw err;
                        }
                        avail = this.w - this.r;
                    }
                    if (avail === 0 && this.eof) {
                        return null;
                    }
                    else if (avail < n && this.eof) {
                        return this.buf.subarray(this.r, this.r + avail);
                    }
                    else if (avail < n) {
                        throw new BufferFullError(this.buf.subarray(this.r, this.w));
                    }
                    return this.buf.subarray(this.r, this.r + n);
                }
            };
            exports_83("BufReader", BufReader);
            AbstractBufBase = class AbstractBufBase {
                constructor() {
                    this.usedBufferBytes = 0;
                    this.err = null;
                }
                size() {
                    return this.buf.byteLength;
                }
                available() {
                    return this.buf.byteLength - this.usedBufferBytes;
                }
                buffered() {
                    return this.usedBufferBytes;
                }
            };
            BufWriter = class BufWriter extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                async flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        await Deno.writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                async write(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = await this.writer.write(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_13.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            await this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_13.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_83("BufWriter", BufWriter);
            BufWriterSync = class BufWriterSync extends AbstractBufBase {
                constructor(writer, size = DEFAULT_BUF_SIZE) {
                    super();
                    this.writer = writer;
                    if (size <= 0) {
                        size = DEFAULT_BUF_SIZE;
                    }
                    this.buf = new Uint8Array(size);
                }
                static create(writer, size = DEFAULT_BUF_SIZE) {
                    return writer instanceof BufWriterSync
                        ? writer
                        : new BufWriterSync(writer, size);
                }
                reset(w) {
                    this.err = null;
                    this.usedBufferBytes = 0;
                    this.writer = w;
                }
                flush() {
                    if (this.err !== null)
                        throw this.err;
                    if (this.usedBufferBytes === 0)
                        return;
                    try {
                        Deno.writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
                    }
                    catch (e) {
                        this.err = e;
                        throw e;
                    }
                    this.buf = new Uint8Array(this.buf.length);
                    this.usedBufferBytes = 0;
                }
                writeSync(data) {
                    if (this.err !== null)
                        throw this.err;
                    if (data.length === 0)
                        return 0;
                    let totalBytesWritten = 0;
                    let numBytesWritten = 0;
                    while (data.byteLength > this.available()) {
                        if (this.buffered() === 0) {
                            try {
                                numBytesWritten = this.writer.writeSync(data);
                            }
                            catch (e) {
                                this.err = e;
                                throw e;
                            }
                        }
                        else {
                            numBytesWritten = mod_ts_13.copyBytes(data, this.buf, this.usedBufferBytes);
                            this.usedBufferBytes += numBytesWritten;
                            this.flush();
                        }
                        totalBytesWritten += numBytesWritten;
                        data = data.subarray(numBytesWritten);
                    }
                    numBytesWritten = mod_ts_13.copyBytes(data, this.buf, this.usedBufferBytes);
                    this.usedBufferBytes += numBytesWritten;
                    totalBytesWritten += numBytesWritten;
                    return totalBytesWritten;
                }
            };
            exports_83("BufWriterSync", BufWriterSync);
        }
    };
});
System.register("https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/std/io/bufio", ["https://deno.land/std@v0.61.0/io/bufio"], function (exports_84, context_84) {
    "use strict";
    var __moduleName = context_84 && context_84.id;
    function exportStar_4(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_84(exports);
    }
    return {
        setters: [
            function (bufio_ts_5_1) {
                exportStar_4(bufio_ts_5_1);
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_basePropertyOf", [], function (exports_85, context_85) {
    "use strict";
    var __moduleName = context_85 && context_85.id;
    function basePropertyOf(object) {
        return function (key) {
            return object == null ? undefined : object[key];
        };
    }
    return {
        setters: [],
        execute: function () {
            exports_85("default", basePropertyOf);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_escapeHtmlChar", ["https://deno.land/x/lodash@4.17.15-es/_basePropertyOf"], function (exports_86, context_86) {
    "use strict";
    var _basePropertyOf_js_1, htmlEscapes, escapeHtmlChar;
    var __moduleName = context_86 && context_86.id;
    return {
        setters: [
            function (_basePropertyOf_js_1_1) {
                _basePropertyOf_js_1 = _basePropertyOf_js_1_1;
            }
        ],
        execute: function () {
            htmlEscapes = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            escapeHtmlChar = _basePropertyOf_js_1.default(htmlEscapes);
            exports_86("default", escapeHtmlChar);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_freeGlobal", [], function (exports_87, context_87) {
    "use strict";
    var freeGlobal;
    var __moduleName = context_87 && context_87.id;
    return {
        setters: [],
        execute: function () {
            freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
            exports_87("default", freeGlobal);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_root", ["https://deno.land/x/lodash@4.17.15-es/_freeGlobal"], function (exports_88, context_88) {
    "use strict";
    var _freeGlobal_js_1, freeSelf, root;
    var __moduleName = context_88 && context_88.id;
    return {
        setters: [
            function (_freeGlobal_js_1_1) {
                _freeGlobal_js_1 = _freeGlobal_js_1_1;
            }
        ],
        execute: function () {
            freeSelf = typeof self == 'object' && self && self.Object === Object && self;
            root = _freeGlobal_js_1.default || freeSelf || Function('return this')();
            exports_88("default", root);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_Symbol", ["https://deno.land/x/lodash@4.17.15-es/_root"], function (exports_89, context_89) {
    "use strict";
    var _root_js_1, Symbol;
    var __moduleName = context_89 && context_89.id;
    return {
        setters: [
            function (_root_js_1_1) {
                _root_js_1 = _root_js_1_1;
            }
        ],
        execute: function () {
            Symbol = _root_js_1.default.Symbol;
            exports_89("default", Symbol);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_arrayMap", [], function (exports_90, context_90) {
    "use strict";
    var __moduleName = context_90 && context_90.id;
    function arrayMap(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length, result = Array(length);
        while (++index < length) {
            result[index] = iteratee(array[index], index, array);
        }
        return result;
    }
    return {
        setters: [],
        execute: function () {
            exports_90("default", arrayMap);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/isArray", [], function (exports_91, context_91) {
    "use strict";
    var isArray;
    var __moduleName = context_91 && context_91.id;
    return {
        setters: [],
        execute: function () {
            isArray = Array.isArray;
            exports_91("default", isArray);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_getRawTag", ["https://deno.land/x/lodash@4.17.15-es/_Symbol"], function (exports_92, context_92) {
    "use strict";
    var _Symbol_js_1, objectProto, hasOwnProperty, nativeObjectToString, symToStringTag;
    var __moduleName = context_92 && context_92.id;
    function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
            value[symToStringTag] = undefined;
            var unmasked = true;
        }
        catch (e) { }
        var result = nativeObjectToString.call(value);
        if (unmasked) {
            if (isOwn) {
                value[symToStringTag] = tag;
            }
            else {
                delete value[symToStringTag];
            }
        }
        return result;
    }
    return {
        setters: [
            function (_Symbol_js_1_1) {
                _Symbol_js_1 = _Symbol_js_1_1;
            }
        ],
        execute: function () {
            objectProto = Object.prototype;
            hasOwnProperty = objectProto.hasOwnProperty;
            nativeObjectToString = objectProto.toString;
            symToStringTag = _Symbol_js_1.default ? _Symbol_js_1.default.toStringTag : undefined;
            exports_92("default", getRawTag);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_objectToString", [], function (exports_93, context_93) {
    "use strict";
    var objectProto, nativeObjectToString;
    var __moduleName = context_93 && context_93.id;
    function objectToString(value) {
        return nativeObjectToString.call(value);
    }
    return {
        setters: [],
        execute: function () {
            objectProto = Object.prototype;
            nativeObjectToString = objectProto.toString;
            exports_93("default", objectToString);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_baseGetTag", ["https://deno.land/x/lodash@4.17.15-es/_Symbol", "https://deno.land/x/lodash@4.17.15-es/_getRawTag", "https://deno.land/x/lodash@4.17.15-es/_objectToString"], function (exports_94, context_94) {
    "use strict";
    var _Symbol_js_2, _getRawTag_js_1, _objectToString_js_1, nullTag, undefinedTag, symToStringTag;
    var __moduleName = context_94 && context_94.id;
    function baseGetTag(value) {
        if (value == null) {
            return value === undefined ? undefinedTag : nullTag;
        }
        return (symToStringTag && symToStringTag in Object(value))
            ? _getRawTag_js_1.default(value)
            : _objectToString_js_1.default(value);
    }
    return {
        setters: [
            function (_Symbol_js_2_1) {
                _Symbol_js_2 = _Symbol_js_2_1;
            },
            function (_getRawTag_js_1_1) {
                _getRawTag_js_1 = _getRawTag_js_1_1;
            },
            function (_objectToString_js_1_1) {
                _objectToString_js_1 = _objectToString_js_1_1;
            }
        ],
        execute: function () {
            nullTag = '[object Null]', undefinedTag = '[object Undefined]';
            symToStringTag = _Symbol_js_2.default ? _Symbol_js_2.default.toStringTag : undefined;
            exports_94("default", baseGetTag);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/isObjectLike", [], function (exports_95, context_95) {
    "use strict";
    var __moduleName = context_95 && context_95.id;
    function isObjectLike(value) {
        return value != null && typeof value == 'object';
    }
    return {
        setters: [],
        execute: function () {
            exports_95("default", isObjectLike);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/isSymbol", ["https://deno.land/x/lodash@4.17.15-es/_baseGetTag", "https://deno.land/x/lodash@4.17.15-es/isObjectLike"], function (exports_96, context_96) {
    "use strict";
    var _baseGetTag_js_1, isObjectLike_js_1, symbolTag;
    var __moduleName = context_96 && context_96.id;
    function isSymbol(value) {
        return typeof value == 'symbol' ||
            (isObjectLike_js_1.default(value) && _baseGetTag_js_1.default(value) == symbolTag);
    }
    return {
        setters: [
            function (_baseGetTag_js_1_1) {
                _baseGetTag_js_1 = _baseGetTag_js_1_1;
            },
            function (isObjectLike_js_1_1) {
                isObjectLike_js_1 = isObjectLike_js_1_1;
            }
        ],
        execute: function () {
            symbolTag = '[object Symbol]';
            exports_96("default", isSymbol);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/_baseToString", ["https://deno.land/x/lodash@4.17.15-es/_Symbol", "https://deno.land/x/lodash@4.17.15-es/_arrayMap", "https://deno.land/x/lodash@4.17.15-es/isArray", "https://deno.land/x/lodash@4.17.15-es/isSymbol"], function (exports_97, context_97) {
    "use strict";
    var _Symbol_js_3, _arrayMap_js_1, isArray_js_1, isSymbol_js_1, INFINITY, symbolProto, symbolToString;
    var __moduleName = context_97 && context_97.id;
    function baseToString(value) {
        if (typeof value == 'string') {
            return value;
        }
        if (isArray_js_1.default(value)) {
            return _arrayMap_js_1.default(value, baseToString) + '';
        }
        if (isSymbol_js_1.default(value)) {
            return symbolToString ? symbolToString.call(value) : '';
        }
        var result = (value + '');
        return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }
    return {
        setters: [
            function (_Symbol_js_3_1) {
                _Symbol_js_3 = _Symbol_js_3_1;
            },
            function (_arrayMap_js_1_1) {
                _arrayMap_js_1 = _arrayMap_js_1_1;
            },
            function (isArray_js_1_1) {
                isArray_js_1 = isArray_js_1_1;
            },
            function (isSymbol_js_1_1) {
                isSymbol_js_1 = isSymbol_js_1_1;
            }
        ],
        execute: function () {
            INFINITY = 1 / 0;
            symbolProto = _Symbol_js_3.default ? _Symbol_js_3.default.prototype : undefined, symbolToString = symbolProto ? symbolProto.toString : undefined;
            exports_97("default", baseToString);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/toString", ["https://deno.land/x/lodash@4.17.15-es/_baseToString"], function (exports_98, context_98) {
    "use strict";
    var _baseToString_js_1;
    var __moduleName = context_98 && context_98.id;
    function toString(value) {
        return value == null ? '' : _baseToString_js_1.default(value);
    }
    return {
        setters: [
            function (_baseToString_js_1_1) {
                _baseToString_js_1 = _baseToString_js_1_1;
            }
        ],
        execute: function () {
            exports_98("default", toString);
        }
    };
});
System.register("https://deno.land/x/lodash@4.17.15-es/escape", ["https://deno.land/x/lodash@4.17.15-es/_escapeHtmlChar", "https://deno.land/x/lodash@4.17.15-es/toString"], function (exports_99, context_99) {
    "use strict";
    var _escapeHtmlChar_js_1, toString_js_1, reUnescapedHtml, reHasUnescapedHtml;
    var __moduleName = context_99 && context_99.id;
    function escape(string) {
        string = toString_js_1.default(string);
        return (string && reHasUnescapedHtml.test(string))
            ? string.replace(reUnescapedHtml, _escapeHtmlChar_js_1.default)
            : string;
    }
    return {
        setters: [
            function (_escapeHtmlChar_js_1_1) {
                _escapeHtmlChar_js_1 = _escapeHtmlChar_js_1_1;
            },
            function (toString_js_1_1) {
                toString_js_1 = toString_js_1_1;
            }
        ],
        execute: function () {
            reUnescapedHtml = /[&<>"']/g, reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
            exports_99("default", escape);
        }
    };
});
System.register("https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/x/lodash/escape", ["https://deno.land/x/lodash@4.17.15-es/escape"], function (exports_100, context_100) {
    "use strict";
    var __moduleName = context_100 && context_100.id;
    var exportedNames_2 = {};
    function exportStar_5(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default" && !exportedNames_2.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_100(exports);
    }
    return {
        setters: [
            function (escape_js_1_1) {
                exportStar_5(escape_js_1_1);
                exports_100({
                    "default": escape_js_1_1["default"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("https://deno.land/x/dejs@0.8.0/mod", ["https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/std/encoding/utf8", "https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/std/io/bufio", "https://deno.land/x/dejs@0.8.0/vendor/https/deno.land/x/lodash/escape"], function (exports_101, context_101) {
    "use strict";
    var open, utf8_ts_7, bufio_ts_6, escape_js_2, ReadMode, Codes, decoder, StringReader;
    var __moduleName = context_101 && context_101.id;
    async function include(path, params) {
        const result = await renderFile(path, params);
        const buf = new Deno.Buffer();
        await buf.readFrom(result);
        return await bufToStr(buf);
    }
    function sanitize(str) {
        return str
            .replace(/\`/g, "\\\`")
            .replace(/\$/g, "\\\$")
            .replace(/\\+$/, "");
    }
    async function bufToStr(buf) {
        return decoder.decode(await Deno.readAll(buf));
    }
    function removeLastSemi(s) {
        return s.trimRight().replace(/;$/, "");
    }
    async function bufToStrWithSanitize(buf) {
        return sanitize(await bufToStr(buf));
    }
    function NewTemplate(script) {
        return async (params) => {
            const output = [];
            await new Promise((resolve) => {
                const args = {
                    ...params,
                    include,
                    $$OUTPUT: output,
                    $$FINISHED: resolve,
                    $$ESCAPE: escape_js_2.default,
                };
                const src = `(async() => {
        ${script}
        $$FINISHED();
      })();`;
                const f = new Function(...Object.keys(args), src);
                f(...Object.values(args));
            });
            return output.join("");
        };
    }
    async function compile(reader) {
        const src = new bufio_ts_6.BufReader(reader);
        const buf = [];
        const statements = [];
        const statementBuf = new Deno.Buffer();
        let readMode = ReadMode.Normal;
        const statementBufWrite = async (byte) => await statementBuf.write(new Uint8Array([byte]));
        while (true) {
            const byte = await src.readByte();
            if (byte === null) {
                break;
            }
            buf.push(byte);
            if (buf.length < 3) {
                continue;
            }
            if (readMode === ReadMode.Normal) {
                if (buf[0] === Codes.Begin && buf[1] === Codes.Percent) {
                    switch (buf[2]) {
                        case Codes.Escaped:
                            readMode = ReadMode.Escaped;
                            break;
                        case Codes.Raw:
                            readMode = ReadMode.Raw;
                            break;
                        case Codes.Comment:
                            readMode = ReadMode.Comment;
                            break;
                        default:
                            readMode = ReadMode.Evaluate;
                            break;
                    }
                    statements.push(`;$$OUTPUT.push(\`${await bufToStrWithSanitize(statementBuf)}\`);`);
                    statementBuf.reset();
                    buf.splice(0);
                    continue;
                }
                if (buf.length > 2) {
                    await statementBufWrite(buf.shift());
                }
                continue;
            }
            if (buf[1] === Codes.Percent && buf[2] === Codes.End) {
                statementBufWrite(buf.shift());
                buf.splice(0);
                if (readMode !== ReadMode.Comment) {
                    switch (readMode) {
                        case ReadMode.Raw:
                            statements.push(`;$$OUTPUT.push(${removeLastSemi(await bufToStr(statementBuf))});`);
                            break;
                        case ReadMode.Escaped:
                            statements.push(`;$$OUTPUT.push($$ESCAPE(${removeLastSemi(await bufToStr(statementBuf))}));`);
                            break;
                        case ReadMode.Evaluate:
                            statements.push(await bufToStr(statementBuf));
                            break;
                    }
                }
                statementBuf.reset();
                readMode = ReadMode.Normal;
                continue;
            }
            await statementBufWrite(buf.shift());
        }
        while (buf.length > 0) {
            await statementBufWrite(buf.shift());
        }
        statements.push(`$$OUTPUT.push(\`${await bufToStrWithSanitize(statementBuf)}\`);`);
        statementBuf.reset();
        return await NewTemplate(statements.join(""));
    }
    exports_101("compile", compile);
    async function renderToString(body, params) {
        const reader = new StringReader(body);
        const template = await compile(reader);
        return template(params);
    }
    exports_101("renderToString", renderToString);
    async function renderFileToString(path, params) {
        const file = await open(path);
        const template = await compile(file);
        file.close();
        return template(params);
    }
    exports_101("renderFileToString", renderFileToString);
    async function render(body, params) {
        const result = await renderToString(body, params);
        return new StringReader(result);
    }
    exports_101("render", render);
    async function renderFile(path, params) {
        const result = await renderFileToString(path, params);
        return new StringReader(result);
    }
    exports_101("renderFile", renderFile);
    return {
        setters: [
            function (utf8_ts_7_1) {
                utf8_ts_7 = utf8_ts_7_1;
            },
            function (bufio_ts_6_1) {
                bufio_ts_6 = bufio_ts_6_1;
            },
            function (escape_js_2_1) {
                escape_js_2 = escape_js_2_1;
            }
        ],
        execute: function () {
            open = Deno.open;
            (function (ReadMode) {
                ReadMode[ReadMode["Normal"] = 0] = "Normal";
                ReadMode[ReadMode["Escaped"] = 1] = "Escaped";
                ReadMode[ReadMode["Raw"] = 2] = "Raw";
                ReadMode[ReadMode["Comment"] = 3] = "Comment";
                ReadMode[ReadMode["Evaluate"] = 4] = "Evaluate";
            })(ReadMode || (ReadMode = {}));
            (function (Codes) {
                Codes[Codes["Begin"] = 60] = "Begin";
                Codes[Codes["End"] = 62] = "End";
                Codes[Codes["Percent"] = 37] = "Percent";
                Codes[Codes["Escaped"] = 61] = "Escaped";
                Codes[Codes["Raw"] = 45] = "Raw";
                Codes[Codes["Comment"] = 35] = "Comment";
            })(Codes || (Codes = {}));
            decoder = new TextDecoder("utf-8");
            StringReader = class StringReader extends Deno.Buffer {
                constructor(s) {
                    super(utf8_ts_7.encode(s).buffer);
                }
            };
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/dependencies", ["https://deno.land/x/oak@v6.0.1/mod", "https://deno.land/x/bcrypt@v0.2.4/mod", "https://deno.land/x/djwt@v1.2/create", "https://deno.land/x/djwt@v1.2/validate", "https://deno.land/x/dejs@0.8.0/mod"], function (exports_102, context_102) {
    "use strict";
    var __moduleName = context_102 && context_102.id;
    return {
        setters: [
            function (mod_ts_14_1) {
                exports_102({
                    "Application": mod_ts_14_1["Application"],
                    "Context": mod_ts_14_1["Context"],
                    "Router": mod_ts_14_1["Router"]
                });
            },
            function (mod_ts_15_1) {
                exports_102({
                    "hashSync": mod_ts_15_1["hashSync"],
                    "compareSync": mod_ts_15_1["compareSync"]
                });
            },
            function (create_ts_2_1) {
                exports_102({
                    "makeJwt": create_ts_2_1["makeJwt"],
                    "setExpiration": create_ts_2_1["setExpiration"]
                });
            },
            function (validate_ts_1_1) {
                exports_102({
                    "validateJwt": validate_ts_1_1["validateJwt"]
                });
            },
            function (mod_ts_16_1) {
                exports_102({
                    "renderFileToString": mod_ts_16_1["renderFileToString"]
                });
            }
        ],
        execute: function () {
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/users", [], function (exports_103, context_103) {
    "use strict";
    var users;
    var __moduleName = context_103 && context_103.id;
    return {
        setters: [],
        execute: function () {
            exports_103("users", users = []);
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/routes", ["file:///Users/martinm/code/deno_JWT/dependencies", "file:///Users/martinm/code/deno_JWT/users"], function (exports_104, context_104) {
    "use strict";
    var dependencies_ts_1, users_ts_1, home, login, register, protectedRoute, postLogin, postRegister, logout;
    var __moduleName = context_104 && context_104.id;
    return {
        setters: [
            function (dependencies_ts_1_1) {
                dependencies_ts_1 = dependencies_ts_1_1;
            },
            function (users_ts_1_1) {
                users_ts_1 = users_ts_1_1;
            }
        ],
        execute: function () {
            exports_104("home", home = async (ctx) => {
                const user = ctx.state.currentUser;
                ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    user,
                });
            });
            exports_104("login", login = async (ctx) => {
                ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/login.ejs`, { error: null });
            });
            exports_104("register", register = async (ctx) => {
                ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/register.ejs`, { user: null });
            });
            exports_104("protectedRoute", protectedRoute = async (ctx) => {
                ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/protected.ejs`, { user: null });
            });
            exports_104("postLogin", postLogin = async (ctx) => {
                const body = await ctx.request.body();
                const value = await body.value;
                const username = value.get("username");
                const password = value.get("password");
                const user = users_ts_1.users.find((user) => user.username === username);
                if (!user) {
                    ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/login.ejs`, {
                        error: "Incorrect Username",
                    });
                }
                else if (!dependencies_ts_1.compareSync(password, user.password)) {
                    ctx.response.body = await dependencies_ts_1.renderFileToString(`${Deno.cwd()}/views/login.ejs`, {
                        error: "Incorrect Password",
                    });
                }
                else {
                    const key = Deno.env.get("JWT_KEY") || "";
                    const header = {
                        alg: "HS256",
                        typ: "JWT",
                    };
                    const payload = {
                        iss: user.username,
                        exp: dependencies_ts_1.setExpiration(new Date().getTime() + 1000 * 60 * 60),
                    };
                    const jwt = await dependencies_ts_1.makeJwt({ key, header, payload });
                    ctx.cookies.set("jwt", jwt);
                    ctx.response.redirect("/");
                }
            });
            exports_104("postRegister", postRegister = async (ctx) => {
                const body = await ctx.request.body();
                const value = await body.value;
                const name = value.get("name");
                const username = value.get("username");
                const plainPwd = value.get("password");
                const password = dependencies_ts_1.hashSync(plainPwd);
                const user = { name, username, password };
                users_ts_1.users.push(user);
                ctx.response.redirect("/login");
            });
            exports_104("logout", logout = async (ctx) => {
                ctx.cookies.delete("jwt");
                ctx.response.redirect("/");
            });
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/helpers/userMiddleware", ["file:///Users/martinm/code/deno_JWT/dependencies", "file:///Users/martinm/code/deno_JWT/users"], function (exports_105, context_105) {
    "use strict";
    var dependencies_ts_2, users_ts_2, key, userMiddleware;
    var __moduleName = context_105 && context_105.id;
    return {
        setters: [
            function (dependencies_ts_2_1) {
                dependencies_ts_2 = dependencies_ts_2_1;
            },
            function (users_ts_2_1) {
                users_ts_2 = users_ts_2_1;
            }
        ],
        execute: function () {
            key = Deno.env.get("JWT_KEY") || "";
            userMiddleware = async (ctx, next) => {
                const jwt = ctx.cookies.get("jwt");
                if (jwt) {
                    const data = await dependencies_ts_2.validateJwt({ jwt, key, algorithm: "HS256" });
                    if (data) {
                        const user = users_ts_2.users.find((u) => (u.username = data.payload.iss));
                        ctx.state.currentUser = user;
                    }
                    else {
                        ctx.cookies.delete("jwt");
                        ctx.state.currentUser = null;
                    }
                }
                else {
                    ctx.state.currentUser = null;
                }
                await next();
            };
            exports_105("default", userMiddleware);
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/helpers/authMiddleware", [], function (exports_106, context_106) {
    "use strict";
    var key, authMiddleware;
    var __moduleName = context_106 && context_106.id;
    return {
        setters: [],
        execute: function () {
            key = Deno.env.get("JWT_KEY") || "";
            authMiddleware = async (ctx, next) => {
                if (!ctx.state.currentUser) {
                    ctx.response.redirect("/login");
                }
                else {
                    await next();
                }
            };
            exports_106("default", authMiddleware);
        }
    };
});
System.register("file:///Users/martinm/code/deno_JWT/server", ["https://deno.land/x/dotenv@v0.5.0/mod", "file:///Users/martinm/code/deno_JWT/dependencies", "file:///Users/martinm/code/deno_JWT/routes", "file:///Users/martinm/code/deno_JWT/helpers/userMiddleware", "file:///Users/martinm/code/deno_JWT/helpers/authMiddleware"], function (exports_107, context_107) {
    "use strict";
    var dependencies_ts_3, routes_ts_1, userMiddleware_ts_1, authMiddleware_ts_1, app, router, port;
    var __moduleName = context_107 && context_107.id;
    return {
        setters: [
            function (_1) {
            },
            function (dependencies_ts_3_1) {
                dependencies_ts_3 = dependencies_ts_3_1;
            },
            function (routes_ts_1_1) {
                routes_ts_1 = routes_ts_1_1;
            },
            function (userMiddleware_ts_1_1) {
                userMiddleware_ts_1 = userMiddleware_ts_1_1;
            },
            function (authMiddleware_ts_1_1) {
                authMiddleware_ts_1 = authMiddleware_ts_1_1;
            }
        ],
        execute: function () {
            app = new dependencies_ts_3.Application();
            router = new dependencies_ts_3.Router();
            port = 8000;
            app.use(userMiddleware_ts_1.default);
            app.use(router.routes());
            app.use(router.allowedMethods());
            app.addEventListener("error", (e) => console.log(e.error));
            router
                .get("/", routes_ts_1.home)
                .get("/login", routes_ts_1.login)
                .get("/register", routes_ts_1.register)
                .get("/protected", authMiddleware_ts_1.default, routes_ts_1.protectedRoute)
                .post("/login", routes_ts_1.postLogin)
                .post("/register", routes_ts_1.postRegister)
                .get("/logout", routes_ts_1.logout);
            app.listen({ port });
            console.log(`Server started on port ${port}`);
        }
    };
});

__instantiate("file:///Users/martinm/code/deno_JWT/server", false);
