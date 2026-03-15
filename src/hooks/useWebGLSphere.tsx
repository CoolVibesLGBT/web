import { useEffect, useRef } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import { generateFallbackImage, getSafeImageURLEx } from '../helpers/helpers';

// --- SHADERS ---
const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);
    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 5.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }
    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * 1.0 + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

// --- GEOMETRY & WEBGL CLASSES ---
class Face {
    a: number; b: number; c: number;
    constructor(a: number, b: number, c: number) { this.a = a; this.b = b; this.c = c; }
}

class Vertex {
    position: vec3; normal: vec3; uv: vec2;
    constructor(x: number, y: number, z: number) { this.position = vec3.fromValues(x, y, z); this.normal = vec3.create(); this.uv = vec2.create(); }
}

class Geometry {
    vertices: Vertex[] = []; faces: Face[] = [];
    addVertex(...args: number[]) { for (let i = 0; i < args.length; i += 3) { this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2])); } return this; }
    addFace(...args: number[]) { for (let i = 0; i < args.length; i += 3) { this.faces.push(new Face(args[i], args[i + 1], args[i + 2])); } return this; }
    get lastVertex() { return this.vertices[this.vertices.length - 1]; }
    subdivide(divisions = 1) {
        const midPointCache: { [key: string]: number } = {};
        let f = this.faces;
        for (let div = 0; div < divisions; ++div) {
            const newFaces: Face[] = new Array(f.length * 4);
            f.forEach((face, ndx) => {
                const mAB = this.getMidPoint(face.a, face.b, midPointCache); const mBC = this.getMidPoint(face.b, face.c, midPointCache); const mCA = this.getMidPoint(face.c, face.a, midPointCache);
                const i = ndx * 4; newFaces[i] = new Face(face.a, mAB, mCA); newFaces[i + 1] = new Face(face.b, mBC, mAB); newFaces[i + 2] = new Face(face.c, mCA, mBC); newFaces[i + 3] = new Face(mAB, mBC, mCA);
            });
            f = newFaces;
        }
        this.faces = f; return this;
    }
    spherize(radius = 1) { this.vertices.forEach(vertex => { vec3.normalize(vertex.normal, vertex.position); vec3.scale(vertex.position, vertex.normal, radius); }); return this; }
    get data() { return { vertices: this.vertexData, indices: this.indexData, normals: this.normalData, uvs: this.uvData }; }
    get vertexData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.position))); }
    get normalData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal))); }
    get uvData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv))); }
    get indexData() { return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])); }
    getMidPoint(ndxA: number, ndxB: number, cache: { [key: string]: number }) {
        const cacheKey = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
        if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) { return cache[cacheKey]; }
        const a = this.vertices[ndxA].position; const b = this.vertices[ndxB].position; const ndx = this.vertices.length;
        cache[cacheKey] = ndx; this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5); return ndx;
    }
}

class IcosahedronGeometry extends Geometry {
    constructor() {
        super();
        const t = Math.sqrt(5) * 0.5 + 0.5;
        this.addVertex(-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1).addFace(0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1);
    }
}

class DiscGeometry extends Geometry {
    constructor(steps = 4, radius = 1) {
        super();
        steps = Math.max(4, steps); const alpha = (2 * Math.PI) / steps; this.addVertex(0, 0, 0); this.lastVertex.uv[0] = 0.5; this.lastVertex.uv[1] = 0.5;
        for (let i = 0; i < steps; ++i) { const x = Math.cos(alpha * i); const y = Math.sin(alpha * i); this.addVertex(radius * x, radius * y, 0); this.lastVertex.uv[0] = x * 0.5 + 0.5; this.lastVertex.uv[1] = y * 0.5 + 0.5; if (i > 0) { this.addFace(0, i, i + 1); } }
        this.addFace(0, steps, 1);
    }
}

// --- WEBGL UTILS ---
function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type); if (!shader) return null; gl.shaderSource(shader, source); gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error(gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null;
}
function createProgram(gl: WebGL2RenderingContext, shaderSources: string[], transformFeedbackVaryings: string[] | null, attribLocations: { [key: string]: number } | null) {
    const program = gl.createProgram(); if (!program) return null;
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => { const shader = createShader(gl, type, shaderSources[ndx]); if (shader) gl.attachShader(program, shader); });
    if (transformFeedbackVaryings) { gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS); }
    if (attribLocations) { for (const attrib in attribLocations) { gl.bindAttribLocation(program, attribLocations[attrib], attrib); } }
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    // FIX: `getProgramParameter` requires two arguments. Use `getProgramInfoLog` to get linker errors.
    console.error(gl.getProgramInfoLog(program)); gl.deleteProgram(program); return null;
}
function makeVertexArray(gl: WebGL2RenderingContext, bufLocNumElmPairs: [WebGLBuffer, number, number][], indices: Uint16Array | null) {
    const va = gl.createVertexArray(); if (!va) return null; gl.bindVertexArray(va);
    for (const [buffer, loc, numElem] of bufLocNumElmPairs) { if (loc === -1) continue; gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0); }
    if (indices) { const indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW); }
    gl.bindVertexArray(null); return va;
}
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    const dpr = Math.min(2, window.devicePixelRatio); const displayWidth = Math.round(canvas.clientWidth * dpr); const displayHeight = Math.round(canvas.clientHeight * dpr);
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) { canvas.width = displayWidth; canvas.height = displayHeight; }
    return needResize;
}
function makeBuffer(gl: WebGL2RenderingContext, sizeOrData: BufferSource | number, usage: number) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // FIX: Add a type guard to resolve the overloaded function signature for gl.bufferData.
    if (typeof sizeOrData === 'number') {
        gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    } else {
        gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buf;
}
function createAndSetupTexture(gl: WebGL2RenderingContext, minFilter: number, magFilter: number, wrapS: number, wrapT: number) {
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    return texture;
}

// --- CONTROLS ---
class ArcballControl {
    isPointerDown = false; orientation = quat.create(); pointerRotation = quat.create(); rotationVelocity = 0; rotationAxis = vec3.fromValues(1, 0, 0); snapDirection = vec3.fromValues(0, 0, -1);
    snapTargetDirection: vec3 | null = null; EPSILON = 0.1; IDENTITY_QUAT = quat.create();
    canvas: HTMLCanvasElement; updateCallback: (dt: number) => void;
    pointerPos: vec2; previousPointerPos: vec2; private _rotationVelocity = 0; private _combinedQuat = quat.create();
    constructor(canvas: HTMLCanvasElement, updateCallback: (dt: number) => void) {
        this.canvas = canvas; this.updateCallback = updateCallback || (() => null);
        this.pointerPos = vec2.create(); this.previousPointerPos = vec2.create();
        const onPointerDown = (e: PointerEvent) => { vec2.set(this.pointerPos, e.clientX, e.clientY); vec2.copy(this.previousPointerPos, this.pointerPos); this.isPointerDown = true; };
        const onPointerUp = () => { this.isPointerDown = false; };
        const onPointerMove = (e: PointerEvent) => { if (this.isPointerDown) { vec2.set(this.pointerPos, e.clientX, e.clientY); } };
        canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointerleave', onPointerUp); canvas.addEventListener('pointermove', onPointerMove);
        canvas.style.touchAction = 'none';
        this.destroy = () => {
            canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointerleave', onPointerUp); canvas.removeEventListener('pointermove', onPointerMove);
        };
    }
    destroy: () => void;
    update(deltaTime: number, targetFrameDuration = 16) {
        const timeScale = deltaTime / targetFrameDuration + 0.00001; let angleFactor = timeScale; const snapRotation = quat.create();
        if (this.isPointerDown) {
            const INTENSITY = 0.3 * timeScale; const ANGLE_AMPLIFICATION = 5 / timeScale; const midPointerPos = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos); vec2.scale(midPointerPos, midPointerPos, INTENSITY);
            if (vec2.sqrLen(midPointerPos) > this.EPSILON) {
                vec2.add(midPointerPos, this.previousPointerPos, midPointerPos);
                const p = this.#project(midPointerPos); const q = this.#project(this.previousPointerPos); const a = vec3.normalize(vec3.create(), p); const b = vec3.normalize(vec3.create(), q);
                vec2.copy(this.previousPointerPos, midPointerPos); angleFactor *= ANGLE_AMPLIFICATION; this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
            } else { quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY); }
        } else {
            const INTENSITY = 0.1 * timeScale; quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY);
            if (this.snapTargetDirection) { const SNAPPING_INTENSITY = 0.2; const a = this.snapTargetDirection; const b = this.snapDirection; const sqrDist = vec3.squaredDistance(a, b); const distanceFactor = Math.max(0.1, 1 - sqrDist * 10); angleFactor *= SNAPPING_INTENSITY * distanceFactor; this.quatFromVectors(a, b, snapRotation, angleFactor); }
        }
        const combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation); this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation); quat.normalize(this.orientation, this.orientation);
        const RA_INTENSITY = 0.8 * timeScale; quat.slerp(this._combinedQuat, this._combinedQuat, combinedQuat, RA_INTENSITY); quat.normalize(this._combinedQuat, this._combinedQuat);
        const rad = Math.acos(this._combinedQuat[3]) * 2.0; const s = Math.sin(rad / 2.0); let rv = 0;
        if (s > 0.000001) { rv = rad / (2 * Math.PI); this.rotationAxis[0] = this._combinedQuat[0] / s; this.rotationAxis[1] = this._combinedQuat[1] / s; this.rotationAxis[2] = this._combinedQuat[2] / s; }
        const RV_INTENSITY = 0.5 * timeScale; this._rotationVelocity += (rv - this._rotationVelocity) * RV_INTENSITY; this.rotationVelocity = this._rotationVelocity / timeScale;
        this.updateCallback(deltaTime);
    }
    quatFromVectors(a: vec3, b: vec3, out: quat, angleFactor = 1) {
        const axis = vec3.cross(vec3.create(), a, b); vec3.normalize(axis, axis);
        const d = Math.max(-1, Math.min(1, vec3.dot(a, b))); const angle = Math.acos(d) * angleFactor;
        quat.setAxisAngle(out, axis, angle); return { q: out, axis, angle };
    }
    #project(pos: vec2) {
        const r = 2; const w = this.canvas.clientWidth; const h = this.canvas.clientHeight; const s = Math.max(w, h) - 1;
        const x = (2 * pos[0] - w - 1) / s; const y = (2 * pos[1] - h - 1) / s; let z = 0;
        const xySq = x * x + y * y; const rSq = r * r;
        if (xySq <= rSq / 2.0) { z = Math.sqrt(rSq - xySq); } else { z = rSq / Math.sqrt(xySq); }
        return vec3.fromValues(-x, y, z);
    }
}

// --- MAIN WEBGL CLASS ---
class InfiniteGridMenu {
    TARGET_FRAME_DURATION = 1000 / 60; 
    SPHERE_RADIUS = 2;
    #time = 0; 
    #deltaTime = 0;
     #deltaFrames = 0; 
     #frames = 0;
    camera = {
        matrix: mat4.create(), near: 0.1, far: 40, fov: Math.PI / 4, aspect: 1, position: vec3.fromValues(0, 0, 3), up: vec3.fromValues(0, 1, 0),
        matrices: { view: mat4.create(), projection: mat4.create(), inversProjection: mat4.create() }
    };
    nearestVertexIndex: number | null = null; smoothRotationVelocity = 0; scaleFactor = 1.0; movementActive = false;
    canvas: HTMLCanvasElement; items: any[]; onActiveItemChange: (index: number) => void; onMovementChange: (isMoving: boolean) => void;
    gl: WebGL2RenderingContext | null = null; viewportSize: vec2 = vec2.create(); discProgram: WebGLProgram | null = null; discLocations: any = {};
    discGeo: DiscGeometry | null = null; discBuffers: any = {}; discVAO: WebGLVertexArrayObject | null = null;
    icoGeo: IcosahedronGeometry | null = null; instancePositions: vec3[] = []; DISC_INSTANCE_COUNT = 0;
    discInstances: any = {}; worldMatrix = mat4.create(); tex: WebGLTexture | null = null; atlasSize = 1;
    control: ArcballControl | null = null; animationFrameId: number | null = null;
    visible = true;

    constructor(canvas: HTMLCanvasElement, items: any[], onActiveItemChange: (i: number) => void, onMovementChange: (b: boolean) => void) {
        this.canvas = canvas; this.items = items; this.onActiveItemChange = onActiveItemChange; this.onMovementChange = onMovementChange;
        this.#init();
    }
    
    public setVisible(isVisible: boolean) {
        this.visible = isVisible;
    }

    destroy() {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.control?.destroy();
    }

    resize() {
        if (!this.gl) return;
        vec2.set(this.viewportSize, this.canvas.clientWidth, this.canvas.clientHeight);
        if (resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement)) { this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight); }
        this.#updateProjectionMatrix(this.gl);
    }
    run(time = 0) {
        this.animationFrameId = requestAnimationFrame(t => this.run(t));
        if (!this.visible) {
            // Still clear the canvas to prevent stale frames if it becomes visible without an update
            this.gl?.clearColor(0, 0, 0, 0);
            this.gl?.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            return;
        }
        this.#deltaTime = Math.min(32, time - this.#time); this.#time = time; this.#deltaFrames = this.#deltaTime / this.TARGET_FRAME_DURATION; this.#frames += this.#deltaFrames;
        this.#animate(this.#deltaTime); this.#render();
    }
    #init() {
        this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true }); const gl = this.gl; if (!gl) throw new Error('No WebGL 2 context!');
        vec2.set(this.viewportSize, this.canvas.clientWidth, this.canvas.clientHeight);
        this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, { aModelPosition: 0, aModelNormal: 1, aModelUvs: 2, aInstanceMatrix: 3 }); if (!this.discProgram) return;
        this.discLocations = {
            aModelPosition: gl.getAttribLocation(this.discProgram, 'aModelPosition'), aModelUvs: gl.getAttribLocation(this.discProgram, 'aModelUvs'), aInstanceMatrix: gl.getAttribLocation(this.discProgram, 'aInstanceMatrix'), uWorldMatrix: gl.getUniformLocation(this.discProgram, 'uWorldMatrix'), uViewMatrix: gl.getUniformLocation(this.discProgram, 'uViewMatrix'), uProjectionMatrix: gl.getUniformLocation(this.discProgram, 'uProjectionMatrix'), uCameraPosition: gl.getUniformLocation(this.discProgram, 'uCameraPosition'), uScaleFactor: gl.getUniformLocation(this.discProgram, 'uScaleFactor'), uRotationAxisVelocity: gl.getUniformLocation(this.discProgram, 'uRotationAxisVelocity'), uTex: gl.getUniformLocation(this.discProgram, 'uTex'), uFrames: gl.getUniformLocation(this.discProgram, 'uFrames'), uItemCount: gl.getUniformLocation(this.discProgram, 'uItemCount'), uAtlasSize: gl.getUniformLocation(this.discProgram, 'uAtlasSize')
        };
        this.discGeo = new DiscGeometry(56, 1); this.discBuffers = this.discGeo.data;
        const posBuffer = makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW);
        const uvBuffer = makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW);
        if(!posBuffer || !uvBuffer) return;
        this.discVAO = makeVertexArray(gl, [[posBuffer, this.discLocations.aModelPosition, 3], [uvBuffer, this.discLocations.aModelUvs, 2]], this.discBuffers.indices);
        this.icoGeo = new IcosahedronGeometry(); this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS); this.instancePositions = this.icoGeo.vertices.map(v => v.position);
        this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length; this.#initDiscInstances(this.DISC_INSTANCE_COUNT); this.worldMatrix = mat4.create();
        this.#initTexture(); this.control = new ArcballControl(this.canvas, deltaTime => this.#onControlUpdate(deltaTime));
        this.#updateCameraMatrix(); this.#updateProjectionMatrix(gl); this.resize();
    }
    #initTexture() {
        const gl = this.gl; if (!gl) return;
        this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE); const itemCount = Math.max(1, this.items.length); this.atlasSize = Math.ceil(Math.sqrt(itemCount));
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const cellSize = 512;
        canvas.width = this.atlasSize * cellSize; canvas.height = this.atlasSize * cellSize;
        Promise.all(this.items.map(item => new Promise<HTMLImageElement>(resolve => {
            const imageURL = getSafeImageURLEx(item.public_id, item.avatar, 'large');
            const fallbackImage = generateFallbackImage(item.public_id)
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => { img.src = fallbackImage }; // Fallback
            img.src = imageURL ? imageURL : fallbackImage;
        }))).then(images => {
            images.forEach((img, i) => { const x = (i % this.atlasSize) * cellSize; const y = Math.floor(i / this.atlasSize) * cellSize; ctx?.drawImage(img, x, y, cellSize, cellSize); });
            gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); gl.generateMipmap(gl.TEXTURE_2D);
        });
    }
    #initDiscInstances(count: number) {
        const gl = this.gl; if (!gl || !this.discVAO) return;
        this.discInstances = { matricesArray: new Float32Array(count * 16), matrices: [], buffer: gl.createBuffer() };
        for (let i = 0; i < count; ++i) { const instanceMatrixArray = new Float32Array(this.discInstances.matricesArray.buffer, i * 16 * 4, 16); instanceMatrixArray.set(mat4.create()); this.discInstances.matrices.push(instanceMatrixArray); }
        gl.bindVertexArray(this.discVAO); gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer); gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);
        const mat4AttribSlotCount = 4; const bytesPerMatrix = 16 * 4;
        for (let j = 0; j < mat4AttribSlotCount; ++j) {
            const loc = this.discLocations.aInstanceMatrix + j; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, j * 4 * 4); gl.vertexAttribDivisor(loc, 1);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null); gl.bindVertexArray(null);
    }
    #animate(deltaTime: number) {
        const gl = this.gl; if (!gl || !this.control) return;
        this.control.update(deltaTime, this.TARGET_FRAME_DURATION);
        const positions = this.instancePositions.map(p => vec3.transformQuat(vec3.create(), p, this.control!.orientation));
        const scale = 0.25; const SCALE_INTENSITY = 0.6;
        positions.forEach((p, ndx) => {
            const s = (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY + (1 - SCALE_INTENSITY); const finalScale = s * scale; const matrix = mat4.create();
            mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p))); mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0]));
            mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale])); mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]));
            mat4.copy(this.discInstances.matrices[ndx], matrix);
        });
        gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray); gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.smoothRotationVelocity = this.control.rotationVelocity;
    }
    #render() {
        const gl = this.gl; if (!gl || !this.discProgram || !this.discBuffers.indices || !this.discVAO || !this.control) return;
        gl.useProgram(this.discProgram); gl.enable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix); 
        gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
        gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
        gl.uniform3f(this.discLocations.uCameraPosition, this.camera.position[0], this.camera.position[1], this.camera.position[2]);
        gl.uniform4f(this.discLocations.uRotationAxisVelocity, this.control.rotationAxis[0], this.control.rotationAxis[1], this.control.rotationAxis[2], this.smoothRotationVelocity * 1.1);
        gl.uniform1i(this.discLocations.uItemCount, this.items.length); gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);
        gl.uniform1f(this.discLocations.uFrames, this.#frames); 
        gl.uniform1f(this.discLocations.uScaleFactor, this.scaleFactor);
        gl.uniform1i(this.discLocations.uTex, 0); 
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.bindVertexArray(this.discVAO); 
        gl.drawElementsInstanced(gl.TRIANGLES, this.discBuffers.indices.length, gl.UNSIGNED_SHORT, 0, this.DISC_INSTANCE_COUNT);
       }
    #updateCameraMatrix() { mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up); mat4.invert(this.camera.matrices.view, this.camera.matrix); }
    #updateProjectionMatrix(gl: WebGL2RenderingContext) {
        // FIX: Cast gl.canvas to HTMLCanvasElement to safely access clientWidth and clientHeight properties, which are not available on OffscreenCanvas.
        const canvas = gl.canvas as HTMLCanvasElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight; const height = this.SPHERE_RADIUS * 0.35; const distance = this.camera.position[2];
        if (this.camera.aspect > 1) { this.camera.fov = 2 * Math.atan(height / distance); } else { this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance); }
        mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
        mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
    }
    #onControlUpdate(deltaTime: number) {
        if (!this.control) return;
        const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001; let damping = 15 / timeScale; let cameraTargetZ = 3;
        const isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01;
        if (isMoving !== this.movementActive) { this.movementActive = isMoving; this.onMovementChange(isMoving); }
        if (!this.control.isPointerDown) {
            const nearestVertexIndex = this.#findNearestVertexIndex(); if (nearestVertexIndex === null) return;
            const itemIndex = nearestVertexIndex % Math.max(1, this.items.length); this.onActiveItemChange(itemIndex);
            const snapDirection = vec3.normalize(vec3.create(), this.#getVertexWorldPosition(nearestVertexIndex)); this.control.snapTargetDirection = snapDirection;
        } else { cameraTargetZ += this.control.rotationVelocity * 80 + 2.5; damping = 7 / timeScale; }
        this.camera.position[2] += (cameraTargetZ - this.camera.position[2]) / damping; this.#updateCameraMatrix();
    }
    #findNearestVertexIndex() {
        if (!this.control) return null;
        const n = this.control.snapDirection; const inversOrientation = quat.conjugate(quat.create(), this.control.orientation);
        const nt = vec3.transformQuat(vec3.create(), n, inversOrientation); let maxD = -1; let nearestVertexIndex = 0;
        for (let i = 0; i < this.instancePositions.length; ++i) {
            const d = vec3.dot(nt, this.instancePositions[i]); if (d > maxD) { maxD = d; nearestVertexIndex = i; }
        }
        return nearestVertexIndex;
    }
    #getVertexWorldPosition(index: number) {
        if (!this.control) return vec3.create();
        const nearestVertexPos = this.instancePositions[index]; return vec3.transformQuat(vec3.create(), nearestVertexPos, this.control.orientation);
    }
}

// --- HOOK ---
export const useWebGLSphere = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    items: any[],
    onActiveItemChange: (index: number) => void,
    onMovementChange: (isMoving: boolean) => void
): React.RefObject<InfiniteGridMenu | null> => {
    const sketchRef = useRef<InfiniteGridMenu | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && items.length > 0) {
            const sketch = new InfiniteGridMenu(canvas, items, onActiveItemChange, onMovementChange);
            sketch.run();
            sketchRef.current = sketch;

            const handleResize = () => { sketch.resize(); };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                sketch.destroy();
                sketchRef.current = null;
            };
        }
     
    }, [canvasRef, items]);

    return sketchRef;
};
