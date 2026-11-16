import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, ShaderMaterial } from "three";

const fragmentShader = `
uniform float time;
uniform vec3 starColor;
uniform vec3 hazeColor;
uniform vec3 auroraColor;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
void main() {
  vec2 uv = vUv;
  vec2 p = uv * vec2(resolution.x / resolution.y, 1.0);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  // parallax star layers
  for (int i = 0; i < 4; i++) {
    float depth = 1.0 + float(i);
    vec2 pp = p + mouse * 0.012 * depth;
    float scale = 40.0 + float(i) * 38.0;
    vec2 grid = pp * scale;
    vec2 cell = floor(grid);
    float seed = hash(cell + float(i)*71.0);
    vec2 offset = vec2(hash(cell+8.0),hash(cell+29.0))*0.8+0.1;
    float d = length(fract(grid)-offset);
    float size = 0.02 + 0.06 * step(0.985, seed);
    float star = (1.0-smoothstep(0.0,size+0.04,d)) * step(0.8,seed);
    float flare = step(0.985,seed) * (exp(-abs(fract(grid).x-offset.x)*60.0) + exp(-abs(fract(grid).y-offset.y)*60.0)) * (1.0-smoothstep(0.0,0.5,d)) * 0.5;
    star = (star + flare) * (0.45 + 0.55 * sin(time * (0.6+seed*2.0) + seed * 80.0));
    col += mix(starColor, hazeColor, hash(cell+3.0)*0.5) * star / (depth*0.6);
    alpha += star;
  }
  // milky way band
  float band = exp(-pow((uv.y - 0.7 - sin(uv.x*2.4)*0.12)*5.0,2.0));
  float neb = fbm(p*3.0 + vec2(time*0.01,0.0));
  float haze = band * neb * 0.35;
  col += hazeColor * haze;
  alpha += haze;
  // aurora curtains
  float ax = uv.x*3.0 + time*0.05;
  float curve = 0.62 + sin(ax*1.3)*0.06 + fbm(vec2(ax, time*0.08))*0.12;
  float curtain = smoothstep(curve-0.22, curve, uv.y) * (1.0-smoothstep(curve, curve+0.03, uv.y));
  float rays = 0.5 + 0.5*fbm(vec2(uv.x*30.0, time*0.3));
  float aur = curtain * rays * (0.35 + 0.35*sin(time*0.2+uv.x*4.0));
  col += mix(auroraColor, hazeColor, uv.y) * aur;
  alpha += aur*0.8;
  // shooting stars
  for(int i=0;i<6;i++) {
    float fi = float(i);
    float period = 4.0 + fi*1.7;
    float cycle = mod(time + fi*2.3, period);
    float id = floor((time + fi*2.3)/period);
    float dur = 0.9 + hash(vec2(id,fi))*0.6;
    float run = cycle / dur;
    vec2 start = vec2(hash(vec2(id,fi+1.0))*1.2 - 0.1, 0.75 + hash(vec2(fi,id))*0.25);
    vec2 dir = normalize(vec2(0.6 + hash(vec2(id+4.0,fi))*0.4, -0.35 - hash(vec2(fi,id+9.0))*0.3));
    vec2 head = start + dir*run*0.7;
    vec2 q = (uv-head) * vec2(resolution.x/resolution.y,1.0);
    float along = dot(q,dir);
    float across = abs(q.x*dir.y-q.y*dir.x);
    float life = step(cycle,dur) * sin(clamp(run,0.0,1.0)*3.14159);
    float trail = exp(-across*900.0) * smoothstep(-0.28,0.0,along) * (1.0-smoothstep(0.0,0.004,along));
    float glow = exp(-length(q)*90.0)*1.5;
    float m = (trail + glow) * life;
    col += mix(starColor, auroraColor, 0.25) * m;
    alpha += m;
  }
  gl_FragColor = vec4(col,clamp(alpha,0.0,0.95));
}`;

function Stars({ reduced, ready }: { reduced: boolean; ready: () => void }) {
  const material = useRef<ShaderMaterial>(null);
  const sentReady = useRef(false);
  const uniforms = useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    // Canvas receives the same semantic palette as the surrounding page.
    const resolved = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = css.getPropertyValue(token);
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      // Convert modern CSS colors through a browser canvas for Three.js.
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return new Color();
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return new Color().setRGB(
        (pixel[0] ?? 255) / 255,
        (pixel[1] ?? 255) / 255,
        (pixel[2] ?? 255) / 255,
      );
    };
    return {
      time: { value: reduced ? 5 : 0.35 },
      starColor: { value: resolved("--glacier") },
      hazeColor: { value: resolved("--mist") },
      auroraColor: { value: resolved("--dusk") },
      mouse: { value: [0, 0] },
      resolution: { value: [1, 1] },
    };
  }, [reduced]);
  useFrame((state, delta) => {
    if (!material.current) return;
    if (!reduced) uniforms.time.value += Math.min(delta, 0.1);
    uniforms.resolution.value = [state.size.width, state.size.height];
    const m = uniforms.mouse.value as [number, number];
    m[0] += (state.pointer.x - m[0]) * 0.05;
    m[1] += (state.pointer.y - m[1]) * 0.05;
    if (!sentReady.current) {
      sentReady.current = true;
      ready();
    }
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }"
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function SummitSky() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { rootMargin: "150px" },
    );
    if (wrapper.current) observer.observe(wrapper.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  return (
    <div
      ref={wrapper}
      className="summit-sky"
      aria-hidden="true"
      data-scene-ready={ready || undefined}
    >
      {visible && (
        <Canvas
          eventSource={document.body}
          dpr={[1, 1.5]}
          flat
          gl={{ alpha: true, antialias: false }}
          frameloop={reduced ? "demand" : "always"}
        >
          <Stars reduced={reduced} ready={() => setReady(true)} />
        </Canvas>
      )}
    </div>
  );
}
