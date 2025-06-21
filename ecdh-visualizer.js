/**
 * ECDH 可视化模块 - 实现椭圆曲线迪菲-赫尔曼密钥交换协议的可视化演示
 * 主要包含DOM操作、动画效果和用户交互逻辑
 * 算法核心逻辑在 window.calculatePublicKey 和 window.calculateSharedSecret 中实现
 */

// 存储参与方节点状态的对象
// 每个节点包含位置坐标、公私钥信息和对应的DOM元素
let nodes = {
    Alice: {
        x: 40,  // 节点初始x坐标
        y: 250,  // 节点初始y坐标
        privateKey: null,  // 私钥存储
        publicKey: null,   // 公钥存储
        element: null      // 对应的DOM元素
    },
    Bob: {
        x: 560,
        y: 250,
        privateKey: null,
        publicKey: null,
        element: null
    }
};

// 动画状态标志
let isAnimating = false;
let particleSystem = null;
let progressBar = null;

// 获取可视化容器元素
const visualization = document.querySelector('.canvas-container_ecdh') || document.getElementById('visualization') || document.querySelector('.visualization-panel .canvas-container_ecdh');

/**
 * 粒子系统类 - 用于创建数据流动的视觉效果
 */
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.isActive = false;
    }

    createParticle(x, y, targetX, targetY, color = '#3498db') {
        const particle = document.createElement('div');
        particle.className = 'data-particle';
        particle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: ${color};
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 10px ${color};
        `;
        
        this.container.appendChild(particle);
        this.particles.push(particle);
        
        return particle;
    }

    async animateParticle(particle, targetX, targetY, duration = 1.5) {
        return new Promise(resolve => {
            gsap.to(particle, {
                x: targetX - parseFloat(particle.style.left),
                y: targetY - parseFloat(particle.style.top),
                duration: duration,
                ease: "power2.out",
                onComplete: () => {
                    particle.remove();
                    this.particles = this.particles.filter(p => p !== particle);
                    resolve();
                }
            });
        });
    }

    async createDataFlow(fromX, fromY, toX, toY, count = 5, color = '#3498db') {
        const promises = [];
        for (let i = 0; i < count; i++) {
            const delay = i * 0.1;
            setTimeout(() => {
                const particle = this.createParticle(fromX, fromY, toX, toY, color);
                promises.push(this.animateParticle(particle, toX, toY));
            }, delay * 1000);
        }
        await Promise.all(promises);
    }

    clear() {
        this.particles.forEach(particle => particle.remove());
        this.particles = [];
    }
}

/**
 * 进度条类 - 显示协议执行进度
 */
class ProgressBar {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.progress = 0;
        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'protocol-progress';
        this.element.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">准备中...</div>
            </div>
        `;
        this.container.appendChild(this.element);
    }

    update(progress, text) {
        this.progress = progress;
        const fill = this.element.querySelector('.progress-fill');
        const textEl = this.element.querySelector('.progress-text');
        
        gsap.to(fill, {
            width: `${progress}%`,
            duration: 0.5,
            ease: "power2.out"
        });
        
        if (text) {
            textEl.textContent = text;
        }
    }

    hide() {
        gsap.to(this.element, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => {
                if (this.element) {
                    this.element.remove();
                    this.element = null;
                }
            }
        });
    }
}

/**
 * 初始化可视化界面
 * 清除现有内容并重新创建参数显示区域和节点DOM元素
 */
function initVisualization() {
    if (!visualization) {
        console.error('找不到可视化容器');
        return;
    }
    
    visualization.innerHTML = '';
    
    // 初始化粒子系统
    particleSystem = new ParticleSystem(visualization);
    
    // 创建进度条
    progressBar = new ProgressBar(visualization);
    
    createParamsDisplay();
    createDOMNodes();
    // 不再自动刷新参数区，保持为未设置
}

/**
 * 创建参数显示区域
 * 包含素数p和基点G的展示面板
 */
function createParamsDisplay() {
    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'params-display';
    paramsDiv.id = 'params-display';
    paramsDiv.innerHTML = `
        <h3>协议参数</h3>
        <div class="param-item">
            <span class="param-label">素数 p:</span> 
            <span class="param-value" id="display-p">未设置</span>
        </div>
        <div class="param-item">
            <span class="param-label">基点 G:</span> 
            <span class="param-value" id="display-g">未设置</span>
        </div>
    `;
    
    // 添加3D进入动画
    gsap.fromTo(paramsDiv, 
        { opacity: 0, scale: 0.8, rotationY: -15 },
        { opacity: 1, scale: 1, rotationY: 0, duration: 0.8, ease: "back.out(1.7)" }
    );
    
    visualization.appendChild(paramsDiv);
}

/**
 * 更新参数显示区域
 * @param {number} p - 素数p值
 * @param {object} g - 基点G的坐标对象{x, y}
 */
function updateParamsDisplay(p, g) {
    const pElement = document.getElementById('display-p');
    const gElement = document.getElementById('display-g');
    
    if (!pElement || !gElement) {
        console.error('找不到参数显示元素');
        return;
    }
    
    // 兼容g为undefined时自动组装
    let gx, gy;
    if (!g || typeof g.x === 'undefined' || typeof g.y === 'undefined') {
        // 取全局EC_PARAMS的Gx/Gy
        gx = window.EC_PARAMS.Gx;
        gy = window.EC_PARAMS.Gy;
    } else {
        gx = g.x;
        gy = g.y;
    }
    const pStr = p.toString(16);
    const gStr = `(${gx.toString(16)}, ${gy.toString(16)})`;

    // 直接设置文本内容，不使用数字动画
    pElement.textContent = pStr;
    gElement.textContent = gStr;

    // 使用缩放和淡入动画
    gsap.fromTo([pElement, gElement], 
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.2 }
    );
}

/**
 * 创建参与方节点的DOM元素
 * 清除任何现有的节点元素并重新创建Alice和Bob的节点
 */
function createDOMNodes() {
    // 移除已有的节点元素
    const existingNodes = visualization.querySelectorAll('.node');
    existingNodes.forEach(node => node.remove());

    // 创建Alice节点DOM
    const aliceNode = document.createElement('div');
    aliceNode.className = 'node alice-node';
    aliceNode.innerHTML = `
        <div class="node-header">Alice</div>
        <div class="node-content">
            <div class="private-key">私钥 a: <span class="key-value">-</span></div>
            <div class="public-key">公钥 A: <span class="key-value">-</span></div>
        </div>
        <div class="node-glow"></div>
    `;
    aliceNode.style.left = `${nodes.Alice.x}px`;
    aliceNode.style.top = `${nodes.Alice.y}px`;

    // 创建Bob节点DOM
    const bobNode = document.createElement('div');
    bobNode.className = 'node bob-node';
    bobNode.innerHTML = `
        <div class="node-header">Bob</div>
        <div class="node-content">
            <div class="private-key">私钥 b: <span class="key-value">-</span></div>
            <div class="public-key">公钥 B: <span class="key-value">-</span></div>
        </div>
        <div class="node-glow"></div>
    `;
    bobNode.style.left = `${nodes.Bob.x}px`;
    bobNode.style.top = `${nodes.Bob.y}px`;

    // 将节点添加到可视化容器
    visualization.appendChild(aliceNode);
    visualization.appendChild(bobNode);

    // 保存对DOM元素的引用
    nodes.Alice.element = aliceNode;
    nodes.Bob.element = bobNode;

    // 节点进入动画
    gsap.fromTo([aliceNode, bobNode], 
        { opacity: 0, scale: 0.5, y: 50 },
        { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "back.out(1.7)",
            stagger: 0.2
        }
    );
}

/**
 * 显示步骤信息
 * @param {string} title - 步骤标题
 * @param {string} message - 步骤详细信息
 */
async function showStep(title, message) {
    const logs = document.getElementById('logs');
    if (!logs) {
        console.error('找不到日志容器');
        return;
    }
    
    const step = document.createElement('div');
    step.className = 'step-indicator';
    step.innerHTML = `<strong>${title}:</strong> ${message}`;
    logs.appendChild(step);
    // 使用GSAP添加动画效果
    gsap.fromTo(step, 
        { opacity: 0, x: -20, scale: 0.9 }, 
        { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
    );
    logs.scrollTop = logs.scrollHeight;
}

/**
 * 高亮显示指定节点
 * @param {string} party - 要高亮的参与方 ('Alice' 或 'Bob')
 * @param {boolean} highlight - 是否高亮 (true=高亮, false=取消高亮)
 */
function highlightNode(party, highlight = true) {
    const node = nodes[party].element;
    if (highlight) {
        node.classList.add('highlight');
        // 添加脉冲动画
        gsap.to(node, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
        
        // 添加发光效果
        const glow = node.querySelector('.node-glow');
        if (glow) {
            gsap.to(glow, {
                opacity: 0.8,
                scale: 1.2,
                duration: 0.5,
                ease: "power2.out"
            });
        }
    } else {
        node.classList.remove('highlight');
        // 恢复正常状态
        gsap.to(node, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        });
        
        const glow = node.querySelector('.node-glow');
        if (glow) {
            gsap.to(glow, {
                opacity: 0,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }
}

/**
 * 显示密钥的动画效果
 * @param {HTMLElement} spanElement - 要显示动画的目标元素
 * @param {string} value - 要显示的值
 */
async function animateKeyDisplay(spanElement, value) {
    await gsap.fromTo(spanElement, 
        { opacity: 0, scale: 0.5, rotationY: -90 }, 
        {
            opacity: 1, scale: 1, rotationY: 0, duration: 0.8, ease: "back.out(1.7)",
            onStart: () => spanElement.textContent = value
        }
    );
}

/**
 * 计算并显示公私钥
 * @param {string} party - 参与方 ('Alice' 或 'Bob')
 * @param {BigInt} privateKey - 私钥值
 */
async function calculateKey(party, privateKey) {
    if (!nodes[party] || !nodes[party].element) {
        console.error(`找不到${party}节点元素`);
        return;
    }
    if(party === 'Alice'){
        pK = "a"
        pubK = "A"
    }else{
        pK = "b"
        pubK = "B"
    }
    highlightNode(party, true);
    
    // 显示私钥生成过程
    showStep(`${party}生成私钥`, `私钥 ${pK} = ${privateKey.toString(16)}`);
    await new Promise(r => setTimeout(r, 1000));
    
    // 显示公钥计算过程
    showStep(`${party}计算公钥`, `公钥 ${pubK} = ${pK}G = ${privateKey.toString(16)} × G`);
    await new Promise(r => setTimeout(r, 1000));
    
    const publicKey = window.calculatePublicKey(privateKey);
    nodes[party].privateKey = privateKey.toString(16);
    nodes[party].publicKey = publicKey;

    // 显示公钥计算结果
    showStep(`${party}公钥计算完成`, `公钥 ${pubK} = ${window.pointToString(publicKey)}`);
    await new Promise(r => setTimeout(r, 1000));

    const node = nodes[party].element;
    const privSpan = node.querySelector('.private-key .key-value');
    const pubSpan = node.querySelector('.public-key .key-value');

    if (privSpan && pubSpan) {
        await animateKeyDisplay(privSpan, privateKey.toString(16));
        await new Promise(r => setTimeout(r, 1000));
        await animateKeyDisplay(pubSpan, window.pointToString(publicKey));
    }
    
    highlightNode(party, false);
}

/**
 * 创建箭头SVG元素用于表示公钥交换
 * @param {number} fromX - 起点x坐标
 * @param {number} fromY - 起点y坐标
 * @param {number} toX - 终点x坐标
 * @param {number} toY - 终点y坐标
 * @param {string} label - 箭头标签
 * @param {string} color - 箭头颜色
 * @returns {Object} 包含SVG元素及其子元素的对象
 */
function createArrowSVG(fromX, fromY, toX, toY, label, color = '#3498db') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '100';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '10,5');
    line.setAttribute('opacity', '0');
    line.className = 'arrow-line';

    const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    const x1 = toX - arrowLength * Math.cos(angle - arrowAngle);
    const y1 = toY - arrowLength * Math.sin(angle - arrowAngle);
    const x2 = toX - arrowLength * Math.cos(angle + arrowAngle);
    const y2 = toY - arrowLength * Math.sin(angle + arrowAngle);
    
    arrowHead.setAttribute('points', `${toX},${toY} ${x1},${y1} ${x2},${y2}`);
    arrowHead.setAttribute('fill', color);
    arrowHead.setAttribute('opacity', '0');
    arrowHead.className = 'arrow-head';

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 10;
    text.setAttribute('x', midX);
    text.setAttribute('y', midY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('opacity', '0');
    text.className = 'arrow-label';
    text.textContent = label;

    svg.appendChild(line);
    svg.appendChild(arrowHead);
    svg.appendChild(text);

    return { svg, line, arrowHead, text };
}

/**
 * 动画显示箭头和数据流动
 * @param {number} fromX - 起点x坐标
 * @param {number} fromY - 起点y坐标
 * @param {number} toX - 终点x坐标
 * @param {number} toY - 终点y坐标
 * @param {string} label - 箭头标签
 * @param {string} color - 箭头颜色
 */
async function animateArrow(fromX, fromY, toX, toY, label, color = '#3498db') {
    const { svg, line, arrowHead, text } = createArrowSVG(fromX, fromY, toX, toY, label, color);
    visualization.appendChild(svg);

    // 创建数据流动效果
    await particleSystem.createDataFlow(fromX, fromY, toX, toY, 8, color);

    // 动画显示线条
    await gsap.to(line, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
    });

    // 动画显示箭头头部
    await gsap.to(arrowHead, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
    });

    // 动画显示标签
    await gsap.to(text, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
    });

    // 保持显示一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 淡出动画
    await gsap.to([line, arrowHead, text], {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in"
    });

    svg.remove();
}

/**
 * 交换公钥动画
 */
async function exchangeKeys() {
    showStep('公钥交换', 'Alice和Bob交换各自的公钥');

    // 更新进度条
    if (progressBar) {
        progressBar.update(50, '交换公钥中...');
    }

    // 从Alice到Bob的箭头
    const aliceRect = nodes.Alice.element.getBoundingClientRect();
    const bobRect = nodes.Bob.element.getBoundingClientRect();
    const containerRect = visualization.getBoundingClientRect();

    const fromX = aliceRect.left + aliceRect.width - containerRect.left;
    const fromY = aliceRect.top + aliceRect.height / 2 - containerRect.top;
    const toX = bobRect.left - containerRect.left;
    const toY = bobRect.top + bobRect.height / 2 - containerRect.top;

    await animateArrow(fromX, fromY, toX, toY, '公钥A', '#e74c3c');

    // 从Bob到Alice的箭头
    const fromX2 = bobRect.left - containerRect.left;
    const fromY2 = bobRect.top + bobRect.height / 2 - containerRect.top;
    const toX2 = aliceRect.left + aliceRect.width - containerRect.left;
    const toY2 = aliceRect.top + aliceRect.height / 2 - containerRect.top;

    await animateArrow(fromX2, fromY2, toX2, toY2, '公钥B', '#f39c12');
}

/**
 * 计算共享密钥的可视化
 * @param {string} party - 参与方名称
 * @param {BigInt} privateKey - 私钥值
 */
async function calculateSharedSecretVisual(party, privateKey) {
    const otherParty = party === 'Alice' ? 'Bob' : 'Alice';
    const otherPublicKey = nodes[otherParty].publicKey;
    
    showStep(`${party}计算共享密钥`, `${party}使用自己的私钥和${otherParty}的公钥计算共享密钥`);
    
    // 高亮当前计算的节点
    highlightNode(party, true);

    // 模拟计算过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sharedSecret = window.calculateSharedSecret(privateKey, otherPublicKey);
    
    // 更新节点显示共享密钥
    const node = nodes[party].element;
    const sharedKeyDiv = document.createElement('div');
    sharedKeyDiv.className = 'shared-key';
    sharedKeyDiv.innerHTML = `共享密钥: <span class="key-value">${sharedSecret.x ? sharedSecret.x.toString(16) : '[无效]'} </span>`;
    
    // 添加共享密钥到节点
    const nodeContent = node.querySelector('.node-content');
    nodeContent.appendChild(sharedKeyDiv);

    // 动画显示共享密钥
    await gsap.fromTo(sharedKeyDiv,
        { opacity: 0, scale: 0.5, rotationY: 180 },
        {
            opacity: 1,
            scale: 1,
            rotationY: 0,
            duration: 1,
            ease: "back.out(1.7)"
        }
    );

    highlightNode(party, false);
    
    return sharedSecret;
}

/**
 * 开始ECDH协议演示
 */
async function startProtocol() {
    if (isAnimating) {
        return;
    }

    isAnimating = true;

    // 获取输入参数
    const inputA = document.getElementById('input-a');
    const inputB = document.getElementById('input-b');
    
    if (!inputA || !inputB) {
        alert('找不到输入元素');
        isAnimating = false;
        return;
    }

    // 直接使用全局参数p，不再从输入框获取
    const p = window.EC_PARAMS.p;

    let a, b;
    try {
        if (!inputA.value || !inputB.value) {
            throw new Error('请填写所有私钥');
        }
        // 检查是否为合法16进制
        if (!/^[0-9a-fA-F]+$/.test(inputA.value) || !/^[0-9a-fA-F]+$/.test(inputB.value)) {
            throw new Error('私钥必须为16进制数字');
        }
        a = BigInt('0x' + inputA.value);
        b = BigInt('0x' + inputB.value);
    } catch (e) {
        alert(e.message || '参数格式错误，请输入有效的16进制数字');
        isAnimating = false;
        return;
    }

    // 验证输入
    if (typeof window.validateInputs === 'function') {
        const validation = window.validateInputs(a, b);
        if (!validation.valid) {
            alert(validation.message);
            isAnimating = false;
            return;
        }
    }

    // 初始化可视化
    initVisualization();
    // 现在刷新参数区
    updateParamsDisplay(window.EC_PARAMS.p, {x: window.EC_PARAMS.Gx, y: window.EC_PARAMS.Gy});
    
    // 更新进度条
    if (progressBar) {
        progressBar.update(10, '初始化完成');
    }

    showStep('协议开始', 'ECDH密钥交换协议开始执行');

    // 步骤1: Alice计算公钥
    if (progressBar) progressBar.update(20, 'Alice计算公钥...');
    await calculateKey('Alice', a);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 步骤2: Bob计算公钥
    if (progressBar) progressBar.update(30, 'Bob计算公钥...');
    await calculateKey('Bob', b);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 步骤3: 交换公钥
    if (progressBar) progressBar.update(50, '交换公钥...');
    await exchangeKeys();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 步骤4: Alice计算共享密钥
    if (progressBar) progressBar.update(70, 'Alice计算共享密钥...');
    const aliceSharedSecret = await calculateSharedSecretVisual('Alice', a);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 步骤5: Bob计算共享密钥
    if (progressBar) progressBar.update(90, 'Bob计算共享密钥...');
    const bobSharedSecret = await calculateSharedSecretVisual('Bob', b);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 验证共享密钥是否相同
    if (aliceSharedSecret.x && bobSharedSecret.x && aliceSharedSecret.x.toString(16) === bobSharedSecret.x.toString(16)) {
        showStep('协议完成', `共享密钥计算成功: ${aliceSharedSecret.x.toString(16)}`);
        if (progressBar) progressBar.update(100, '协议完成！');
        
        // 成功动画
        gsap.to([nodes.Alice.element, nodes.Bob.element], {
            scale: 1.1,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    } else {
        showStep('协议失败', '共享密钥不匹配，请检查参数');
        if (progressBar) progressBar.update(100, '协议失败');
    }

    // 延迟隐藏进度条
    setTimeout(() => {
        if (progressBar) progressBar.hide();
    }, 3000);

    isAnimating = false;
}

/**
 * 重置演示
 */
function reset() {
    isAnimating = false;
    
    // 清除粒子系统
    if (particleSystem) {
        particleSystem.clear();
    }
    
    // 隐藏进度条
    if (progressBar) {
        progressBar.hide();
    }
    
    // 重置输入框
    const inputA = document.getElementById('input-a');
    const inputB = document.getElementById('input-b');
    if (inputA) inputA.value = '';
    if (inputB) inputB.value = '';
    
    // 清空日志
    const logs = document.getElementById('logs');
    if (logs) logs.innerHTML = '';
    
    // 重新初始化可视化
    initVisualization();
    // 不再刷新参数区，保持为未设置
    showStep('重置完成', '所有参数已重置，可以重新开始演示');
}

// 导出全局函数供HTML事件使用
window.startProtocol = startProtocol;
window.reset = reset;
window.showStep = showStep;

// 页面加载完成后初始化可视化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保所有元素都已加载
    setTimeout(() => {
        if (visualization) {
            initVisualization();
        } else {
            console.error('可视化容器未找到，请检查HTML结构');
        }
    }, 100);
});