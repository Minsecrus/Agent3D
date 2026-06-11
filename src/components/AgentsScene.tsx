import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { OrthographicCamera } from "three";
import type { Mesh } from "three";
import { Vector3 } from "three";
import { layoutAgentsOnStage, stageTiers } from "../data/stageLayout";
import type { Agent, AgentHoverPositionHandle } from "../types";
import type { PositionedAgent } from "../data/stageLayout";
import {
  getAgentMaterialSpec,
  getAgentMotionSpec,
  getGeometrySpec,
  stateGlow,
} from "../visual/agentVisuals";

function AgentGeometry({
  agent,
  selected,
  hovered,
  onSelect,
  onPointerEnter,
  onPointerLeave,
}: {
  agent: PositionedAgent;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const mesh = useRef<Mesh>(null);
  const glowColor = stateGlow[agent.currentState];
  const isActive =
    agent.currentState === "EXECUTING" || agent.currentState === "THINKING";
  const usesHoverLight =
    agent.currentState !== "AWAITING_APPROVAL" &&
    agent.currentState !== "ERROR" &&
    agent.currentState !== "SLEEP";
  const shouldShowPointLight =
    usesHoverLight &&
    (isActive || selected || (hovered && agent.currentState !== "IDLE"));
  const geometry = getGeometrySpec(agent.geometryType);
  const material = getAgentMaterialSpec(agent, selected, isActive);
  const motion = getAgentMotionSpec(agent, selected);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * motion.rotationSpeed;
    mesh.current.rotation.x += delta * motion.rotationSpeed * 0.28;
    const pulse =
      1 +
      Math.sin(state.clock.elapsedTime * agent.corePulseHz * Math.PI) *
        motion.pulseScale;
    mesh.current.scale.setScalar((selected ? 1.22 : 1) * pulse);
  });

  const geometryBody = (
    <>
      {shouldShowPointLight && (
        <pointLight
          color={glowColor}
          intensity={motion.glowIntensity}
          distance={motion.glowDistance}
        />
      )}
      <mesh
        ref={mesh}
        onClick={onSelect}
        onPointerEnter={(event) => {
          event.stopPropagation()
          onPointerEnter()
        }}
        onPointerLeave={onPointerLeave}
        castShadow
      >
        {geometry.type === "sphere" && <sphereGeometry args={geometry.args as [number, number, number]} />}
        {geometry.type === "tetrahedron" && <tetrahedronGeometry args={geometry.args as [number, number]} />}
        {geometry.type === "octahedron" && <octahedronGeometry args={geometry.args as [number, number]} />}
        {geometry.type === "torus" && <torusGeometry args={geometry.args as [number, number, number, number]} />}
        {geometry.type === "cube" && <boxGeometry args={geometry.args as [number, number, number, number, number, number]} />}
        <meshPhysicalMaterial
          color={material.color}
          emissive={glowColor}
          emissiveIntensity={material.emissiveIntensity}
          metalness={material.metalness}
          roughness={material.roughness}
          transmission={material.transmission}
          thickness={material.thickness}
          transparent
          opacity={material.opacity}
          clearcoat={material.clearcoat}
          clearcoatRoughness={material.clearcoatRoughness}
          sheen={material.sheen}
          sheenColor="#ffffff"
          iridescence={material.iridescence}
          iridescenceIOR={material.iridescenceIOR}
          iridescenceThicknessRange={material.iridescenceThicknessRange}
        />
      </mesh>
    </>
  )

  return (
    <group position={agent.position}>
      {agent.currentState === "SLEEP" ? (
        geometryBody
      ) : (
        <Float speed={0.8} floatIntensity={motion.floatIntensity}>
          {geometryBody}
        </Float>
      )}
    </group>
  );
}

function AgentRack() {
  return (
    <group>
      <mesh position={[0, 0.92, -2.05]} receiveShadow>
        <boxGeometry args={[8.45, 3.25, 0.22]} />
        <meshStandardMaterial
          color="#d9dde3"
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>
      {stageTiers.map((tier) => (
        <group key={`${tier.y}-${tier.z}`}>
          <mesh position={[tier.x, tier.y, tier.z]} castShadow receiveShadow>
            <boxGeometry args={[tier.width, tier.height, tier.depth]} />
            <meshStandardMaterial
              color="#cfd4dc"
              roughness={0.78}
              metalness={0.02}
            />
          </mesh>
          <mesh
            position={[tier.x, tier.y + tier.height / 2 + 0.012, tier.z]}
            receiveShadow
          >
            <boxGeometry args={[tier.width + 0.04, 0.024, tier.depth + 0.04]} />
            <meshStandardMaterial
              color="#e4e8ee"
              roughness={0.62}
              metalness={0.03}
            />
          </mesh>
        </group>
      ))}
      {stageTiers.slice(1).map((tier, index) => {
        const previous = stageTiers[index];
        const y = (previous.y + tier.y) / 2;
        const z = (previous.z + tier.z) / 2;
        return (
          <mesh
            key={`riser-${tier.y}`}
            position={[0, y, z]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[
                Math.min(previous.width, tier.width),
                Math.abs(tier.y - previous.y) + previous.height,
                0.08,
              ]}
            />
            <meshStandardMaterial
              color="#aeb5bf"
              roughness={0.82}
              metalness={0.02}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function StudioMark({ onOpen }: { onOpen: () => void }) {
  return (
    <Text
      position={[-3.52, 1.92, -1.92]}
      rotation={[0, 0, 0]}
      fontSize={0.18}
      letterSpacing={0.04}
      color="#8d877d"
      anchorX="left"
      anchorY="middle"
      onClick={(event) => {
        event.stopPropagation()
        onOpen()
      }}
    >
      XX工作室
    </Text>
  )
}

function CameraRig({ selectedAgent }: { selectedAgent: PositionedAgent | null }) {
  const cameraTarget = useRef(new Vector3(1.08, 1.85, 6.4));
  const lookAtTarget = useRef(new Vector3(0, 0.7, -0.42));

  useFrame(({ camera }) => {
    const zoomTarget = selectedAgent ? 250 : 200;

    if (selectedAgent) {
      cameraTarget.current.set(
        selectedAgent.position[0] * 0.72 + 0.72,
        selectedAgent.position[1] + 1.3,
        selectedAgent.position[2] + 4.75,
      );
      lookAtTarget.current.set(
        selectedAgent.position[0],
        selectedAgent.position[1] - 0.05,
        selectedAgent.position[2],
      );
    } else {
      cameraTarget.current.set(1.08, 1.85, 6.4);
      lookAtTarget.current.set(0, 0.7, -0.42);
    }

    camera.position.lerp(cameraTarget.current, 0.075);
    camera.lookAt(lookAtTarget.current);

    const orthographicCamera = camera as OrthographicCamera;
    orthographicCamera.zoom += (zoomTarget - orthographicCamera.zoom) * 0.075;
    orthographicCamera.updateProjectionMatrix();
  });

  return null;
}

function HoverProjector({
  agents,
  hoveredAgentId,
  hoverPositionRef,
}: {
  agents: PositionedAgent[];
  hoveredAgentId: string | null;
  hoverPositionRef: RefObject<AgentHoverPositionHandle | null>;
}) {
  const anchorPoint = useRef(new Vector3());

  useFrame(({ camera, size }) => {
    if (!hoveredAgentId) {
      hoverPositionRef.current?.update(null);
      return;
    }

    const agent = agents.find((item) => item.id === hoveredAgentId);
    if (!agent) {
      hoverPositionRef.current?.update(null);
      return;
    }

    anchorPoint.current.set(agent.position[0], agent.position[1], agent.position[2]);
    anchorPoint.current.project(camera);
    const anchorX = (anchorPoint.current.x * 0.5 + 0.5) * size.width;
    const anchorY = (-anchorPoint.current.y * 0.5 + 0.5) * size.height;
    hoverPositionRef.current?.update({
      agentId: agent.id,
      x: anchorX,
      y: anchorY,
      anchorX,
      anchorY,
    });
  });

  return null;
}

export function AgentsScene({
  agents,
  selectedAgentId,
  onSelectAgent,
  onClearFocus,
  onOpenStudioInfo,
  onHoverAgent,
  hoveredAgentId,
  hoverPositionRef,
}: {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onClearFocus: () => void;
  onOpenStudioInfo: () => void;
  onHoverAgent: (agentId: string | null) => void;
  hoveredAgentId: string | null;
  hoverPositionRef: RefObject<AgentHoverPositionHandle | null>;
}) {
  const positionedAgents = useMemo(() => layoutAgentsOnStage(agents), [agents]);
  const selectedAgent =
    positionedAgents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [1.08, 1.65, 6.4], zoom: 124 }}
      onPointerMissed={onClearFocus}
    >
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={0.24} />
      <hemisphereLight args={["#ffffff", "#c8cdd6", 1.2]} />
      <directionalLight
        position={[-3.8, 5.4, 4.2]}
        intensity={4.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[3.5, 2.5, 2.8]} intensity={0.75} />
      <CameraRig selectedAgent={selectedAgent} />
      <HoverProjector
        agents={positionedAgents}
        hoveredAgentId={hoveredAgentId}
        hoverPositionRef={hoverPositionRef}
      />
      <AgentRack />
      <StudioMark onOpen={onOpenStudioInfo} />
      {positionedAgents.map((agent) => (
        <AgentGeometry
          key={agent.id}
          agent={agent}
          selected={agent.id === selectedAgentId}
          hovered={agent.id === hoveredAgentId}
          onSelect={() => onSelectAgent(agent.id)}
          onPointerEnter={() => onHoverAgent(agent.id)}
          onPointerLeave={() => onHoverAgent(null)}
        />
      ))}
      <Environment preset="city" />
    </Canvas>
  );
}
