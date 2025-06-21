// ecdh.js ���� ECDH���ļ���ģ�飨����ecdh.html��

// ��Բ���߲�������secp256k1Ϊ����
const EC_PARAMS = {
    p: BigInt(233),
    a: BigInt(1),
    b: BigInt(1),
    Gx: BigInt(4),
    Gy: BigInt(5),
    n: BigInt(100)
};

// ��Բ���ߵ�ӷ�
function ecAdd(P, Q, params = EC_PARAMS) {
    if (P.inf) return Q;
    if (Q.inf) return P;
    const { p } = params;
    if (P.x === Q.x && P.y === (p - Q.y) % p) return { inf: true }; // P + (-P) = O

    let m;
    if (P.x === Q.x && P.y === Q.y) {
        // 2P
        m = (3n * P.x * P.x + params.a) * modInv(2n * P.y, p) % p;
    } else {
        // P + Q
        m = (Q.y - P.y) * modInv(Q.x - P.x, p) % p;
    }
    const rx = (m * m - P.x - Q.x) % p;
    const ry = (m * (P.x - rx) - P.y) % p;
    return { x: (rx + p) % p, y: (ry + p) % p };
}

// ��Բ���ߵ�����˷�
function ecMul(k, P, params = EC_PARAMS) {
    let N = P;
    let Q = { inf: true };
    k = BigInt(k);
    while (k > 0n) {
        if (k & 1n) Q = ecAdd(Q, N, params);
        N = ecAdd(N, N, params);
        k >>= 1n;
    }
    return Q;
}

// ����Ԫ
function modInv(a, p) {
    let lm = 1n, hm = 0n, low = (a % p + p) % p, high = p;
    while (low > 1n) {
        let r = high / low;
        let nm = hm - lm * r;
        let nw = high - low * r;
        hm = lm; high = low; lm = nm; low = nw;
    }
    return lm % p >= 0n ? lm % p : (lm % p + p) % p;
}

// ����˽Կ����Χ[1, n-1]��
function generatePrivateKey() {
    const n = EC_PARAMS.n;
    let priv;
    do {
        priv = BigInt('0x' + crypto.getRandomValues(new Uint32Array(8)).reduce((str, v) => str + v.toString(16).padStart(8, '0'), '')) % n;
    } while (priv <= 0n || priv >= n);
    return priv;
}

// ���㹫Կ
function calculatePublicKey(privateKey) {
    return ecMul(privateKey, { x: EC_PARAMS.Gx, y: EC_PARAMS.Gy }, EC_PARAMS);
}

// ���㹲����Կ
function calculateSharedSecret(privateKey, otherPublicKey) {
    return ecMul(privateKey, otherPublicKey, EC_PARAMS);
}

// ��Կ��ʽ��Ϊ�ַ���
function pointToString(P) {
    if (P.inf) return '��';
    return `(${P.x.toString(16)}, ${P.y.toString(16)})`;
}

// ��֤�������
function validateInputs(privA, privB) {
    if (!privA || !privB) {
        return { valid: false, message: "����д����˽Կ" };
    }
    if (privA <= 0n || privB <= 0n || privA >= EC_PARAMS.n || privB >= EC_PARAMS.n) {
        return { valid: false, message: "˽Կ������ 1 ~ n-1 ֮��" };
    }
    return { valid: true };
}

// ������ȫ��
window.EC_PARAMS = EC_PARAMS;
window.ecAdd = ecAdd;
window.ecMul = ecMul;
window.modInv = modInv;
window.generatePrivateKey = generatePrivateKey;
window.calculatePublicKey = calculatePublicKey;
window.calculateSharedSecret = calculateSharedSecret;
window.pointToString = pointToString;
window.validateInputs = validateInputs;