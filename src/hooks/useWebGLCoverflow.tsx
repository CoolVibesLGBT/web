import { useEffect, useRef } from 'react';
import { createProgram, createShader } from '../helpers/webgl';
import type { Vibe } from '../types';

const VERTEX_SHADER_SOURCE = `
    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    varying vec2 v_texcoord;
    void main() {
        gl_Position = a_position;
        v_texcoord = a_texcoord;
    }
`;

const FRAGMENT_SHADER_SOURCE = `
    precision highp float;
    varying vec2 v_texcoord;

    uniform sampler2D u_tex_from;
    uniform sampler2D u_tex_to;

    uniform vec2 u_resolution; // Canvas resolution for aspect ratio
    uniform vec2 u_res_from;   // 'From' media resolution
    uniform vec2 u_res_to;     // 'To' media resolution

    uniform float u_progress;   // 0.0 to 1.0 transition progress
    uniform float u_velocity;   // Scroll velocity for distortion intensity

    // Calculates UVs to make a texture cover a plane without distortion
    vec2 getCoverUv(vec2 uv, vec2 planeRes, vec2 mediaRes) {
        vec2 ratio = vec2(
            min((planeRes.x / planeRes.y) / (mediaRes.x / mediaRes.y), 1.0),
            min((planeRes.y / planeRes.x) / (mediaRes.y / mediaRes.x), 1.0)
        );
        return uv * ratio + (1.0 - ratio) * 0.5;
    }

    void main() {
        float distortion = clamp(abs(u_velocity) * 0.05, 0.0, 0.1);
        
        vec2 centeredUv = v_texcoord - 0.5;
        float radius = length(centeredUv);
        float distortionFactor = smoothstep(0.0, 0.5, radius);
        vec2 distortedUv = centeredUv + normalize(centeredUv) * distortion * distortionFactor * sin(radius * 10.0 - u_progress * 3.14159);
        distortedUv += 0.5;
        
        vec2 uv_from = distortedUv;
        uv_from.y -= u_progress;
        
        vec2 uv_to = distortedUv;
        uv_to.y += (1.0 - u_progress);

        vec2 cover_uv_from = getCoverUv(uv_from, u_resolution, u_res_from);
        vec2 cover_uv_to = getCoverUv(uv_to, u_resolution, u_res_to);

        // To prevent edge artifacts (thin lines) on some GPUs, especially mobile,
        // we inset the texture coordinates by half a pixel (texel).
        // This is more robust than a fixed epsilon value as it's resolution-independent.
        vec2 half_texel_from = 0.5 / u_res_from;
        vec2 half_texel_to   = 0.5 / u_res_to;

        vec2 clamped_uv_from = clamp(cover_uv_from, half_texel_from, 1.0 - half_texel_from);
        vec2 clamped_uv_to   = clamp(cover_uv_to, half_texel_to,   1.0 - half_texel_to);

        vec4 color_from = texture2D(u_tex_from, clamped_uv_from);
        vec4 color_to = texture2D(u_tex_to, clamped_uv_to);

        float fade_progress = smoothstep(0.0, 1.0, u_progress);

        gl_FragColor = mix(color_from, color_to, fade_progress);
    }
`;

interface WebGLReelsOptions {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    vibes: Vibe[];
    onActiveIndexChange: (index: number) => void;
    isMuted: boolean;
    onActiveMediaLoadingChange?: (isLoading: boolean) => void;
}

interface MediaItem {
    vibe: Vibe;
    texture: WebGLTexture;
    element: HTMLImageElement | HTMLVideoElement;
    isReady: boolean;
    isVideo: boolean;
    resolution: [number, number];
}

export function useWebGLCoverflow({ canvasRef, vibes, onActiveIndexChange, isMuted, onActiveMediaLoadingChange }: WebGLReelsOptions) {
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const animationFrameRef = useRef<number>(0);
    const mediaItemsRef = useRef<MediaItem[]>([]);
    const posRef = useRef({ current: 0, target: 0, velocity: 0 });
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const interactionRef = useRef({
        isDragging: false,
        startY: 0,
        lastY: 0,
        dragHistory: [] as { time: number, y: number }[],
        lastWheelTime: 0,
        hasInteracted: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || glRef.current) {
            return;
        }

        const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false });
        if (!gl) { console.error("WebGL not supported"); return; }
        glRef.current = gl;

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
        if (!vertexShader || !fragmentShader) return;

        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;
        programRef.current = program;

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

        const texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
        gl.enableVertexAttribArray(texcoordAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    }, [canvasRef, vibes]);

    const prevVibesLengthRef = useRef(0);

    useEffect(() => {
        const gl = glRef.current;
        if (!gl || !vibes.length) return;

        const isAppend = vibes.length > prevVibesLengthRef.current && prevVibesLengthRef.current > 0;
        prevVibesLengthRef.current = vibes.length;

        if (isAppend) {
            // Only create new media items for newly appended vibes, preserve existing ones + scroll position
            const existingCount = mediaItemsRef.current.length;
            const newVibes = vibes.slice(existingCount);
            if (newVibes.length === 0) return;

            const newMediaItems = newVibes.map((vibe) => {
                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

                const isVideo = vibe.mediaType === 'video';
                let element: HTMLImageElement | HTMLVideoElement;
                const mediaItem: MediaItem = { vibe, texture, element: null!, isReady: false, isVideo, resolution: [1, 1] };

                if (isVideo) {
                    element = document.createElement('video');
                    element.crossOrigin = 'anonymous';
                    element.muted = isMutedRef.current;
                    element.loop = true;
                    element.playsInline = true;
                    element.src = vibe.mediaUrl;

                    if (vibe.posterUrl) {
                        const poster = new Image();
                        poster.crossOrigin = 'anonymous';
                        poster.src = vibe.posterUrl;
                        poster.onload = () => {
                            if (!glRef.current) return;
                            const glCtx = glRef.current;
                            glCtx.bindTexture(glCtx.TEXTURE_2D, mediaItem.texture);
                            glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, poster);
                            mediaItem.resolution = [poster.naturalWidth, poster.naturalHeight];
                        };
                    }

                    element.addEventListener('loadeddata', () => {
                        const vid = element as HTMLVideoElement;
                        if (vid.videoWidth > 0) {
                            mediaItem.resolution = [vid.videoWidth, vid.videoHeight];
                            mediaItem.isReady = true;
                        }
                    }, { once: true });

                    (element as HTMLVideoElement).load();
                } else {
                    element = new Image();
                    element.src = vibe.mediaUrl;
                    element.crossOrigin = 'anonymous';
                    element.onload = () => {
                        if (!glRef.current) return;
                        const glCtx = glRef.current;
                        const img = element as HTMLImageElement;
                        mediaItem.resolution = [img.naturalWidth, img.naturalHeight];
                        glCtx.bindTexture(glCtx.TEXTURE_2D, mediaItem.texture);
                        glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, img);
                        mediaItem.isReady = true;
                    };
                }

                mediaItem.element = element;
                return mediaItem;
            });

            // Append only — do NOT reset scroll position
            mediaItemsRef.current = [...mediaItemsRef.current, ...newMediaItems];
            return;
        }

        // Full initial load: rebuild everything and reset scroll
        mediaItemsRef.current.forEach(item => {
            if (item.isVideo) { (item.element as HTMLVideoElement).pause(); }
        });

        mediaItemsRef.current = vibes.map(vibe => {
            const texture = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

            const isVideo = vibe.mediaType === 'video';
            let element: HTMLImageElement | HTMLVideoElement;

            const mediaItem: MediaItem = { vibe, texture, element: null!, isReady: false, isVideo, resolution: [1, 1] };

            if (isVideo) {
                element = document.createElement('video');
                element.crossOrigin = 'anonymous';
                element.muted = isMutedRef.current;
                element.loop = true;
                element.playsInline = true;
                element.src = vibe.mediaUrl;

                if (vibe.posterUrl) {
                    const poster = new Image();
                    poster.crossOrigin = 'anonymous';
                    poster.src = vibe.posterUrl;
                    poster.onload = () => {
                        if (!glRef.current) return;
                        const glCtx = glRef.current;
                        glCtx.bindTexture(glCtx.TEXTURE_2D, mediaItem.texture);
                        glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, poster);
                        mediaItem.resolution = [poster.naturalWidth, poster.naturalHeight];
                    };
                }

                element.addEventListener('loadeddata', () => {
                    const vid = element as HTMLVideoElement;
                    if (vid.videoWidth > 0) {
                        mediaItem.resolution = [vid.videoWidth, vid.videoHeight];
                        mediaItem.isReady = true;
                    }
                }, { once: true });

                (element as HTMLVideoElement).load();
            } else {
                element = new Image();
                element.src = vibe.mediaUrl;
                element.crossOrigin = 'anonymous';
                element.onload = () => {
                    if (!glRef.current) return;
                    const glCtx = glRef.current;
                    const img = element as HTMLImageElement;
                    mediaItem.resolution = [img.naturalWidth, img.naturalHeight];

                    glCtx.bindTexture(glCtx.TEXTURE_2D, mediaItem.texture);
                    glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, img);
                    mediaItem.isReady = true;
                };
            }

            mediaItem.element = element;
            return mediaItem;
        });
        posRef.current = { current: 0, target: 0, velocity: 0 };
    }, [vibes]);

    // Encapsulated function to handle the first user interaction that unlocks video playback
    const unlockPlayback = () => {
        if (interactionRef.current.hasInteracted) return;
        interactionRef.current.hasInteracted = true;

        // Attempt to play the current video to meet autoplay policies
        const activeIndex = Math.round(posRef.current.current);
        const activeItem = mediaItemsRef.current[activeIndex];
        if (activeItem && activeItem.isVideo) {
            const video = activeItem.element as HTMLVideoElement;
            if (video.paused) {
                video.play().catch(e => {
                    if (e.name !== 'AbortError') console.error("Initial video play error", e);
                });
            }
        }
    };

    useEffect(() => {
        // When the user explicitly unmutes, treat it as an interaction
        if (!isMuted) {
            unlockPlayback();
        }

        // Sync the muted state to all video elements
        mediaItemsRef.current.forEach(item => {
            if (item.isVideo) {
                (item.element as HTMLVideoElement).muted = isMuted;
            }
        });
    }, [isMuted, vibes]);

    useEffect(() => {
        const gl = glRef.current;
        const program = programRef.current;
        const canvas = canvasRef.current;
        if (!gl || !program || !canvas) return;

        const texFromLocation = gl.getUniformLocation(program, "u_tex_from");
        const texToLocation = gl.getUniformLocation(program, "u_tex_to");
        const resLocation = gl.getUniformLocation(program, "u_resolution");
        const resFromLocation = gl.getUniformLocation(program, "u_res_from");
        const resToLocation = gl.getUniformLocation(program, "u_res_to");
        const progressLocation = gl.getUniformLocation(program, "u_progress");
        const velocityLocation = gl.getUniformLocation(program, "u_velocity");

        let lastActiveIndex = -1;
        let lastTime = 0;
        let lastReportedLoading = false;

        const render = (time: number) => {
            animationFrameRef.current = requestAnimationFrame(render);
            if (lastTime === 0) lastTime = time;
            const deltaTime = (time - lastTime) * 0.001;
            lastTime = time;

            const dpr = window.devicePixelRatio || 1;
            const displayWidth = Math.round(canvas.clientWidth * dpr);
            const displayHeight = Math.round(canvas.clientHeight * dpr);
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            const pos = posRef.current;
            if (!interactionRef.current.isDragging) {
                const stiffness = 150;
                const damping = 26;
                const force = (pos.target - pos.current) * stiffness;
                const dampingForce = -pos.velocity * damping;
                const acceleration = force + dampingForce;
                pos.velocity += acceleration * deltaTime;
                pos.current += pos.velocity * deltaTime;
            }

            const activeIndex = Math.round(pos.current);
            const activeItem = mediaItemsRef.current[activeIndex];

            if (onActiveMediaLoadingChange && activeItem) {
                const isLoading = !activeItem.isReady;
                if (isLoading !== lastReportedLoading || lastActiveIndex === -1) {
                    onActiveMediaLoadingChange(isLoading);
                    lastReportedLoading = isLoading;
                }
            }

            if (activeIndex !== lastActiveIndex) {
                onActiveIndexChange(activeIndex);
                lastActiveIndex = activeIndex;
            }

            if (interactionRef.current.hasInteracted) {
                mediaItemsRef.current.forEach((item, idx) => {
                    if (item.isVideo) {
                        const video = item.element as HTMLVideoElement;
                        if (idx === activeIndex && video.paused) {
                            video.play().catch(e => {
                                if (e.name !== 'AbortError') console.error("Video play error", e);
                            });
                        } else if (idx !== activeIndex && !video.paused) {
                            video.pause();
                        }
                    }
                });
            }

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);

            const p = pos.current;
            const fromIndex = Math.max(0, Math.min(vibes.length - 1, Math.floor(p)));
            const toIndex = Math.max(0, Math.min(vibes.length - 1, Math.ceil(p)));
            const progress = p - fromIndex;

            const fromItem = mediaItemsRef.current[fromIndex];
            const toItem = mediaItemsRef.current[toIndex];
            if (!fromItem || !toItem) return;

            gl.uniform1i(texFromLocation, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fromItem.texture);
            if (fromItem.isReady && fromItem.isVideo) {
                const video = fromItem.element as HTMLVideoElement;
                if (video.currentTime > 0 && video.readyState >= video.HAVE_CURRENT_DATA) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                }
            }

            gl.uniform1i(texToLocation, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, toItem.texture);
            if (toItem.isReady && toItem.isVideo) {
                const video = toItem.element as HTMLVideoElement;
                if (video.currentTime > 0 && video.readyState >= video.HAVE_CURRENT_DATA) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
                }
            }

            gl.uniform2f(resLocation, gl.canvas.width, gl.canvas.height);
            gl.uniform2f(resFromLocation, fromItem.resolution[0], fromItem.resolution[1]);
            gl.uniform2f(resToLocation, toItem.resolution[0], toItem.resolution[1]);
            gl.uniform1f(progressLocation, progress);
            gl.uniform1f(velocityLocation, pos.velocity);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        };
        render(0);

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            mediaItemsRef.current.forEach(item => {
                if (item.isVideo) {
                    (item.element as HTMLVideoElement).pause();
                }
            });
        };
    }, [vibes, onActiveIndexChange, canvasRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handlePointerDown = (e: PointerEvent) => {
            unlockPlayback();
            interactionRef.current.isDragging = true;
            interactionRef.current.startY = e.clientY;
            interactionRef.current.lastY = e.clientY;
            interactionRef.current.dragHistory = [{ time: Date.now(), y: e.clientY }];
            posRef.current.velocity = 0;
            canvas.setPointerCapture(e.pointerId);
            canvas.style.cursor = 'grabbing';
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!interactionRef.current.isDragging) return;
            const now = Date.now();
            const deltaY = e.clientY - interactionRef.current.lastY;
            interactionRef.current.lastY = e.clientY;

            posRef.current.current -= deltaY * 0.005;

            interactionRef.current.dragHistory.push({ time: now, y: e.clientY });
            if (interactionRef.current.dragHistory.length > 5) {
                interactionRef.current.dragHistory.shift();
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!interactionRef.current.isDragging) return;
            interactionRef.current.isDragging = false;
            canvas.releasePointerCapture(e.pointerId);
            canvas.style.cursor = 'grab';

            const history = interactionRef.current.dragHistory;
            const first = history[0];
            const last = history[history.length - 1];

            if (first && last) {
                const duration = last.time - first.time;
                const distance = last.y - first.y;
                if (duration > 20 && Math.abs(distance) > 10) {
                    const flickVelocity = (distance / duration) * -0.8;
                    posRef.current.velocity = flickVelocity;
                }
            }
            const projectedTarget = posRef.current.current + posRef.current.velocity * 0.2;
            let newTarget = Math.round(projectedTarget);
            newTarget = Math.max(0, Math.min(vibes.length - 1, newTarget));
            posRef.current.target = newTarget;
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            unlockPlayback();
            const now = Date.now();
            if (now - interactionRef.current.lastWheelTime < 500) return;
            interactionRef.current.lastWheelTime = now;

            const direction = Math.sign(e.deltaY);
            let newTarget = Math.round(posRef.current.target) + direction;
            newTarget = Math.max(0, Math.min(vibes.length - 1, newTarget));
            posRef.current.target = newTarget;
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointerleave', handlePointerUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointerleave', handlePointerUp);
            canvas.removeEventListener('wheel', handleWheel);
        }
    }, [vibes, canvasRef, onActiveIndexChange]);
}