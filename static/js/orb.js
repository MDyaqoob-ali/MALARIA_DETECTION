// 3D Simplex Noise function for WebGL Shaders
const snoise3D = `
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }
`;

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("orb-canvas-container");
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0512); // Deep space background
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- Starfield ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount * 3; i++) {
        starPositions[i] = (Math.random() - 0.5) * 20;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- Ambient Blobs (Corner Glows) ---
    const createBlob = (color, x, y, z, scale) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending 
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(scale, scale, 1);
        return sprite;
    };
    
    const blob1 = createBlob('rgba(74, 26, 92, 1)', -4, -3, -2, 6);
    const blob2 = createBlob('rgba(110, 20, 100, 1)', 4, -2, -3, 8);
    scene.add(blob1);
    scene.add(blob2);

    // --- The Orb ---
    // High-res geometry for smooth displacement
    const geometry = new THREE.IcosahedronGeometry(1.2, 32);
    
    const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            ${snoise3D}
            
            uniform float uTime;
            uniform vec2 uMouse;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vNoise;
            varying vec3 vViewPosition;
            
            void main() {
                vNormal = normal;
                
                // Base noise for organic displacement
                float noiseFreq = 1.5;
                float noiseAmp = 0.2;
                vec3 noisePos = vec3(position.x * noiseFreq + uTime * 0.2, position.y * noiseFreq + uTime * 0.3, position.z * noiseFreq);
                float noise = snoise(noisePos);
                
                // Displacement
                vec3 newPosition = position + normal * (noise * noiseAmp);
                
                vNoise = noise;
                vPosition = newPosition;
                
                vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
                vViewPosition = -mvPosition.xyz;
                
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = 3.0 * (1.0 / -mvPosition.z); // Size attenuation
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying float vNoise;
            varying vec3 vViewPosition;
            
            void main() {
                // Circular particle shape
                vec2 coord = gl_PointCoord - vec2(0.5);
                if (length(coord) > 0.5) discard;
                
                // Map noise (-1 to 1) to (0 to 1)
                float n = vNoise * 0.5 + 0.5;
                
                // Gradient colors: Purple to Magenta to bright white/pink
                vec3 colorDark = vec3(0.08, 0.03, 0.15); // Dark deep purple
                vec3 colorMid = vec3(0.48, 0.13, 0.61);  // Magenta/Purple
                vec3 colorLight = vec3(0.96, 0.67, 1.0); // Bright pink/white
                
                vec3 baseColor = mix(colorDark, colorMid, smoothstep(0.0, 0.5, n));
                baseColor = mix(baseColor, colorLight, smoothstep(0.5, 1.0, n));
                
                // Rim lighting / Fresnel effect
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                rim = smoothstep(0.6, 1.0, rim);
                
                // Add intense glow on the edges
                vec3 finalColor = baseColor + vec3(0.8, 0.2, 0.9) * rim * 1.5;
                
                gl_FragColor = vec4(finalColor, 0.8 + rim * 0.2);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const orb = new THREE.Points(geometry, orbMaterial);
    scene.add(orb);

    // --- Interaction ---
    let targetMouse = new THREE.Vector2(0, 0);
    let currentMouse = new THREE.Vector2(0, 0);

    const onMouseMove = (event) => {
        // Normalize mouse coordinates from -1 to 1
        targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        orbMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        
        // Update uniforms
        orbMaterial.uniforms.uTime.value = time;
        
        // Smoothly interpolate mouse position
        currentMouse.lerp(targetMouse, delta * 2.0);
        orbMaterial.uniforms.uMouse.value.copy(currentMouse);
        
        // Parallax effect: tilt the orb based on mouse
        orb.rotation.x = currentMouse.y * 0.3;
        orb.rotation.y = currentMouse.x * 0.3 + time * 0.05; // Base rotation + mouse tilt
        
        // Starfield gentle rotation
        stars.rotation.y = time * 0.02;
        
        renderer.render(scene, camera);
    };
    
    animate();
});
