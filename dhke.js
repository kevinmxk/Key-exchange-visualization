// DHKE核心计算模块

// 快速幂模运算（支持大数）
/**
 * 计算 base 的 exponent 次幂对 modulus 取模的结果
 * @param {string|number} base 底数
 * @param {string|number} exponent 指数
 * @param {string|number} modulus 模数
 * @returns {BigInt} 计算结果
 */
function modExp(base, exponent, modulus) {
    let result = 1n;
    base = BigInt(base);
    exponent = BigInt(exponent);
    modulus = BigInt(modulus);
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent = exponent / 2n;
    }
    return result;
}

// 判断是否为素数
/**
 * 判断一个数是否为素数
 * @param {string|number} n 要判断的数
 * @returns {boolean} 是否为素数
 */
function isPrime(n) {
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;

    for (let i = 5n; i * i <= n; i += 6n) {
        if (n % i === 0n || n % (i + 2n) === 0n) return false;
    }
    return true;
}

// 随机生成大素数
/**
 * 随机生成一个指定位数的大素数
 * @param {number} bits 素数的位数
 * @returns {BigInt} 生成的大素数
 */
function generatePrime(bits = 16) {
    let candidate;
    do {
        candidate = BigInt(Math.floor(Math.random() * (2 ** bits))) | 1n;
    } while (!isPrime(candidate));
    document.getElementById('input-p').value = candidate.toString();
    return candidate;
}

// 验证输入参数
/**
 * 验证Diffie-Hellman密钥交换的输入参数是否合法
 * @param {BigInt} p 大素数
 * @param {BigInt} g 生成元
 * @param {BigInt} a Alice的私钥
 * @param {BigInt} b Bob的私钥
 * @returns {boolean} 参数是否合法
 */
function validateInputs(p, g, a, b) {
    if (
        p === undefined || g === undefined || a === undefined || b === undefined ||
        p === null || g === null || a === null || b === null
    ) {
        return { valid: false, message: "请填写所有参数" };
    }
    if (typeof p !== 'bigint' || typeof g !== 'bigint' || typeof a !== 'bigint' || typeof b !== 'bigint') {
        return { valid: false, message: "参数格式错误，请输入有效的数字" };
    }
    if (p <= 1n || g <= 1n) {
        return { valid: false, message: "p和g必须大于1" };
    }
    if (a <= 0n || b <= 0n) {
        return { valid: false, message: "私钥必须为正整数" };
    }
    if (!isPrime(p)) {
        return { valid: false, message: "p必须是素数" };
    }
    return { valid: true };
}

/**
 * 计算公钥
 * @param {BigInt} privateKey 私钥
 * @param {BigInt} g 生成元
 * @param {BigInt} p 大素数
 * @returns {BigInt} 公钥
 */
function calculatePublicKey(privateKey, g, p) {
    return modExp(g, privateKey, p);
}

/**
 * 计算共享密钥
 * @param {BigInt} privateKey 私钥
 * @param {BigInt} otherPublicKey 对方的公钥
 * @param {BigInt} p 大素数
 * @returns {BigInt} 共享密钥
 */
function calculateSharedSecret(privateKey, otherPublicKey, p) {
    return modExp(otherPublicKey, privateKey, p);
}

// 导出所有需要的函数
window.generatePrime = generatePrime;
window.modExp = modExp;
window.isPrime = isPrime;
window.validateInputs = validateInputs;
window.calculatePublicKey = calculatePublicKey;
window.calculateSharedSecret = calculateSharedSecret;
