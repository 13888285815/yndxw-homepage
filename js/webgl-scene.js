/**
 * YNDSW 官网 3D 场景
 * 纯原生 WebGL，零依赖
 * 实现：3D 粒子球体 + 连线 + 鼠标交互 + 缓慢旋转
 */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return;

  /* ---- 尺寸自适应 ---- */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---- 着色器 ---- */
  const VERT = `
    attribute vec3 aPos;
    attribute float aSize;
    attribute float aAlpha;
    uniform mat4 uProj;
    uniform mat4 uMV;
    uniform float uTime;
    varying float vAlpha;
    void main(){
      vec3 p = aPos;
      p.y += sin(uTime * 0.8 + aPos.x * 3.0) * 0.02;
      gl_Position = uProj * uMV * vec4(p, 1.0);
      gl_PointSize = aSize * (300.0 / gl_Position.w);
      vAlpha = aAlpha * (0.6 + 0.4 * sin(uTime + aPos.z * 5.0));
    }
  `;
  const FRAG = `
    precision mediump float;
    varying float vAlpha;
    void main(){
      float d = length(gl_PointCoord - vec2(0.5));
      if(d > 0.5) discard;
      float glow = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(0.35, 0.9, 0.7, vAlpha * glow);
    }
  `;

  const LINE_VERT = `
    attribute vec3 aPos;
    uniform mat4 uProj;
    uniform mat4 uMV;
    void main(){
      gl_Position = uProj * uMV * vec4(aPos, 1.0);
    }
  `;
  const LINE_FRAG = `
    precision mediump float;
    varying float vAlpha;
    attribute float aAlpha;
    void main(){
      gl_FragColor = vec4(0.35, 0.9, 0.7, 0.06);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  function createProgram(vSrc, fSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(vSrc, gl.VERTEX_SHADER));
    gl.attachShader(p, compileShader(fSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(p));
    }
    return p;
  }

  const prog = createProgram(VERT, FRAG);
  const lineProg = createProgram(LINE_VERT, LINE_FRAG);

  /* ---- 粒子数据（球面分布） ---- */
  const NUM = 2000;
  const posData = new Float32Array(NUM * 3);
  const sizeData = new Float32Array(NUM);
  const alphaData = new Float32Array(NUM);

  // 多层球壳
  for (let i = 0; i < NUM; i++) {
    const shell = i < NUM * 0.6 ? 0 : (i < NUM * 0.85 ? 1 : 2);
    const r = [0.85, 1.0, 1.15][shell];
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;
    posData[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    posData[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    posData[i * 3 + 2] = r * Math.cos(theta);
    sizeData[i] = 1.5 + Math.random() * 2.5;
    alphaData[i] = 0.4 + Math.random() * 0.6;
  }

  /* ---- 粒子 Buffer ---- */
  function createBuffer(data, attrib, size) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, attrib);
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    return buf;
  }

  const posBuf = createBuffer(posData, 'aPos', 3);
  const sizeBuf = createBuffer(sizeData, 'aSize', 1);
  const alphaBuf = createBuffer(alphaData, 'aAlpha', 1);

  /* ---- 连线数据（临近粒子连线） ---- */
  const lineData = [];
  const threshold = 0.4;
  for (let i = 0; i < NUM; i += 3) {
    for (let j = i + 3; j < NUM; j += 3) {
      const dx = posData[i * 3] - posData[j * 3];
      const dy = posData[i * 3 + 1] - posData[j * 3 + 1];
      const dz = posData[i * 3 + 2] - posData[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < threshold && lineData.length < 10000) {
        lineData.push(
          posData[i * 3], posData[i * 3 + 1], posData[i * 3 + 2],
          posData[j * 3], posData[j * 3 + 1], posData[j * 3 + 2]
        );
      }
    }
  }

  const lineArr = new Float32Array(lineData);
  const lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, lineArr, gl.STATIC_DRAW);
  const linePosLoc = gl.getAttribLocation(lineProg, 'aPos');
  const lineCount = lineArr.length / 3;

  /* ---- 矩阵工具 ---- */
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function lookAt(eye, center, up) {
    const zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let len = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz);
    const fz = [zx * len, zy * len, zz * len];
    const sx = up[1] * fz[2] - up[2] * fz[1];
    const sy = up[2] * fz[0] - up[0] * fz[2];
    const sz = up[0] * fz[1] - up[1] * fz[0];
    len = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
    const s = [sx * len, sy * len, sz * len];
    const u = [fz[1] * s[2] - fz[2] * s[1], fz[2] * s[0] - fz[0] * s[2], fz[0] * s[1] - fz[1] * s[0]];
    return new Float32Array([
      s[0], u[0], fz[0], 0,
      s[1], u[1], fz[1], 0,
      s[2], u[2], fz[2], 0,
      -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]),
      -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]),
      -(fz[0] * eye[0] + fz[1] * eye[1] + fz[2] * eye[2]),
      1
    ]);
  }

  function rotateY(mat, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const r = new Float32Array(mat);
    for (let i = 0; i < 4; i++) {
      const a = mat[i], b = mat[i + 8];
      r[i] = a * c + b * s;
      r[i + 8] = b * c - a * s;
    }
    return r;
  }

  function rotateX(mat, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const r = new Float32Array(mat);
    for (let i = 4; i < 8; i++) {
      const a = mat[i], b = mat[i + 8];
      r[i] = a * c - b * s;
      r[i + 8] = a * s + b * c;
    }
    return r;
  }

  /* ---- 鼠标交互 ---- */
  let mouseX = 0, mouseY = 0;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });
  // 触摸支持
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = ((t.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = -((t.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: false });

  /* ---- 渲染循环 ---- */
  const projLoc = gl.getUniformLocation(prog, 'uProj');
  const mvLoc = gl.getUniformLocation(prog, 'uMV');
  const timeLoc = gl.getUniformLocation(prog, 'uTime');
  const lineProjLoc = gl.getUniformLocation(lineProg, 'uProj');
  const lineMvLoc = gl.getUniformLocation(lineProg, 'uMV');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  function render(t) {
    const time = t * 0.001;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const proj = perspective(Math.PI / 3, aspect, 0.1, 100);
    let mv = lookAt([0, 0, 3.5], [0, 0, 0], [0, 1, 0]);
    mv = rotateY(mv, time * 0.15 + mouseX * 0.5);
    mv = rotateX(mv, mouseY * 0.3 + Math.sin(time * 0.1) * 0.1);

    /* 连线 */
    gl.useProgram(lineProg);
    gl.uniformMatrix4fv(lineProjLoc, false, proj);
    gl.uniformMatrix4fv(lineMvLoc, false, mv);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.enableVertexAttribArray(linePosLoc);
    gl.vertexAttribPointer(linePosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineCount);

    /* 粒子 */
    gl.useProgram(prog);
    gl.uniformMatrix4fv(projLoc, false, proj);
    gl.uniformMatrix4fv(mvLoc, false, mv);
    gl.uniform1f(timeLoc, time);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
    const aSize = gl.getAttribLocation(prog, 'aSize');
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
    const aAlpha = gl.getAttribLocation(prog, 'aAlpha');
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, NUM);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
