;; Constants
(define-constant secp256k1P 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f)
(define-constant secp256k1N 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141)
(define-constant G (tuple (x 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798) 
                          (y 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8)))

(define-constant TapLeafTag 0x5461704c656166) ;; "TapLeaf"
(define-constant TapTweakTag 0x546170547765616b) ;; "TapTweak"

(define-constant TAP_LEAF_VERSION 0xc0)

(define-private (is-even (n uint))
  (is-eq (mod n 2) 0))

(define-private (pow-mod (_base uint) (_exp uint) (_mod uint))
  ;; WARNING: this is not secure, may exceed the uint limitation
  (mod (pow _base _exp) _mod))

(define-private (uint-to-buff-be (n uint) (len uint))
  ;; TODO: implement it
)

;; TODO: add code (map-set number-to-buff-map u0 0x) ...
(define-map number-to-buff-map (n uint) (buff 1))
(define-private (get-buff-by-number? (number (optional uint)))
  (match number
    (none)
    (map-get? number-to-buff-map n)))
(define-private (create-buff-step (number uint) (acc (buff 10000)))
  (let ((buf (unwrap-panic (get-buff-by-number? number))))
    (concat acc buf)))
(define-private (create-buff (contents (list 10000 uint)))
  (if (is-eq (len contents) 0)
    0x
    (if (is-eq (len contents) 1)
      (unwrap-panic (get-buff-by-number? (element-at? 0 contents)))
      (fold create-buff-step contents 0x))))

(define-private (tagged-hash (tag (buff 256)) (msg (buff 256)))
  (let ((tag-hash (sha256 tag)))
    (sha256 (concat tag-hash (concat tag-hash msg)))))

(define-private (lift-x (x uint))
  (if (>= x secp256k1P)
    none
    (let ((y-sq (mod (+ (pow-mod x 3 secp256k1P) 7) secp256k1P))
          (y (pow-mod y-sq (/ (+ secp256k1P 1) 4) secp256k1P)))
      (if (not (is-eq (pow-mod y 2 secp256k1P) y-sq))
        none
        (some (tuple (x x) (y (if (is-even y) y (- secp256k1P y)))))))))

(define-private (point-add (P1 (tuple (x uint) (y uint))) (P2 (tuple (x uint) (y uint))))
  (if (and (is-eq (get x P1) (get x P2)) (not (is-eq (get y P1) (get y P2))))
    none
    (let ((lam (if (and (is-eq (get x P1) (get x P2))
                        (is-eq (get y P1) (get y P2)))
                 (mod (* 3 (get x P1) (get x P1) (pow-mod (* 2 (get y P1)) (- secp256k1P 2) secp256k1P)) secp256k1P)
                 (mod (* (- (get y P2) (get y P1)) (pow-mod (- (get x P2) (get x P1)) (- secp256k1P 2) secp256k1P)) secp256k1P)))
          (x3 (mod (- (* lam lam) (get x P1) (get x P2)) secp256k1P))
          (y3 (mod (- (* lam (- (get x P1) x3)) (get y P1)) secp256k1P)))
      (some (tuple (x x3) (y y3))))))

(define-private (point-mul (P (tuple (x uint) (y uint))) (n uint))
  ;; TODO: implement it
)

(define-private (taproot-tweak-pubkey (pubkey (buff 32)) (h (buff 32)))
  (let ((_t (mod (buff-to-uint-be (tagged-hash TapTweakTag (concat pubkey h))) secp256k1N))
        (t (if (>= _t secp256k1N) (err u0) (some _t)))
        (P (lift-x (buff-to-uint-be pubkey)))
        (Q (point-add (unwrap-panic P)
                      (point-mul G (unwrap-panic t)))))
    (ok (tuple
          (parity (if (is-even (get y (unwrap-panic Q))) u0 u1))
          (hash (uint-to-buff-be (get x (unwrap-panic Q)) u32))))))

(define-private (ser-script (script (buff 256)))
  ;; TODO: implement it
)

(define-public (get-simple-taproot-script-address (pubkey (buff 32)) (script (buff 256)))
  (let ((h (tagged-hash TapLeafTag (concat TAP_LEAF_VERSION (ser-script script)))))
    (get hash (taproot-tweak-pubkey pubkey h))))
