'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useMousePosition } from '@/hooks/useMousePosition';

type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'upleft'
  | 'upright'
  | 'downleft'
  | 'downright';
type ControlMode = 'follow' | 'sleep' | 'stop';

interface NekoState {
  state: number; // 0 = walking, 1-3 = claw, 4-6 = awake, 7-9 = scratch, 10-12 = wash, 13-15 = yawn, 16+ = sleep
  count: number; // frame counter
  min: number; // minimum frames before transition
  max: number; // maximum frames before transition
  waiting: boolean; // idle mode
  hitBoundary: boolean; // boundary collision flag
  lockedDirection?: Direction; // locked direction during claw state
}

interface SpriteSet {
  idle: string;
  walk1: string;
  walk2: string;
  sleep1?: string;
  sleep2?: string;
  scratch1?: string;
  scratch2?: string;
  yawn1?: string;
  yawn2?: string;
}

const SPRITE_SIZE = 32;
const SCALE = 1.2;
const MAX_SPEED = 1.5; // Maximum movement speed (reduced for slower movement)
const ACCELERATION = 0.08; // How quickly cat accelerates toward target (slower acceleration)
const FRICTION = 0.92; // Velocity dampening for smooth movement (more friction)
const IDLE_DISTANCE = 35; // Distance where cat stops and becomes idle
const HYSTERESIS_DISTANCE = 10; // Reduced buffer when already idle
const CLAW_TRIGGER_DISTANCE = 20; // Distance at which claw animation triggers (well within idle zone)

interface Props {
  controlMode?: ControlMode;
  onModeChange?: (mode: ControlMode) => void;
}

export default function NekoCat({ controlMode = 'follow' }: Props) {
  const mousePosition = useMousePosition();
  const [catPosition, setCatPosition] = useState(() => {
    // Always start from bottom left corner
    if (typeof window !== 'undefined') {
      return {
        x: 20, // Small margin from left edge
        y: window.innerHeight - SPRITE_SIZE * SCALE - 100, // Small margin from bottom
      };
    }
    return { x: 20, y: 500 }; // Fallback for SSR (bottom left-ish)
  });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<Direction>('down');
  const [nekoState, setNekoState] = useState<NekoState>({
    state: 0,
    count: 0,
    min: 8,
    max: 16,
    waiting: false,
    hitBoundary: false,
    lockedDirection: undefined,
  });
  const [frame, setFrame] = useState(0);
  const animationFrameRef = useRef<number>(0);
  const [isInitialDelay, setIsInitialDelay] = useState(true);

  // Add initial delay before cat starts moving
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialDelay(false);
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, []);

  const sprites: Record<Direction, SpriteSet> = {
    up: {
      idle: '/neko/up1.png',
      walk1: '/neko/up1.png',
      walk2: '/neko/up2.png',
    },
    down: {
      idle: '/neko/down1.png',
      walk1: '/neko/down1.png',
      walk2: '/neko/down2.png',
    },
    left: {
      idle: '/neko/left1.png',
      walk1: '/neko/left1.png',
      walk2: '/neko/left2.png',
    },
    right: {
      idle: '/neko/right1.png',
      walk1: '/neko/right1.png',
      walk2: '/neko/right2.png',
    },
    upleft: {
      idle: '/neko/upleft1.png',
      walk1: '/neko/upleft1.png',
      walk2: '/neko/upleft2.png',
    },
    upright: {
      idle: '/neko/upright1.png',
      walk1: '/neko/upright1.png',
      walk2: '/neko/upright2.png',
    },
    downleft: {
      idle: '/neko/downleft1.png',
      walk1: '/neko/downleft1.png',
      walk2: '/neko/downleft2.png',
    },
    downright: {
      idle: '/neko/downright1.png',
      walk1: '/neko/downright1.png',
      walk2: '/neko/downright2.png',
    },
  };

  const clawSprites: Record<string, { claw1: string; claw2: string }> = {
    up: { claw1: '/neko/upclaw1.png', claw2: '/neko/upclaw2.png' },
    down: { claw1: '/neko/downclaw1.png', claw2: '/neko/downclaw2.png' },
    left: { claw1: '/neko/leftclaw1.png', claw2: '/neko/leftclaw2.png' },
    right: { claw1: '/neko/rightclaw1.png', claw2: '/neko/rightclaw2.png' },
  };

  const specialSprites = {
    sleep1: '/neko/sleep1.png',
    sleep2: '/neko/sleep2.png',
    scratch1: '/neko/scratch1.png',
    scratch2: '/neko/scratch2.png',
    wash1: '/neko/wash1.png',
    wash2: '/neko/wash2.png',
    yawn1: '/neko/yawn1.png',
    yawn2: '/neko/yawn2.png',
    awake: '/neko/awake.png',
  };

  // Neko idle state progression with enhanced timing
  const stayIdle = (forceClaw = false, currentDirection?: Direction) => {
    setNekoState((prev) => {
      const newState = { ...prev };

      switch (prev.state) {
        case 0:
          // Walking -> Claw (when catching cursor) or Awake (normal idle)
          if (forceClaw) {
            newState.state = 1;
            newState.lockedDirection = currentDirection || direction;
            newState.count = 0;
            newState.min = 20; // Longer claw animation for better visibility
            newState.max = 40;
          } else {
            newState.state = 4;
            newState.count = 0;
            newState.min = 60; // Longer awake time before next action
            newState.max = 120;
          }
          break;
        case 1:
        case 2:
        case 3:
          // claw state - keep locked direction, longer timing for better visibility
          newState.min = 20;
          newState.max = 40;
          break;
        case 4:
        case 5:
        case 6:
          // awake state - longer idle time
          newState.min = 60;
          newState.max = 120;
          break;
        case 7:
        case 8:
        case 9:
          // scratch state - moderate activity time
          newState.min = 20;
          newState.max = 40;
          break;
        case 10:
        case 11:
        case 12:
          // wash state - moderate activity time
          newState.min = 20;
          newState.max = 40;
          break;
        case 13:
        case 14:
        case 15:
          // yawn state - prepare for sleep, longer yawn
          newState.min = 40;
          newState.max = 80;
          break;
        default:
          // sleep state - indefinite until disturbed
          newState.min = 200;
          newState.max = 400;
          break;
      }

      return newState;
    });
  };

  // Calculate direction based on angle
  const getDirection = (dx: number, dy: number): Direction => {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'downright';
    if (angle >= 67.5 && angle < 112.5) return 'down';
    if (angle >= 112.5 && angle < 157.5) return 'downleft';
    if ((angle >= 157.5 && angle <= 180) || (angle >= -180 && angle < -157.5))
      return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'upleft';
    if (angle >= -112.5 && angle < -67.5) return 'up';
    if (angle >= -67.5 && angle < -22.5) return 'upright';

    return 'down';
  };

  // Map any direction to a cardinal direction for claw animations
  const getClawDirection = (
    dir: Direction
  ): 'up' | 'down' | 'left' | 'right' => {
    switch (dir) {
      case 'up':
      case 'upleft':
      case 'upright':
        return 'up';
      case 'down':
      case 'downleft':
      case 'downright':
        return 'down';
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      default:
        return 'down'; // fallback
    }
  };

  // Frame counters for different animation types
  const frameCounter = useRef(0);
  const walkingFrameCounter = useRef(0);
  const idleFrameCounter = useRef(0);
  const sleepFrameCounter = useRef(0);

  // Consolidated animation loop for better performance
  useEffect(() => {
    let lastTime = 0;
    const STATE_UPDATE_INTERVAL = 200; // State updates every 80ms

    // Different frame intervals for different animation types
    const WALKING_FRAME_INTERVAL = 1500; // Walking animations
    const ACTIVE_IDLE_FRAME_INTERVAL = 3000; // Scratch, wash, yawn
    const CALM_IDLE_FRAME_INTERVAL = 5000; // Sleep, awake

    const animate = (currentTime: number) => {
      // Update frame counters
      frameCounter.current++;
      walkingFrameCounter.current++;
      idleFrameCounter.current++;
      sleepFrameCounter.current++;

      // Determine which frame interval to use based on current state
      let currentFrameInterval: number;
      let currentFrameCounter: number;

      if (nekoState.state === 0) {
        // Walking state
        currentFrameInterval = WALKING_FRAME_INTERVAL;
        currentFrameCounter = walkingFrameCounter.current;
      } else if (
        nekoState.state >= 16 ||
        (nekoState.state >= 4 && nekoState.state <= 6)
      ) {
        // Sleep or awake states (calm)
        currentFrameInterval = CALM_IDLE_FRAME_INTERVAL;
        currentFrameCounter = sleepFrameCounter.current;
      } else {
        // Active idle states (claw, scratch, wash, yawn)
        currentFrameInterval = ACTIVE_IDLE_FRAME_INTERVAL;
        currentFrameCounter = idleFrameCounter.current;
      }

      // Update frame animation based on appropriate interval
      if (currentFrameCounter % Math.floor(currentFrameInterval / 16) === 0) {
        setFrame((prev) => (prev + 1) % 2);
      }

      // Update state at specified interval
      if (currentTime - lastTime >= STATE_UPDATE_INTERVAL) {
        setNekoState((prev) => {
          const newState = { ...prev };
          newState.count++;

          // Calculate distance to mouse (using cat center position for consistency)
          const catCenterX = catPosition.x + (SPRITE_SIZE * SCALE) / 2;
          const catCenterY = catPosition.y + (SPRITE_SIZE * SCALE) / 2;
          const dx = mousePosition.x - catCenterX;
          const dy = mousePosition.y - catCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Handle sleep mode with natural progression
          if (controlMode === 'sleep') {
            // Only force transitions when current state timer has expired
            if (newState.count > newState.max) {
              if (newState.state < 4) {
                // First go to awake state
                newState.state = 4;
                newState.count = 0;
                newState.min = 30; // Shorter awake time in sleep mode
                newState.max = 60;
              } else if (newState.state >= 4 && newState.state < 13) {
                // Skip to yawn state if not already there
                newState.state = 13;
                newState.count = 0;
                newState.min = 20; // Shorter yawn in sleep mode
                newState.max = 40;
              }
            }
            // Skip all mouse-following logic when in sleep mode
            // Let natural state progression handle yawn-to-sleep transition
          } else {
            // Normal follow/stop mode logic
            // Skip all logic during initial delay
            if (isInitialDelay) {
              return newState;
            }

            // Use hysteresis to prevent rapid state switching
            const currentlyIdle = newState.state > 0;
            const distanceThreshold = currentlyIdle
              ? IDLE_DISTANCE + HYSTERESIS_DISTANCE // Larger threshold when already idle
              : IDLE_DISTANCE; // Normal threshold when walking

            // If close to mouse or in waiting mode, stay idle
            if (
              distance < distanceThreshold ||
              newState.waiting ||
              controlMode === 'stop'
            ) {
              // Check if we just caught the cursor (very close distance and walking or awake)
              const caughtCursor =
                distance < CLAW_TRIGGER_DISTANCE &&
                (newState.state === 0 ||
                  (newState.state >= 4 && newState.state <= 6));
              if (caughtCursor) {
                // Lock direction and enter claw state
                const currentDirection = getDirection(dx, dy);
                stayIdle(true, currentDirection);
              } else if (newState.state === 0) {
                // Normal idle transition (only if walking)
                stayIdle(false);
              }
              // If already in idle states (1+), don't call stayIdle again
              return newState;
            }

            // If far from mouse, start chasing (reset to walking state)
            if (newState.state >= 16) {
              // Was sleeping, now wake up - show awake sprite briefly
              newState.state = 4;
              newState.count = 0;
              newState.min = 8;
              newState.max = 16;
              newState.lockedDirection = undefined;
            } else {
              // Reset to walking state
              newState.state = 0;
              newState.min = 8;
              newState.max = 16;
              newState.lockedDirection = undefined;
            }
          }

          // Handle natural state progression when count exceeds max
          if (newState.count > newState.max && newState.state > 0) {
            newState.count = 0;

            // Natural state progression
            switch (newState.state) {
              case 1:
              case 2:
              case 3:
                // Claw state -> go back to awake
                newState.state = 4;
                newState.min = 60;
                newState.max = 120;
                newState.lockedDirection = undefined;
                newState.hitBoundary = false;
                break;
              case 4:
              case 5:
              case 6:
                // Awake state -> randomly choose next activity or stay awake longer
                const random = Math.random();
                if (random < 0.3) {
                  // 30% chance to scratch
                  newState.state = 7;
                  newState.min = 30;
                  newState.max = 60;
                } else if (random < 0.6) {
                  // 30% chance to wash
                  newState.state = 10;
                  newState.min = 30;
                  newState.max = 60;
                } else if (random < 0.8) {
                  // 20% chance to yawn (start getting sleepy)
                  newState.state = 13;
                  newState.min = 40;
                  newState.max = 80;
                } else {
                  // 20% chance to stay awake longer (reduced from 30%)
                  newState.state = 4;
                  newState.min = 40;
                  newState.max = 80;
                }
                break;
              case 7:
              case 8:
              case 9:
                // Scratch state -> continue scratching or go back to awake
                if (newState.state < 9) {
                  newState.state++; // Continue scratching animation
                  newState.min = 40;
                  newState.max = 80;
                } else {
                  // After full scratch cycle, go back to awake for a bit
                  newState.state = 4;
                  newState.min = 100;
                  newState.max = 200;
                }
                break;
              case 10:
              case 11:
              case 12:
                // Wash state -> continue washing or go back to awake
                if (newState.state < 12) {
                  newState.state++; // Continue washing animation
                  newState.min = 40;
                  newState.max = 80;
                } else {
                  // After full wash cycle, go back to awake for a bit
                  newState.state = 4;
                  newState.min = 100;
                  newState.max = 200;
                }
                break;
              case 13:
              case 14:
              case 15:
                // Yawn state -> continue yawning or go to sleep
                if (newState.state < 15) {
                  newState.state++; // Continue yawning
                  newState.min = 60;
                  newState.max = 120;
                } else {
                  // After full yawn, go to sleep
                  newState.state = 16;
                  newState.min = 300;
                  newState.max = 600;
                }
                break;
              default:
                // Sleep state or other - just increment
                newState.state++;
                break;
            }
          }

          return newState;
        });
        lastTime = currentTime;
      }

      // Handle movement and state progression on every frame
      setCatPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        // State progression is now handled in the main state update section above

        // Calculate distance for movement logic
        const catCenterX = prev.x + (SPRITE_SIZE * SCALE) / 2;
        const catCenterY = prev.y + (SPRITE_SIZE * SCALE) / 2;
        const dx = mousePosition.x - catCenterX;
        const dy = mousePosition.y - catCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move if in walking state OR if in awake state and close to cursor (to allow claw trigger)
        const isWalking = nekoState.state === 0;
        const isAwakeAndCloseToMouse =
          nekoState.state >= 4 &&
          nekoState.state <= 6 &&
          distance > CLAW_TRIGGER_DISTANCE &&
          distance < IDLE_DISTANCE + HYSTERESIS_DISTANCE;

        if (
          (isWalking || isAwakeAndCloseToMouse) &&
          controlMode === 'follow' &&
          !isInitialDelay
        ) {
          // Follow mouse (center-based positioning)
          const targetX = mousePosition.x - (SPRITE_SIZE * SCALE) / 2;
          const targetY = mousePosition.y - (SPRITE_SIZE * SCALE) / 2;

          const moveDx = targetX - prev.x;
          const moveDy = targetY - prev.y;

          // Smooth movement with velocity-based physics
          if (!nekoState.lockedDirection) {
            const moveDistance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

            if (moveDistance > 1) {
              // Calculate desired velocity toward target
              const normalizedDx = moveDx / moveDistance;
              const normalizedDy = moveDy / moveDistance;

              // Apply acceleration toward target
              setVelocity((prevVel) => {
                const targetVelX = normalizedDx * MAX_SPEED;
                const targetVelY = normalizedDy * MAX_SPEED;

                const newVelX =
                  prevVel.x + (targetVelX - prevVel.x) * ACCELERATION;
                const newVelY =
                  prevVel.y + (targetVelY - prevVel.y) * ACCELERATION;

                return { x: newVelX, y: newVelY };
              });

              // Apply velocity to position
              newX += velocity.x;
              newY += velocity.y;

              // Update direction based on velocity
              if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
                setDirection(getDirection(velocity.x, velocity.y));
              }
            } else {
              // Apply friction when close to target
              setVelocity((prevVel) => ({
                x: prevVel.x * FRICTION,
                y: prevVel.y * FRICTION,
              }));

              newX += velocity.x;
              newY += velocity.y;
            }
          }
        }

        // Check for boundary collision and implement bouncing
        const catSize = SPRITE_SIZE * SCALE;
        const windowWidth =
          typeof window !== 'undefined' ? window.innerWidth : 800;
        const windowHeight =
          typeof window !== 'undefined' ? window.innerHeight : 600;
        let hitLeftBoundary = newX <= 0;
        let hitRightBoundary = newX >= windowWidth - catSize;
        let hitTopBoundary = newY <= 0;
        let hitBottomBoundary = newY >= windowHeight - catSize;

        // Handle boundary collisions with bouncing (before clamping position)
        if (
          (hitLeftBoundary ||
            hitRightBoundary ||
            hitTopBoundary ||
            hitBottomBoundary) &&
          nekoState.state === 0
        ) {
          // Bounce velocity off boundaries with proper direction
          setVelocity((prevVel) => {
            let newVelX = prevVel.x;
            let newVelY = prevVel.y;

            if (hitLeftBoundary || hitRightBoundary) {
              newVelX = -prevVel.x * 0.7; // Reverse and dampen
            }
            if (hitTopBoundary || hitBottomBoundary) {
              newVelY = -prevVel.y * 0.7; // Reverse and dampen
            }

            return { x: newVelX, y: newVelY };
          });
        }

        // Clamp position to bounds (after handling velocity)
        newX = Math.max(0, Math.min(newX, windowWidth - catSize));
        newY = Math.max(0, Math.min(newY, windowHeight - catSize));

        // Reset velocity when not in walking state
        if (nekoState.state !== 0) {
          setVelocity({ x: 0, y: 0 });
        }

        return { x: newX, y: newY };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, catPosition, controlMode, nekoState]);

  // Get current sprite
  const getCurrentSprite = () => {
    // During initial delay, always show awake sprite
    if (isInitialDelay) {
      return specialSprites.awake;
    }

    let sprite: string;

    switch (true) {
      case nekoState.state >= 16:
        sprite = frame === 0 ? 'sleep1' : 'sleep2';
        break;
      case nekoState.state >= 13 && nekoState.state <= 15:
        sprite = frame === 0 ? 'yawn1' : 'yawn2';
        break;
      case nekoState.state >= 10 && nekoState.state <= 12:
        sprite = frame === 0 ? 'wash1' : 'wash2';
        break;
      case nekoState.state >= 7 && nekoState.state <= 9:
        sprite = frame === 0 ? 'scratch1' : 'scratch2';
        break;
      case nekoState.state >= 4 && nekoState.state <= 6:
        sprite = 'awake';
        break;
      case nekoState.state >= 1 && nekoState.state <= 3:
        // Claw state - use claw sprites based on locked direction
        const clawDirection = nekoState.lockedDirection
          ? getClawDirection(nekoState.lockedDirection)
          : getClawDirection(direction);
        sprite =
          frame === 0
            ? clawSprites[clawDirection].claw1
            : clawSprites[clawDirection].claw2;
        return sprite;
      default:
        // Walking state (state 0)
        sprite =
          frame === 0 ? sprites[direction].walk1 : sprites[direction].walk2;
        return sprite;
    }

    return specialSprites[sprite as keyof typeof specialSprites];
  };

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${catPosition.x}px`,
        top: `${catPosition.y}px`,
        width: `${SPRITE_SIZE * SCALE}px`,
        height: `${SPRITE_SIZE * SCALE}px`,
      }}
    >
      <Image
        src={getCurrentSprite()}
        alt="Neko cat"
        width={SPRITE_SIZE}
        height={SPRITE_SIZE}
        className="pixelated"
        style={{
          imageRendering: 'pixelated',
          width: `${SPRITE_SIZE * SCALE}px`,
          height: `${SPRITE_SIZE * SCALE}px`,
        }}
        unoptimized
      />
    </div>
  );
}
