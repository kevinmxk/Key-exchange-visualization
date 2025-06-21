// ecdh.js —— ECDH核心计算模块（适配ecdh.html）

// 椭圆曲线参数（以secp256k1为例）
const EC_PARAMS = {
    p: BigInt(233),
    a: BigInt(1),
    b: BigInt(1),
    Gx: BigInt(4),
    Gy: BigInt(5),
    n: BigInt(100)
};

// 椭圆曲线点加法
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

// 椭圆曲线点标量乘法
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

// 求逆元
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

// 生成私钥（范围[1, n-1]）
function generatePrivateKey() {
    const n = EC_PARAMS.n;
    let priv;
    do {
        priv = BigInt('0x' + crypto.getRandomValues(new Uint32Array(8)).reduce((str, v) => str + v.toString(16).padStart(8, '0'), '')) % n;
    } while (priv <= 0n || priv >= n);
    return priv;
}

// 计算公钥
function calculatePublicKey(privateKey) {
    return ecMul(privateKey, { x: EC_PARAMS.Gx, y: EC_PARAMS.Gy }, EC_PARAMS);
}

// 计算共享密钥
function calculateSharedSecret(privateKey, otherPublicKey) {
    return ecMul(privateKey, otherPublicKey, EC_PARAMS);
}

// 公钥格式化为字符串
function pointToString(P) {
    if (P.inf) return '∞';
    return `(${P.x.toString(16)}, ${P.y.toString(16)})`;
}

// 验证输入参数
function validateInputs(privA, privB) {
    if (!privA || !privB) {
        return { valid: false, message: "请填写所有私钥" };
    }
    if (privA <= 0n || privB <= 0n || privA >= EC_PARAMS.n || privB >= EC_PARAMS.n) {
        return { valid: false, message: "私钥必须在 1 ~ n-1 之间" };
    }
    return { valid: true };
}

// 导出到全局
window.EC_PARAMS = EC_PARAMS;
window.ecAdd = ecAdd;
window.ecMul = ecMul;
window.modInv = modInv;
window.generatePrivateKey = generatePrivateKey;
window.calculatePublicKey = calculatePublicKey;
window.calculateSharedSecret = calculateSharedSecret;
window.pointToString = pointToString;
window.validateInputs = validateInputs;