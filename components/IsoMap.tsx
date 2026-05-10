/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Lock, DollarSign } from 'lucide-react';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData, BuildingStatus } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Constants & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

// Deterministic random based on coordinates
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 12, 12);
const capsuleGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);

// Custom Car Geometry
const createCarGeo = () => {
  const body = new THREE.BoxGeometry(1, 0.4, 0.5);
  const top = new THREE.BoxGeometry(0.5, 0.3, 0.4);
  top.translate(-0.1, 0.35, 0); 
  
  // Windows (slight protrusions)
  const windows = new THREE.BoxGeometry(0.52, 0.25, 0.42);
  windows.translate(-0.1, 0.35, 0);

  return BufferGeometryUtils.mergeGeometries([body, top]);
};
const carGeo = createCarGeo();

// Custom Person Geometry
const createPersonGeo = () => {
    const body = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    const head = new THREE.SphereGeometry(0.25, 8, 8);
    head.translate(0, 0.6, 0);
    return BufferGeometryUtils.mergeGeometries([body, head]);
};
const personGeo = createPersonGeo();

// --- 1. Advanced Procedural Buildings ---

// FIX: Wrap component in React.memo to ensure TypeScript recognizes it as a component that accepts a 'key' prop.
const WindowBlock = React.memo(({ position, scale, color = "#bfdbfe" }: { position: [number, number, number], scale: [number, number, number], color?: string }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} roughness={0.05} metalness={0.9} />
  </mesh>
));

const RooftopAC = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh geometry={boxGeo} scale={[0.15, 0.1, 0.15]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh geometry={cylinderGeo} scale={[0.08, 0.02, 0.08]} position={[0, 0.11, 0]}>
        <meshStandardMaterial color="#475569" />
    </mesh>
  </group>
);

const SmokeStack = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.01 + i * 0.005;
        cloud.scale.addScalar(0.005);
        
        const material = cloud.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity -= 0.003;
          if (cloud.position.y > 1.8) {
            cloud.position.y = 0;
            cloud.scale.setScalar(0.1 + Math.random() * 0.1);
            material.opacity = 0.5;
          }
        }
      });
    }
  });

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.6, 0]} scale={[0.18, 1.2, 0.18]}>
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      <mesh geometry={cylinderGeo} position={[0, 1.15, 0]} scale={[0.22, 0.1, 0.22]}>
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <group ref={ref} position={[0, 1.2, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[Math.random()*0.1, i*0.4, Math.random()*0.1]} scale={0.2}>
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.5} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const FireAnimation = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const flame = child as THREE.Mesh;
        flame.position.y += 0.03 + i * 0.01;
        flame.scale.setScalar(Math.max(0.01, flame.scale.x - 0.015));
        
        if (flame.position.y > 1.2 || flame.scale.x < 0.05) {
          flame.position.y = 0;
          flame.scale.setScalar(0.3 + Math.random() * 0.3);
          flame.position.x = (Math.random() - 0.5) * 0.4;
          flame.position.z = (Math.random() - 0.5) * 0.4;
        }
      });
    }
  });

  return (
    <group position={position}>
      <group ref={ref}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[0, 0, 0]} scale={0.4}>
            <meshBasicMaterial color={i % 2 === 0 ? "#ef4444" : "#f97316"} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.5, 0]} intensity={3} distance={4} color="#ef4444" />
    </group>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  status?: BuildingStatus;
}

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, status = BuildingStatus.Normal }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100);
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  const color = useMemo(() => {
    const c = new THREE.Color(baseColor);
    c.offsetHSL(hash * 0.05 - 0.025, 0, hash * 0.1 - 0.05);
    return c;
  }, [baseColor, hash]);

  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({ color, flatShading: false, opacity, transparent, roughness: 0.7, metalness: 0.1 }), [color, opacity, transparent]);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.2), opacity, transparent, roughness: 0.5 }), [color, opacity, transparent]);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#000000'), 0.4), opacity, transparent, roughness: 0.9 }), [color, opacity, transparent]);

  const commonProps = { castShadow: true, receiveShadow: true };
  const yOffset = -0.3;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {status === BuildingStatus.Fire && <FireAnimation position={[0, 0, 0]} />}
      
      {status === BuildingStatus.Robbed && (
        <Html position={[0, 2, 0]} center>
          <div className="flex flex-col items-center gap-1 group/item">
             <div className="bg-red-600 text-white p-2 rounded-full animate-bounce shadow-2xl border-4 border-white pointer-events-auto cursor-pointer">
                <DollarSign className="w-8 h-8" />
             </div>
             <span className="bg-black/80 text-white font-black px-2 py-0.5 rounded text-[8px] uppercase tracking-widest whitespace-nowrap">Perampokan / Suntik Modal</span>
          </div>
        </Html>
      )}

      {status === BuildingStatus.TheftCooldown && (
        <Html position={[0, 2, 0]} center>
           <div className="bg-amber-500 text-white p-2 rounded-full animate-pulse shadow-2xl border-4 border-white">
              <Lock className="w-6 h-6" />
           </div>
        </Html>
      )}

      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (variant < 50) {
              // Traditional House with pitched roof
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.85, 0.7, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.85, 0]} scale={[0.8, 0.5, 0.85]} rotation={[0, Math.PI/4, 0]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.4]} scale={[0.2, 0.25, 0.1]} />
                  <WindowBlock position={[0.25, 0.4, 0.41]} scale={[0.15, 0.25, 0.02]} />
                  <WindowBlock position={[-0.25, 0.4, 0.41]} scale={[0.15, 0.25, 0.02]} />
                </>
              );
            } else {
              // Modern Flat / Low-rise (Not a Skyscraper)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.35, 0.4, 0]} scale={[0.1, 0.6, 0.5]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 0.81, 0]} scale={[0.95, 0.02, 0.85]} />
                  <WindowBlock position={[0, 0.5, 0.41]} scale={[0.6, 0.3, 0.02]} />
                  <RooftopAC position={[0, 0.85, 0]} />
                  <mesh geometry={personGeo} position={[0.3, 0.1, 0.45]} scale={0.12}><meshStandardMaterial color="#3b82f6" /></mesh>
                </>
              );
            }

          case BuildingType.Commercial:
            return (
              <group>
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.45, 0]} scale={[0.9, 0.9, 0.8]} />
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0]} scale={[1, 0.2, 0.9]} />
                <WindowBlock position={[0, 0.45, 0.41]} scale={[0.7, 0.5, 0.02]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[0, 0.95, -0.2]} scale={[0.6, 0.15, 0.3]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: variant < 50 ? '#2563eb' : '#ef4444'})} geometry={boxGeo} position={[0, 1.05, 0.3]} scale={[0.4, 0.3, 0.05]} />
                <RooftopAC position={[-0.2, 1, -0.2]} />
              </group>
            );

          case BuildingType.Industrial:
            return (
              <group>
                 {/* Factory Base */}
                 <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.95, 0.6, 0.95]} />
                 {/* Corrugated Roof sections */}
                 <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.25, 0.65, 0]} scale={[0.35, 0.1, 0.9]} />
                 <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.25, 0.65, 0]} scale={[0.35, 0.1, 0.9]} />
                 {/* Industrial Silo */}
                 <group position={[0.3, 0, -0.3]}>
                    <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.5, 0]} scale={[0.25, 1, 0.25]} />
                    <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[0, 1, 0]} scale={[0.25, 0.1, 0.25]} />
                 </group>
                 <SmokeStack position={[-0.3, 0.3, 0.3]} />
              </group>
            );

          case BuildingType.Mosque:
            return (
              <group>
                {/* Refined Main Structure */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]} />
                {/* Geometric Cutouts / Arches */}
                {Array.from({length: 4}).map((_, i) => (
                    <mesh key={i} {...commonProps} material={accentMat} geometry={cylinderGeo} 
                        position={[
                            i === 0 ? 0.46 : i === 1 ? -0.46 : 0,
                            0.3,
                            i === 2 ? 0.46 : i === 3 ? -0.46 : 0
                        ]} 
                        scale={[0.15, 0.4, 0.02]} 
                        rotation={[Math.PI/2, i < 2 ? 0 : Math.PI/2, 0]} 
                    />
                ))}
                {/* Grand Dome */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.1 })} 
                    geometry={sphereGeo} position={[0, 0.85, 0]} scale={[0.42, 0.35, 0.42]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#fbbf24' })} 
                    geometry={coneGeo} position={[0, 1.25, 0]} scale={[0.05, 0.15, 0.05]} />
                
                {/* Minaret x4 Corners */}
                {[[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]].map((pos, i) => (
                    <group key={i} position={[pos[0], 0, pos[1]]}>
                        <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0.7, 0]} scale={[0.08, 1.4, 0.08]} />
                        <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#fbbf24' })} 
                            geometry={coneGeo} position={[0, 1.45, 0]} scale={[0.12, 0.2, 0.12]} />
                    </group>
                ))}
              </group>
            );

          case BuildingType.BigHouse:
            return (
              <group position={[0.5, 0, 0]}>
                {/* Modern White Villa Structure */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[-0.4, 0.4, 0]} scale={[0.8, 0.8, 0.7]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[0.3, 0.5, -0.1]} scale={[0.6, 1.0, 0.5]} />
                
                {/* Large Glass Balconies */}
                <WindowBlock position={[-0.4, 0.45, 0.36]} scale={[0.6, 0.5, 0.02]} color="#93c5fd" />
                <WindowBlock position={[0.3, 0.55, 0.16]} scale={[0.4, 0.6, 0.02]} color="#93c5fd" />
                
                {/* Wood Accent Wall */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#78350f'})} geometry={boxGeo} position={[0.6, 0.4, 0]} scale={[0.05, 0.8, 0.4]} />
                
                {/* Swimming Pool Terrace */}
                <group position={[-0.2, 0.05, -0.3]}>
                    <mesh geometry={boxGeo} scale={[1.2, 0.1, 0.35]}>
                        <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.05} />
                    </mesh>
                    <mesh position={[0, 0.06, 0]} geometry={boxGeo} scale={[1.1, 0.01, 0.25]}>
                        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.2} transparent opacity={0.7} />
                    </mesh>
                </group>
                
                {/* Rooftop Garden */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#15803d'})} geometry={boxGeo} position={[-0.4, 0.81, 0]} scale={[0.7, 0.02, 0.6]} />
              </group>
            );

          case BuildingType.Hospital:
            return (
              <group position={[0.5, 0, 0.5]}>
                {/* Large White Block */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#ffffff'})} geometry={boxGeo} position={[0, 0.5, 0]} scale={[1.8, 1.0, 1.8]} />
                {/* Central Tower */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[0, 1.2, 0]} scale={[1.0, 0.6, 1.0]} />
                
                {/* Helipad */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#475569'})} geometry={cylinderGeo} position={[0, 1.5, 0]} scale={[0.6, 0.05, 0.6]} />
                <mesh position={[0, 1.53, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[0.4, 0.4]} />
                    <meshBasicMaterial color="white" transparent opacity={0.8} />
                </mesh>

                {/* Red Cross Sign */}
                <group position={[0, 0.8, 0.91]}>
                    <mesh geometry={boxGeo} scale={[0.1, 0.4, 0.05]}><meshBasicMaterial color="#ef4444" /></mesh>
                    <mesh geometry={boxGeo} scale={[0.4, 0.1, 0.05]}><meshBasicMaterial color="#ef4444" /></mesh>
                </group>

                {/* Windows x Many */}
                {[-0.6, 0.6].map(xOff => (
                    [0.3, 0.7].map(yOff => (
                        <WindowBlock key={`${xOff}-${yOff}`} position={[xOff, yOff, 0.91]} scale={[0.3, 0.2, 0.02]} color="#bae6fd" />
                    ))
                ))}
              </group>
            );

          case BuildingType.Skyscraper:
            const skyHeight = 4 + hash * 2;
            return (
              <group>
                {/* Tapered multi-stage design */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, skyHeight * 0.4, 0]} scale={[0.8, skyHeight * 0.8, 0.8]} />
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, skyHeight * 0.8, 0]} scale={[0.5, skyHeight * 0.4, 0.5]} />
                
                {/* Glowing Blue Core / Windows */}
                {Array.from({length: Math.floor(skyHeight * 5)}).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.4 + i * 0.3, 0]} scale={[0.82, 0.1, 0.82]} color="#0ea5e9" />
                ))}
                
                {/* Antenna */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} geometry={cylinderGeo} position={[0, skyHeight, 0]} scale={[0.02, 1.5, 0.02]} />
                <mesh position={[0, skyHeight + 0.7, 0]} geometry={sphereGeo} scale={0.05}><meshBasicMaterial color="#ef4444" /></mesh>
              </group>
            );

          case BuildingType.PowerPlant:
            return (
              <group position={[0.5, 0, 0.5]}>
                {/* Concrete Industrial Base */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#64748b'})} geometry={boxGeo} position={[0, 0.2, 0]} scale={[1.8, 0.4, 1.8]} />
                
                {/* Cooling Towers x2 */}
                {[-0.4, 0.4].map((offset, i) => (
                    <group key={i} position={[offset, 0.4, -0.4]}>
                        <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} geometry={cylinderGeo} scale={[0.4, 0.8, 0.4]} />
                        <mesh material={new THREE.MeshStandardMaterial({color: '#475569'})} geometry={cylinderGeo} position={[0, 0.41, 0]} scale={[0.45, 0.05, 0.45]} />
                        <SmokeStack position={[0, 0.5, 0]} />
                    </group>
                ))}

                {/* Energy Cluster / Reactors */}
                <group position={[0, 0.4, 0.4]}>
                    <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#334155'})} geometry={boxGeo} scale={[1.2, 0.6, 0.6]} />
                    <mesh position={[0, 0.1, 0.32]} geometry={sphereGeo} scale={0.2}>
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
                    </mesh>
                </group>
              </group>
            );

          case BuildingType.Kost:
            return (
              <group>
                {/* Narrow 3-story building */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.7, 1.4, 0.8]} />
                <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.4, 0]} scale={[0.75, 0.05, 0.85]} />
                
                {/* Citizens (Penduduk) around the house */}
                <group position={[0, 0, 0]}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <mesh key={i} geometry={personGeo} position={[0.4 - i*0.2, 0.2, 0.45]} scale={0.15}>
                      <meshStandardMaterial color={clothesColors[i % clothesColors.length]} />
                    </mesh>
                  ))}
                </group>

                {/* Balconies */}
                {[0.4, 0.9].map(yPos => (
                  <group key={yPos} position={[0, yPos, 0.35]}>
                    <mesh {...commonProps} material={accentMat} geometry={boxGeo} scale={[0.5, 0.1, 0.2]} />
                    {/* Hanging "Laundry" */}
                    <mesh position={[0.1, -0.1, 0]} geometry={boxGeo} scale={[0.1, 0.15, 0.02]} material={new THREE.MeshStandardMaterial({color: '#ef4444'})} />
                    <mesh position={[-0.1, -0.1, 0]} geometry={boxGeo} scale={[0.1, 0.15, 0.02]} material={new THREE.MeshStandardMaterial({color: '#3b82f6'})} />
                  </group>
                ))}
                <WindowBlock position={[0.2, 0.4, 0.41]} scale={[0.15, 0.2, 0.02]} />
                <WindowBlock position={[-0.2, 0.4, 0.41]} scale={[0.15, 0.2, 0.02]} />
                <WindowBlock position={[0.2, 0.9, 0.41]} scale={[0.15, 0.2, 0.02]} />
                <WindowBlock position={[-0.2, 0.9, 0.41]} scale={[0.15, 0.2, 0.02]} />
              </group>
            );

          case BuildingType.Sekolah:
            return (
              <group>
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.85, 0.8, 0.85]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#3b82f6'})} geometry={boxGeo} position={[0, 0.85, 0]} scale={[0.9, 0.1, 0.9]} />
                {/* Clock on facade */}
                <mesh geometry={cylinderGeo} rotation={[Math.PI/2, 0, 0]} position={[0, 0.5, 0.43]} scale={[0.15, 0.02, 0.15]}>
                   <meshStandardMaterial color="#ffffff" />
                </mesh>
                {/* Entrance Stairs */}
                <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.05, 0.4]} scale={[0.4, 0.1, 0.2]} />
              </group>
            );

          case BuildingType.Universitas:
            return (
              <group position={[0.5, 0, 0.5]}>
                {/* Classical academic architecture */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f1f5f9'})} geometry={boxGeo} position={[0, 0.5, 0]} scale={[1.8, 1.0, 1.6]} />
                {/* Dome / Library section */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#6366f1'})} geometry={sphereGeo} position={[0, 1, 0]} scale={[0.6, 0.4, 0.6]} />
                {/* Pillars */}
                {[-0.7, -0.25, 0.25, 0.7].map((x, i) => (
                  <mesh key={i} {...commonProps} material={new THREE.MeshStandardMaterial({color: '#ffffff'})} geometry={cylinderGeo} position={[x, 0.5, 0.81]} scale={[0.1, 1.0, 0.1]} />
                ))}
                {/* Pediment (Triangle top) */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f1f5f9'})} geometry={coneGeo} position={[0, 1.2, 0.81]} scale={[1, 0.4, 0.1]} rotation={[0, Math.PI/4, 0]} />
              </group>
            );

          case BuildingType.Laundry:
            return (
              <group>
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.8, 0.7, 0.7]} />
                {/* Large Window for Laundry */}
                <WindowBlock position={[0, 0.35, 0.36]} scale={[0.6, 0.4, 0.02]} color="#bae6fd" />
                {/* Signboard */}
                <mesh position={[0, 0.8, 0.2]} geometry={boxGeo} scale={[0.7, 0.2, 0.05]} material={new THREE.MeshStandardMaterial({color: '#38bdf8'})} />
                <mesh position={[0, 0.8, 0.23]} geometry={boxGeo} scale={[0.5, 0.1, 0.01]} material={new THREE.MeshStandardMaterial({color: '#ffffff'})} />
                <RooftopAC position={[0.2, 0.7, -0.1]} />
              </group>
            );

          case BuildingType.Apotek:
            return (
              <group>
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.7, 0.8, 0.7]} />
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={boxGeo} position={[0, 0.85, 0]} scale={[0.75, 0.1, 0.75]} />
                {/* Medical Cross Sign */}
                <group position={[0, 0.5, 0.36]}>
                    <mesh geometry={boxGeo} scale={[0.08, 0.3, 0.02]} material={new THREE.MeshStandardMaterial({color: '#22c55e'})} />
                    <mesh geometry={boxGeo} scale={[0.3, 0.08, 0.02]} material={new THREE.MeshStandardMaterial({color: '#22c55e'})} />
                </group>
                <WindowBlock position={[0, 0.25, 0.36]} scale={[0.5, 0.3, 0.02]} color="#f1f5f9" />
              </group>
            );

          case BuildingType.Bengkel:
            return (
              <group>
                {/* Open Garage Concept */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#475569'})} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]} />
                {/* Service Canopy */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#1e293b'})} geometry={boxGeo} position={[0, 0.65, 0.1]} scale={[1, 0.05, 1.1]} />
                {/* Piles of Tires (cylinders) */}
                <group position={[-0.3, 0.1, 0.35]}>
                   <mesh geometry={cylinderGeo} scale={[0.15, 0.08, 0.15]} rotation={[Math.PI/2, 0, 0]} material={new THREE.MeshStandardMaterial({color: '#000000'})} />
                   <mesh position={[0, 0.15, 0]} geometry={cylinderGeo} scale={[0.15, 0.08, 0.15]} rotation={[Math.PI/2, 0, 0]} material={new THREE.MeshStandardMaterial({color: '#000000'})} />
                </group>
                {/* Toolbench area */}
                <mesh position={[0.2, 0.15, -0.2]} geometry={boxGeo} scale={[0.3, 0.3, 0.2]} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} />
              </group>
            );

          case BuildingType.WarungMakan:
            return (
              <group>
                {/* Traditional Warung structure with canopy */}
                <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#b45309'})} geometry={boxGeo} position={[0, 0.25, 0]} scale={[0.8, 0.5, 0.7]} />
                {/* Open front counter */}
                <mesh position={[0, 0.2, 0.3]} geometry={boxGeo} scale={[0.7, 0.1, 0.2]} material={new THREE.MeshStandardMaterial({color: '#d97706'})} />
                {/* Blue/Yellow Plastic Canopy */}
                <mesh position={[0, 0.55, 0.15]} rotation={[0.2, 0, 0]} geometry={boxGeo} scale={[0.9, 0.02, 0.8]} material={new THREE.MeshStandardMaterial({color: '#facc15'})} />
                {/* Small stools (cylinders) */}
                {[ -0.25, 0, 0.25 ].map((xPos, i) => (
                  <mesh key={i} position={[xPos, 0.05, 0.4]} geometry={cylinderGeo} scale={[0.1, 0.1, 0.1]} material={new THREE.MeshStandardMaterial({color: '#1e293b'})} />
                ))}
                {/* Signboard */}
                <mesh position={[0, 0.65, 0.4]} geometry={boxGeo} scale={[0.5, 0.15, 0.01]} material={new THREE.MeshStandardMaterial({color: '#ffffff'})} />
                <mesh position={[0, 0.65, 0.41]} geometry={boxGeo} scale={[0.4, 0.1, 0.005]} material={new THREE.MeshStandardMaterial({color: '#16a34a'})} />
              </group>
            );

          case BuildingType.Park:
            const treeCount = 2 + Math.floor(hash * 4);
            return (
              <group position={[0, -yOffset - 0.295, 0]}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.95, 0.95]} />
                    <meshStandardMaterial color="#bbf7d0" />
                </mesh>
                
                {/* Small pond */}
                {variant < 40 && (
                    <mesh position={[0.2, 0.02, -0.2]} rotation={[-Math.PI/2, 0, 0]}>
                        <circleGeometry args={[0.25, 12]} />
                        <meshStandardMaterial color="#60a5fa" metalness={0.6} roughness={0.1} />
                    </mesh>
                )}

                {/* Trees */}
                {Array.from({length: treeCount}).map((_, i) => {
                    const angle = (i / treeCount) * Math.PI * 2 + hash;
                    const r = 0.25 + hash * 0.15;
                    const pos = [Math.cos(angle)*r, Math.sin(angle)*r];
                    const scale = 0.4 + getHash(x+i, y) * 0.4;
                    const isRound = getHash(x, y+i) > 0.5;
                    return (
                        <group key={i} position={[pos[0], 0, pos[1]]} scale={scale}>
                            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: '#422006' })} geometry={cylinderGeo} position={[0, 0.1, 0]} scale={[0.08, 0.2, 0.08]} />
                            <mesh castShadow material={new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#166534' : '#15803d' })} 
                                geometry={isRound ? sphereGeo : coneGeo} 
                                position={[0, 0.4, 0]} 
                                scale={isRound ? [0.3, 0.35, 0.3] : [0.35, 0.5, 0.35]} 
                            />
                        </group>
                    )
                })}
              </group>
            );
          case BuildingType.Road:
             return null;
          default:
            return null;
        }
      })()}
    </group>
  );
});

// --- 2. Dynamic Systems (Traffic, Citizens, Environment) ---

const carColors = ['#ef4444', '#3b82f6', '#eab308', '#ffffff', '#1f2937', '#f97316'];

const TrafficSystem = ({ grid }: { grid: Grid }) => {
  const roadTiles = useMemo(() => {
    const roads: {x: number, y: number}[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) roads.push({x: tile.x, y: tile.y});
    }));
    return roads;
  }, [grid]);

  const carCount = Math.min(roadTiles.length, 30);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(0), []);

  useEffect(() => {
    if (roadTiles.length < 2) return;
    carsState.current = new Float32Array(carCount * 6);
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[i*6 + 0] = startNode.x;
      carsState.current[i*6 + 1] = startNode.y;
      carsState.current[i*6 + 2] = startNode.x;
      carsState.current[i*6 + 3] = startNode.y;
      carsState.current[i*6 + 4] = 1; // force pick new target
      carsState.current[i*6 + 5] = getRandomRange(0.01, 0.03); // speed

      const color = new THREE.Color(carColors[Math.floor(Math.random() * carColors.length)]);
      newColors[i*3] = color.r; newColors[i*3+1] = color.g; newColors[i*3+2] = color.b;
    }

    if (carsRef.current) {
        carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
  }, [roadTiles, carCount]);

  useFrame(() => {
    if (!carsRef.current || roadTiles.length < 2 || carsState.current.length === 0) return;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 6;
      let curX = carsState.current[idx];
      let curY = carsState.current[idx+1];
      let tarX = carsState.current[idx+2];
      let tarY = carsState.current[idx+3];
      let progress = carsState.current[idx+4];
      const speed = carsState.current[idx+5];

      progress += speed;

      if (progress >= 1) {
        curX = tarX;
        curY = tarY;
        progress = 0;
        
        const neighbors = roadTiles.filter(t => 
          (Math.abs(t.x - curX) === 1 && t.y === curY) || 
          (Math.abs(t.y - curY) === 1 && t.x === curX)
        );

        if (neighbors.length > 0) {
            // Simple pathfinding: avoid going back immediately
            const valid = neighbors.length > 1 
                ? neighbors.filter(n => Math.abs(n.x - carsState.current[idx]) > 0.1 || Math.abs(n.y - carsState.current[idx+1]) > 0.1)
                : neighbors;
            
            const next = valid.length > 0 
                ? valid[Math.floor(Math.random() * valid.length)]
                : neighbors[0];
            
            tarX = next.x;
            tarY = next.y;
        } else {
            const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
            curX = rnd.x; curY = rnd.y; tarX = rnd.x; tarY = rnd.y;
        }
      }

      carsState.current[idx] = curX;
      carsState.current[idx+1] = curY;
      carsState.current[idx+2] = tarX;
      carsState.current[idx+3] = tarY;
      carsState.current[idx+4] = progress;

      // Interpolate position
      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);

      // Determine driving side offset
      const dx = tarX - curX;
      const dy = tarY - curY;
      const angle = Math.atan2(dy, dx);
      
      // Offset to right side relative to movement
      const offsetAmt = 0.15;
      // Normals: (-dy, dx)
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const offX = (-dy/len) * offsetAmt;
      const offY = (dx/len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Road surface is approx -0.3. Car height 0.4 * scale.
      dummy.position.set(wx, -0.27, wz);
      dummy.rotation.set(0, -angle, 0);
      // Car dimensions (approx 0.5 length, 0.2 height, 0.3 width)
      dummy.scale.set(0.4, 0.4, 0.4); 
      
      dummy.updateMatrix();
      carsRef.current.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
  });

  if (roadTiles.length < 2) return null;

  return (
    <instancedMesh ref={carsRef} args={[carGeo, undefined, carCount]} castShadow>
      <meshStandardMaterial roughness={0.5} metalness={0.3} />
    </instancedMesh>
  );
};

const clothesColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];

const PopulationSystem = ({ population, grid }: { population: number, grid: Grid }) => {
    const agentCount = Math.min(Math.floor(population / 2), 300); 
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Find tiles where people can walk (Roads, Parks, empty ground)
    const walkableTiles = useMemo(() => {
        const tiles: {x: number, y: number}[] = [];
        grid.forEach(row => row.forEach(tile => {
          if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.None) {
            tiles.push({x: tile.x, y: tile.y});
          }
        }));
        return tiles;
    }, [grid]);
    
    const agentsState = useRef<Float32Array>(new Float32Array(0));
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    useEffect(() => {
        if (agentCount === 0 || walkableTiles.length === 0) return;
        agentsState.current = new Float32Array(agentCount * 6);
        const newColors = new Float32Array(agentCount * 3);

        for(let i=0; i<agentCount; i++) {
            const t = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            // Spawn with random offset in tile
            const x = t.x + getRandomRange(-0.4, 0.4);
            const y = t.y + getRandomRange(-0.4, 0.4);

            agentsState.current[i*6+0] = x;
            agentsState.current[i*6+1] = y;
            
            // Initial target
            const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            agentsState.current[i*6+2] = tt.x + getRandomRange(-0.4, 0.4);
            agentsState.current[i*6+3] = tt.y + getRandomRange(-0.4, 0.4);
            
            agentsState.current[i*6+4] = getRandomRange(0.005, 0.015); // speed
            agentsState.current[i*6+5] = Math.random() * Math.PI * 2; // anim

            const c = new THREE.Color(clothesColors[Math.floor(Math.random() * clothesColors.length)]);
            newColors[i*3] = c.r; newColors[i*3+1] = c.g; newColors[i*3+2] = c.b;
        }

        if (meshRef.current) {
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
        }
    }, [agentCount, walkableTiles]);

    useFrame((state) => {
        if (!meshRef.current || agentCount === 0 || agentsState.current.length === 0) return;
        const time = state.clock.elapsedTime;

        for(let i=0; i<agentCount; i++) {
            const idx = i*6;
            let x = agentsState.current[idx];
            let y = agentsState.current[idx+1];
            let tx = agentsState.current[idx+2];
            let ty = agentsState.current[idx+3];
            const speed = agentsState.current[idx+4];
            const animOffset = agentsState.current[idx+5];

            const dx = tx - x;
            const dy = ty - y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 0.1) {
                // Pick new random target from walkable
                if (walkableTiles.length > 0) {
                    const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
                    tx = tt.x + getRandomRange(-0.4, 0.4);
                    ty = tt.y + getRandomRange(-0.4, 0.4);
                    agentsState.current[idx+2] = tx;
                    agentsState.current[idx+3] = ty;
                }
            } else {
                x += (dx/dist) * speed;
                y += (dy/dist) * speed;
                agentsState.current[idx] = x;
                agentsState.current[idx+1] = y;
            }

            const [wx, _, wz] = gridToWorld(x, y);

            // Walking bounce
            const bounce = Math.abs(Math.sin(time * 12 + animOffset)) * 0.04;

            // Person dimensions
            const scale = 0.2;
            const groundY = -0.3; 

            dummy.position.set(wx, groundY + bounce, wz);
            dummy.rotation.set(0, -Math.atan2(dy, dx) + Math.PI/2, 0); // Rotate to face direction
            dummy.scale.set(scale, scale, scale);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (agentCount === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[personGeo, undefined, agentCount]} castShadow>
            <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
    )
};

// Clouds & Birds
const Cloud = ({ position, scale, speed }: { position: [number, number, number], scale: number, speed: number }) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (group.current) {
            group.current.position.x += speed * delta;
            if (group.current.position.x > GRID_SIZE * 1.5) group.current.position.x = -GRID_SIZE * 1.5;
        }
    });

    const bubbles = useMemo(() => Array.from({length: 5 + Math.random() * 5}).map(() => ({
        pos: [getRandomRange(-1,1), getRandomRange(-0.5, 0.5), getRandomRange(-1,1)] as [number, number, number],
        scale: getRandomRange(0.5, 1.2)
    })), []);

    return (
        <group ref={group} position={position} scale={scale}>
            {bubbles.map((b, i) => (
                <mesh key={i} geometry={sphereGeo} position={b.pos} scale={b.scale} castShadow>
                    <meshStandardMaterial color="white" flatShading opacity={0.9} transparent />
                </mesh>
            ))}
        </group>
    )
}

const Bird = ({ position, speed, offset }: { position: [number, number, number], speed: number, offset: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(ref.current) {
            const time = state.clock.elapsedTime + offset;
            ref.current.position.x = position[0] + Math.sin(time * speed) * GRID_SIZE;
            ref.current.position.z = position[1] + Math.cos(time * speed) * GRID_SIZE/2;
            ref.current.rotation.y = -time * speed + Math.PI;
            ref.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
        }
    });

    return (
        <group ref={ref} position={[position[0], position[2], position[1]]}>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[0.1,0,0]} rotation={[0, Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[-0.1,0,0]} rotation={[0, -Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
        </group>
    )
}

const EnvironmentEffects = () => {
    const treeColors = ["#166534", "#15803d", "#3f6212", "#064e3b"]; // Tropical green variation
    return (
        <group raycast={() => null}>
             {/* Clouds - slightly more hazy/gray for Jakarta vibe */}
            <Cloud position={[-12, 8, 4]} scale={1.5} speed={0.3} />
            <Cloud position={[5, 9, -8]} scale={1.2} speed={0.5} />
            <Cloud position={[15, 7, 10]} scale={1.8} speed={0.2} />
            
            {/* Birds */}
            <group position={[0, 0, 0]} scale={0.8}>
                <Bird position={[0, 0, 10]} speed={0.4} offset={0} />
                <Bird position={[0, 0, 10]} speed={0.4} offset={1.2} />
            </group>

            {/* Water - slightly dark/urban Jakarta river color */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                <planeGeometry args={[GRID_SIZE * 4, GRID_SIZE * 4]} />
                <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.2} opacity={0.6} transparent />
            </mesh>

            {/* Subtle atmospheric haze */}
            <fogExp2 attach="fog" args={['#0f172a', 0.015]} />
        </group>
    )
};


// --- 3. Main Map Component ---

const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.3 }), []);
  // Shorten the dash length and width slightly to create more gap
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.08, 0.35), []);

  const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
  const hasDown = y < GRID_SIZE - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
  const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
  const hasRight = x < GRID_SIZE - 1 && grid[y][x + 1].buildingType === BuildingType.Road;

  const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
  
  if (connections === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]} geometry={lineGeo} material={lineMaterial} />
    );
  }

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
      {(hasUp || hasDown) && (hasLeft || hasRight) && (
        <mesh position={[0, 0, 0.005]} material={lineMaterial}>
           <planeGeometry args={[0.08, 0.08]} />
        </mesh>
      )}

      {/* Adjust positions to 0.325 instead of 0.25 to move dashes further from center, increasing gap */}
      {hasUp && <mesh position={[0, 0.325, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasDown && <mesh position={[0, -0.325, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasLeft && <mesh position={[-0.325, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      {hasRight && <mesh position={[0.325, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
    </group>
  );
});

interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
}

const GroundTile = React.memo(({ type, x, y, grid, onHover, onLeave, onClick }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  const hash = getHash(x, y);
  let color = '#22c55e';
  let topY = -0.3; 
  let thickness = 0.6;
  
  if (type === BuildingType.None) {
    color = hash > 0.8 ? '#15803d' : hash > 0.4 ? '#22c55e' : '#166534';
  } else if (type === BuildingType.Road) {
    color = '#475569';
    topY = -0.29;
  } else {
    color = '#cbd5e1';
    topY = -0.285;
  }

  const centerY = topY - thickness/2;

  // Detect edge of map for "cliff" effect
  const isEdgeX = x === 0 || x === GRID_SIZE - 1;
  const isEdgeY = y === 0 || y === GRID_SIZE - 1;
  const cliffHeight = isEdgeX || isEdgeY ? thickness * 1.5 : thickness;

  return (
    <group position={[wx, 0, wz]}>
        <mesh 
            position={[0, centerY - (cliffHeight - thickness) / 2, 0]} 
            receiveShadow castShadow
            onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
            onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(x, y);
            }}
        >
          {/* Use slightly larger dimensions (1.005) to ensure no gaps */}
          <boxGeometry args={[1.005, cliffHeight, 1.005]} />
          <meshStandardMaterial color={color} roughness={0.8} />
          {type === BuildingType.Road && <RoadMarkings x={x} y={y} grid={grid} yOffset={thickness / 2 + 0.001} />}
        </mesh>
        
        {/* Foundation for buildings */}
        {(type !== BuildingType.None && type !== BuildingType.Road) && (
            <mesh position={[0, topY + 0.02, 0]} receiveShadow>
                <boxGeometry args={[0.95, 0.04, 0.95]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} />
            </mesh>
        )}
    </group>
  );
});

// Selection/Hover Cursor
const Cursor = ({ x, y, color }: { x: number, y: number, color: string }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  return (
    <mesh position={[wx, -0.25, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      <Outlines thickness={0.05} color="white" />
    </mesh>
  );
};


interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
  gameStarted: boolean;
}

const IsoMap: React.FC<IsoMapProps> = ({ 
  grid, onTileClick, hoveredTool, population, gameStarted
}) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);

  const handleHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewColor = showPreview ? BUILDINGS[hoveredTool].color : 'white';
  const isBulldoze = hoveredTool === BuildingType.None;
  
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0,0,0];

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        
        <MapControls 
          enableRotate={true}
          enableZoom={true}
          minZoom={20}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.1}
          target={[0,-0.5,0]}
        />

        <ambientLight intensity={0.5} color="#cceeff" />
        <directionalLight
          castShadow
          position={[15, 20, 10]}
          intensity={2}
          color="#fffbeb"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15} shadow-camera-right={15}
          shadow-camera-top={15} shadow-camera-bottom={-15}
        >
        </directionalLight>
        <Environment preset="city" />

        <EnvironmentEffects />

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              // Calculate world position once per tile
              const [wx, _, wz] = gridToWorld(x, y);
              
              return (
              <React.Fragment key={`${x}-${y}`}>
                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}
                    onHover={handleHover}
                    onLeave={handleLeave}
                    onClick={onTileClick}
                />
                
                {/* Building visual - apply world position to group to align with ground tile */}
                <group position={[wx, 0, wz]} raycast={() => null}>
                    {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && tile.isOrigin !== false && (
                      <ProceduralBuilding 
                        type={tile.buildingType} 
                        baseColor={BUILDINGS[tile.buildingType].color} 
                        x={x} y={y} 
                        status={tile.status}
                      />
                    )}
                </group>
              </React.Fragment>
            )})
          )}

          {/* Visual Elements - disable pointer events */}
          <group raycast={() => null}>
            <TrafficSystem grid={grid} />
            <PopulationSystem population={population} grid={grid} />

            {/* Placement Preview */}
            {showPreview && hoveredTile && (
              <group position={[previewPos[0], 0, previewPos[2]]}>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.1} floatingRange={[0, 0.1]}>
                  <ProceduralBuilding 
                    type={hoveredTool} 
                    baseColor={previewColor} 
                    x={hoveredTile.x} 
                    y={hoveredTile.y} 
                    transparent 
                    opacity={0.7} 
                  />
                </Float>
              </group>
            )}

            {/* Highlight */}
            {hoveredTile && (
              <Cursor 
                x={hoveredTile.x} 
                y={hoveredTile.y} 
                color={isBulldoze ? '#ef4444' : (showPreview ? '#ffffff' : '#000000')} 
              />
            )}
          </group>
        </group>
        
        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};

export default IsoMap;