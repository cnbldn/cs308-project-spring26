import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Bounds } from '@react-three/drei';
import * as THREE from 'three';

useGLTF.preload('/cd-disk.glb');

const SpinningDisk: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/cd-disk.glb');

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} />
    </group>
  );
};

const CDDisk3D: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 35 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} color="#ffd700" />
      <Suspense fallback={null}>
        <Float
          speed={2}
          rotationIntensity={0.2}
          floatIntensity={1.2}
          floatingRange={[-0.08, 0.08]}
        >
          <Bounds fit clip observe margin={1.1}>
            <SpinningDisk />
          </Bounds>
        </Float>
      </Suspense>
    </Canvas>
  );
};

export default CDDisk3D;
