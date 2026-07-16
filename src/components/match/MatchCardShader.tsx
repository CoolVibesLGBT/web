import React, { useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import { createProgram, createShader } from '../../helpers/webgl';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;
  void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_texcoord;

  uniform sampler2D u_image;
  uniform float u_time;
  uniform vec2 u_pointer;
  uniform float u_drag;
  uniform vec2 u_resolution;
  uniform vec2 u_imageResolution;
  uniform float u_intensity;
  uniform float u_theme;
  uniform float u_renderPhoto;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec2 coverUv(vec2 uv, vec2 canvasRes, vec2 imageRes) {
    float canvasRatio = canvasRes.x / canvasRes.y;
    float imageRatio = imageRes.x / imageRes.y;
    vec2 scale = canvasRatio > imageRatio
      ? vec2(canvasRatio / imageRatio, 1.0)
      : vec2(1.0, imageRatio / canvasRatio);
    vec2 scaled = uv * scale;
    vec2 offset = (scale - 1.0) * 0.5;
    return scaled - offset;
  }

  float sdDiamond(vec2 p, float size) {
    vec2 q = abs(p);
    return (q.x + q.y) - size;
  }

  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + 0.25 < 0.0) {
      return length(vec2(p.x, p.y + 0.25)) - 0.5;
    }
    p.y -= 0.25;
    float a = p.x * p.x + p.y * p.y - 0.25;
    return a * a * a - p.x * p.x * p.y * p.y * p.y;
  }

  vec3 drawAction(vec2 local, vec2 center, float radius, vec3 baseColor, float type) {
    vec2 p = vec2((local.x - center.x), (local.y - center.y));
    p.x /= radius;
    p.y /= radius * 0.9;

    float circle = smoothstep(1.1, 0.98, length(p));
    float glow = smoothstep(1.4, 1.0, length(p));
    vec3 color = baseColor * glow * 0.4;
    color += baseColor * circle * 0.85;

    float icon = 0.0;
    if (type < 0.5) {
      float diagA = abs(p.x + p.y);
      float diagB = abs(p.x - p.y);
      icon = smoothstep(0.55, 0.2, max(diagA, diagB));
    } else if (type < 1.5) {
      float diamond = sdDiamond(p * vec2(0.9, 1.1), 0.9);
      icon = smoothstep(0.05, -0.2, diamond);
    } else {
      float heart = sdHeart(p * 0.8);
      icon = smoothstep(0.02, -0.2, heart);
    }

    color = mix(color, vec3(1.0), icon * 0.65);
    return color;
  }

  vec3 renderButtons(vec2 uv, float theme, float intensity) {
    float rowMask = smoothstep(0.45, 0.85, uv.y);
    vec3 rowColor = mix(vec3(0.08, 0.07, 0.1), vec3(0.18, 0.15, 0.12), 1.0 - theme);
    vec3 color = rowColor * rowMask * 0.35;

    vec2 local = vec2(uv.x, (uv.y - 0.72) / 0.22);
    if (local.y > -0.1 && local.y < 1.2) {
      color += drawAction(local, vec2(0.23, 0.3), 0.18, vec3(0.92, 0.35, 0.41), 0.0);
      color += drawAction(local, vec2(0.5, 0.4), 0.14, vec3(0.49, 0.72, 0.93), 1.0);
      color += drawAction(local, vec2(0.77, 0.3), 0.18, vec3(0.96, 0.42, 0.69), 2.0);
    }

    color *= intensity;
    return color;
  }

  vec3 renderSwipe(vec2 uv, float swipe) {
    vec3 overlay = vec3(0.0);
    float intent = smoothstep(0.0, 0.5, abs(swipe));
    if (swipe > 0.05) {
      float mask = smoothstep(0.2, 0.9, uv.x) * (1.0 - smoothstep(0.7, 1.0, uv.y));
      overlay += vec3(0.98, 0.35, 0.52) * mask * intent;
    } else if (swipe < -0.05) {
      float mask = smoothstep(0.8, 0.1, uv.x) * (1.0 - smoothstep(0.7, 1.0, uv.y));
      overlay += vec3(0.33, 0.75, 0.96) * mask * intent;
    }
    float ribbon = smoothstep(0.0, 0.15, uv.y) * smoothstep(0.32, 0.2, abs(uv.x - 0.5));
    overlay *= ribbon;
    return overlay * intent;
  }

  void main() {
    vec2 pointer = clamp(u_pointer, 0.0, 1.0);
    vec2 uv = v_texcoord;
    vec2 cover = coverUv(uv, u_resolution, u_imageResolution);
    cover = clamp(cover, 0.001, 0.999);

    vec2 parallax = (pointer - 0.5) * vec2(0.12, 0.08) + vec2(u_drag * 0.1, 0.0);
    vec2 warped = clamp(cover + parallax, 0.001, 0.999);
    float wave = sin((uv.y + uv.x) * 12.0 + u_time * 0.8) * 0.01;
    warped += vec2(wave, wave * 0.4);

    vec4 base = texture2D(u_image, warped);
    vec4 shifted = texture2D(u_image, clamp(warped + (pointer - 0.5) * 0.02, 0.001, 0.999));
    vec3 photoColor = mix(base.rgb, shifted.rgb, 0.3);

    float vignette = smoothstep(1.35, 0.4, length((uv - 0.5) * vec2(1.2, 1.0)));
    float film = (noise(uv * 40.0 + u_time) - 0.5) * 0.08;
    vec3 tintNight = vec3(0.08, 0.09, 0.14);
    vec3 tintDay = vec3(0.4, 0.25, 0.18);
    vec3 tint = mix(tintDay, tintNight, u_theme);

    photoColor = mix(photoColor, photoColor + tint, 0.3 * u_intensity);
    photoColor += film * 0.5;
    photoColor *= mix(1.0, vignette, 0.4 * u_intensity);

    float swipe = clamp(u_drag * 1.5, -1.0, 1.0);
    vec3 buttonGlow = renderButtons(uv, u_theme, u_intensity);
    vec3 swipeGlow = renderSwipe(uv, swipe) * u_intensity;

    vec3 color = photoColor;
    if (u_renderPhoto < 0.5) {
      color = vec3(0.0);
    }

    color += buttonGlow + swipeGlow;
    color = clamp(color, 0.0, 1.0);

    float alpha = (u_renderPhoto > 0.5)
      ? 1.0
      : clamp(u_intensity * 0.9, 0.15, 0.9);

    gl_FragColor = vec4(color, alpha);
  }
`;

interface MatchCardShaderProps {
  className?: string;
  dragValue?: MotionValue<number>;
  targetRef?: React.RefObject<HTMLElement>;
  watchKey?: string | number | null;
  imageUrl: string;
  theme: 'light' | 'dark';
  isActive?: boolean;
  renderPhoto?: boolean;
  intensity?: number;
}

const MatchCardShader: React.FC<MatchCardShaderProps> = ({
  className,
  dragValue,
  targetRef,
  watchKey,
  imageUrl,
  theme,
  isActive = true,
  renderPhoto = false,
  intensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texcoordBufferRef = useRef<WebGLBuffer | null>(null);

  const pointerRef = useRef({
    current: { x: 0.5, y: 0.5 },
    target: { x: 0.5, y: 0.5 },
  });

  const dragRef = useRef({ current: 0, target: 0 });
  const intensityRef = useRef({
    current: (isActive ? 1 : 0.35) * intensity,
    target: (isActive ? 1 : 0.35) * intensity,
  });
  const themeRef = useRef(theme === 'dark' ? 1 : 0);
  const imageResolutionRef = useRef<[number, number]>([1, 1]);
  const renderPhotoRef = useRef(renderPhoto ? 1 : 0);

  const uniformLocationsRef = useRef({
    time: null as WebGLUniformLocation | null,
    pointer: null as WebGLUniformLocation | null,
    drag: null as WebGLUniformLocation | null,
    resolution: null as WebGLUniformLocation | null,
    imageResolution: null as WebGLUniformLocation | null,
    intensity: null as WebGLUniformLocation | null,
    theme: null as WebGLUniformLocation | null,
    image: null as WebGLUniformLocation | null,
    renderPhoto: null as WebGLUniformLocation | null,
  });

  const [glReady, setGlReady] = useState(false);

  useEffect(() => {
    intensityRef.current.target = (isActive ? 1 : 0.35) * intensity;
  }, [isActive, intensity]);

  useEffect(() => {
    themeRef.current = theme === 'dark' ? 1 : 0;
  }, [theme]);

  useEffect(() => {
    renderPhotoRef.current = renderPhoto ? 1 : 0;
  }, [renderPhoto]);

  useEffect(() => {
    if (!dragValue) return;
    const unsubscribe = dragValue.on('change', (value) => {
      const normalized = Math.max(-1, Math.min(1, value / 350));
      dragRef.current.target = normalized;
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dragValue]);

  useEffect(() => {
    pointerRef.current.target = { x: 0.5, y: 0.5 };
  }, [watchKey]);

  useEffect(() => {
    if (!isActive || !targetRef?.current) {
      pointerRef.current.target = { x: 0.5, y: 0.5 };
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerRef.current.target = {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, 1 - y)),
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.target = { x: 0.5, y: 0.5 };
    };

    const element = targetRef.current;
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [targetRef, watchKey, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      return;
    }

    gl.useProgram(program);

    glRef.current = gl;
    programRef.current = program;

    const positionBuffer = gl.createBuffer();
    positionBufferRef.current = positionBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texcoordBuffer = gl.createBuffer();
    texcoordBufferRef.current = texcoordBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    textureRef.current = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 18, 25, 255]));

    uniformLocationsRef.current = {
      time: gl.getUniformLocation(program, 'u_time'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      drag: gl.getUniformLocation(program, 'u_drag'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      imageResolution: gl.getUniformLocation(program, 'u_imageResolution'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      theme: gl.getUniformLocation(program, 'u_theme'),
      image: gl.getUniformLocation(program, 'u_image'),
      renderPhoto: gl.getUniformLocation(program, 'u_renderPhoto'),
    };

    setGlReady(true);

    const render = (time: number) => {
      const canvasElement = canvasRef.current;
      const glCtx = glRef.current;
      if (!canvasElement || !glCtx) return;

      const ratio = window.devicePixelRatio || 1;
      const displayWidth = Math.max(1, Math.floor(canvasElement.clientWidth * ratio));
      const displayHeight = Math.max(1, Math.floor(canvasElement.clientHeight * ratio));

      if (canvasElement.width !== displayWidth || canvasElement.height !== displayHeight) {
        canvasElement.width = displayWidth;
        canvasElement.height = displayHeight;
      }

      glCtx.viewport(0, 0, displayWidth, displayHeight);
      glCtx.clearColor(0, 0, 0, 0);
      glCtx.clear(glCtx.COLOR_BUFFER_BIT);

      const pointer = pointerRef.current;
      pointer.current.x += (pointer.target.x - pointer.current.x) * 0.08;
      pointer.current.y += (pointer.target.y - pointer.current.y) * 0.08;

      const drag = dragRef.current;
      drag.current += (drag.target - drag.current) * 0.12;

      const intensityVals = intensityRef.current;
      intensityVals.current += (intensityVals.target - intensityVals.current) * 0.1;

      const uniforms = uniformLocationsRef.current;
      if (uniforms.time) glCtx.uniform1f(uniforms.time, time * 0.001);
      if (uniforms.pointer) glCtx.uniform2f(uniforms.pointer, pointer.current.x, pointer.current.y);
      if (uniforms.drag) glCtx.uniform1f(uniforms.drag, drag.current);
      if (uniforms.resolution) glCtx.uniform2f(uniforms.resolution, displayWidth, displayHeight);
      if (uniforms.imageResolution) glCtx.uniform2f(uniforms.imageResolution, imageResolutionRef.current[0], imageResolutionRef.current[1]);
      if (uniforms.intensity) glCtx.uniform1f(uniforms.intensity, intensityVals.current);
      if (uniforms.theme) glCtx.uniform1f(uniforms.theme, themeRef.current);
      if (uniforms.image) {
        glCtx.activeTexture(glCtx.TEXTURE0);
        glCtx.bindTexture(glCtx.TEXTURE_2D, textureRef.current);
        glCtx.uniform1i(uniforms.image, 0);
      }
      if (uniforms.renderPhoto) glCtx.uniform1f(uniforms.renderPhoto, renderPhotoRef.current);

      glCtx.drawArrays(glCtx.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (positionBufferRef.current && glRef.current) {
        glRef.current.deleteBuffer(positionBufferRef.current);
      }
      if (texcoordBufferRef.current && glRef.current) {
        glRef.current.deleteBuffer(texcoordBufferRef.current);
      }
      if (textureRef.current && glRef.current) {
        glRef.current.deleteTexture(textureRef.current);
      }
      if (programRef.current && glRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, [intensity]);

  useEffect(() => {
    if (!glReady || !imageUrl) return;
    const gl = glRef.current;
    const texture = textureRef.current;
    if (!gl || !texture) return;

    let isCancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl;
    image.onload = () => {
      if (isCancelled) return;
      if (!glRef.current || !textureRef.current) return;
      const glCtx = glRef.current;
      glCtx.bindTexture(glCtx.TEXTURE_2D, textureRef.current);
      glCtx.pixelStorei(glCtx.UNPACK_FLIP_Y_WEBGL, 1);
      glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, image);
      imageResolutionRef.current = [image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1];
    };
    image.onerror = () => {
      if (isCancelled) return;
      imageResolutionRef.current = [1, 1];
    };

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, glReady]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
};

export default MatchCardShader;
