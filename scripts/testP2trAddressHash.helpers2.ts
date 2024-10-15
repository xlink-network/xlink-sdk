import { sha256 } from "@noble/hashes/sha256"

type Point = [x: bigint, y: bigint]

// https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L14
const secp256k1P = BigInt(
  "0XFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F",
)
// https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L15
const secp256k1N = BigInt(
  "0XFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
)
// https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L19
const G: Point = [
  BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"),
  BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8"),
]

const TAP_LEAF_VERSION = 0xc0
const SECP256K1_ORDER = secp256k1N

export function getSimpleTaprootScriptAddress(
  pubkey: Uint8Array,
  script: Uint8Array,
): Uint8Array {
  /**
   * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0341.mediawiki#L207-L209
   *
        leaf_version, script = script_tree
        h = tagged_hash("TapLeaf", bytes([leaf_version]) + ser_script(script))
        return ([((leaf_version, script), bytes())], h)
   */
  const h = taggedHash(
    "TapLeaf",
    concatBytes(
      new Uint8Array([TAP_LEAF_VERSION]),
      addCompactSizePrefix(script),
    ),
  )

  /**
   * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0341.mediawiki#L217-L229
   */
  return taprootTweakPubkey(pubkey, h)[1]
}

// BTC specific variable length integer encoding
// https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
function addCompactSizePrefix(data: Uint8Array): Uint8Array {
  const length = BigInt(data.length)
  let prefix

  if (length <= 252n) {
    prefix = new Uint8Array([Number(length)])
  } else if (length <= 0xffffn) {
    prefix = new Uint8Array([
      0xfd,
      Number(length & 0xffn),
      Number((length >> 8n) & 0xffn),
    ])
  } else if (length <= 0xffffffffn) {
    prefix = new Uint8Array([
      0xfe,
      Number(length & 0xffn),
      Number((length >> 8n) & 0xffn),
      Number((length >> 16n) & 0xffn),
      Number((length >> 24n) & 0xffn),
    ])
  } else {
    prefix = new Uint8Array([
      0xff,
      Number(length & 0xffn),
      Number((length >> 8n) & 0xffn),
      Number((length >> 16n) & 0xffn),
      Number((length >> 24n) & 0xffn),
      Number((length >> 32n) & 0xffn),
      Number((length >> 40n) & 0xffn),
      Number((length >> 48n) & 0xffn),
      Number((length >> 56n) & 0xffn),
    ])
  }

  // 合并前缀和数据
  const result = new Uint8Array(prefix.length + data.length)
  result.set(prefix, 0) // 设置前缀
  result.set(data, prefix.length) // 设置数据

  return result
}

/**
 * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0341.mediawiki#L181-L189
 *
def taproot_tweak_pubkey(pubkey, h):
    t = int_from_bytes(tagged_hash("TapTweak", pubkey + h))
    if t >= SECP256K1_ORDER:
        raise ValueError
    P = lift_x(int_from_bytes(pubkey))
    if P is None:
        raise ValueError
    Q = point_add(P, point_mul(G, t))
    return 0 if has_even_y(Q) else 1, bytes_from_int(x(Q))
 */
export function taprootTweakPubkey(
  pubkey: Uint8Array,
  h: Uint8Array,
): [number, Uint8Array] {
  const t = bytesToNumberBE(taggedHash("TapTweak", concatBytes(pubkey, h)))
  if (t >= SECP256K1_ORDER) {
    throw new Error("Taproot tweak pubkey: t >= SECP256K1_ORDER")
  }

  const P = lift_x(bytesToNumberBE(pubkey))
  if (P === null) {
    throw new Error("Taproot tweak pubkey: P is null")
  }

  const Q = point_add(P, point_mul(G, t))
  if (Q === null) {
    throw new Error("Taproot tweak pubkey: Q is null")
  }

  return [(Q[1] & 1n) === 0n ? 0 : 1, numberToBytesBE(Q[0], 32)]
}

/**
 * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L23-L27
 *
def tagged_hash(tag: str, msg: bytes) -> bytes:
    tag_hash = hashlib.sha256(tag.encode()).digest()
    return hashlib.sha256(tag_hash + tag_hash + msg).digest()
 */
function taggedHash(tag: string, ...messages: Uint8Array[]): Uint8Array {
  const tagH = sha256(Uint8Array.from(tag, c => c.charCodeAt(0)))
  return sha256(concatBytes(tagH, tagH, ...messages))
}

/**
 * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L40-L52
 *
def point_add(P1: Optional[Point], P2: Optional[Point]) -> Optional[Point]:
    if P1 is None:
        return P2
    if P2 is None:
        return P1
    if (x(P1) == x(P2)) and (y(P1) != y(P2)):
        return None
    if P1 == P2:
        lam = (3 * x(P1) * x(P1) * pow(2 * y(P1), p - 2, p)) % p
    else:
        lam = ((y(P2) - y(P1)) * pow(x(P2) - x(P1), p - 2, p)) % p
    x3 = (lam * lam - x(P1) - x(P2)) % p
    return (x3, (lam * (x(P1) - x3) - y(P1)) % p)
 */
function point_add(P1: Point | null, P2: Point | null): Point | null {
  if (P1 === null) return P2
  if (P2 === null) return P1
  if (P1[0] === P2[0] && P1[1] !== P2[1]) return null

  let lam: bigint
  if (P1[0] === P2[0] && P1[1] === P2[1]) {
    lam =
      (3n * P1[0] * P1[0] * pow(2n * P1[1], secp256k1P - 2n, secp256k1P)) %
      secp256k1P
  } else {
    lam =
      ((P2[1] - P1[1]) * pow(P2[0] - P1[0], secp256k1P - 2n, secp256k1P)) %
      secp256k1P
  }
  const x3 = (lam * lam - P1[0] - P2[0]) % secp256k1P
  return [x3, (lam * (P1[0] - x3) - P1[1]) % secp256k1P]
}

/**
 * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L54-L60
 *
def point_mul(P: Optional[Point], n: int) -> Optional[Point]:
    R = None
    for i in range(256):
        if (n >> i) & 1:
            R = point_add(R, P)
        P = point_add(P, P)
    return R
 */
function point_mul(P: Point | null, n: bigint): Point | null {
  let R: Point | null = null
  for (let i = 0; i < 256; i++) {
    if ((n >> BigInt(i)) & 1n) {
      R = point_add(R, P)
    }
    P = point_add(P, P)
  }
  return R
}

/**
 * https://github.com/bitcoin/bips/blob/71aafb2a7fd56d779ef440114cd59e19d7552dfd/bip-0340/reference.py#L71-L78
 *
def lift_x(x: int) -> Optional[Point]:
    if x >= p:
        return None
    y_sq = (pow(x, 3, p) + 7) % p
    y = pow(y_sq, (p + 1) // 4, p)
    if pow(y, 2, p) != y_sq:
        return None
    return (x, y if y & 1 == 0 else p-y)
 */
function lift_x(x: bigint): Point | null {
  if (x >= secp256k1P) {
    return null
  }

  const y_sq = (pow(x, 3n, secp256k1P) + 7n) % secp256k1P
  const y = pow(y_sq, (secp256k1P + 1n) / 4n, secp256k1P)
  if (pow(y, 2n, secp256k1P) !== y_sq) {
    return null
  }
  return [x, (y & 1n) === 0n ? y : secp256k1P - y]
}

function pow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  base = base % mod

  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod
    }

    base = (base * base) % mod
    exp = exp >> 1n
  }

  return result
}

// BE: Big Endian, LE: Little Endian
function bytesToNumberBE(bytes: Uint8Array): bigint {
  let result = 0n
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i])
  }
  return result
}
function numberToBytesBE(n: bigint, len: number): Uint8Array {
  const result = new Uint8Array(len)
  const byteMask = BigInt(0xff)

  for (let i = len - 1; i >= 0; i--) {
    result[i] = Number(n & byteMask)
    n >>= 8n
  }

  if (n > 0) {
    throw new RangeError(
      "BigInt value is too large to fit in the specified length",
    )
  }

  return result
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  let sum = 0
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i]
    sum += a.length
  }
  const res = new Uint8Array(sum)
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i]
    res.set(a, pad)
    pad += a.length
  }
  return res
}
