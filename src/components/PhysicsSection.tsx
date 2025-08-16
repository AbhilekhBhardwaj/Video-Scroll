import React, { useEffect, useRef } from 'react';
import * as Matter from 'matter-js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PhysicsSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const bodiesRef = useRef<Array<{ body: Matter.Body; element: HTMLElement; width: number; height: number }>>([]);
  const topWallRef = useRef<Matter.Body | null>(null);

  const config = {
    gravity: { x: 0, y: 1, scale: 1 },
    restitution: 0.5,
    friction: 0.15,
    frictionAir: 0.02,
    density: 0.002,
    wallThickness: 200,
    mouseStiffness: 0.6,
  };

  const clamp = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };

  const initPhysics = (container: HTMLElement) => {
    console.log('Starting physics initialization...');
    const engine = Matter.Engine.create();
    engine.gravity = config.gravity;
    engine.constraintIterations = 10;
    engine.positionIterations = 20;
    engine.velocityIterations = 16;
    engine.timing.timeScale = 1;
    engineRef.current = engine;

    const containerRect = container.getBoundingClientRect();
    console.log('Container rect:', containerRect);
    const wallThickness = config.wallThickness;

    const walls = [
      Matter.Bodies.rectangle(
        containerRect.width / 2,
        containerRect.height + wallThickness / 2,
        containerRect.width + wallThickness * 2,
        wallThickness,
        { isStatic: true }
      ),
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        containerRect.height / 2,
        wallThickness,
        containerRect.height + wallThickness * 2,
        { isStatic: true }
      ),
      Matter.Bodies.rectangle(
        containerRect.width + wallThickness / 2,
        containerRect.height / 2,
        wallThickness,
        containerRect.height + wallThickness * 2,
        { isStatic: true }
      ),
    ];
    Matter.World.add(engine.world, walls);

    const objects = container.querySelectorAll('.object');
    console.log('Found objects:', objects.length);
    const bodies: Array<{ body: Matter.Body; element: HTMLElement; width: number; height: number }> = [];

    objects.forEach((obj, index) => {
      const element = obj as HTMLElement;
      const objRect = element.getBoundingClientRect();

      const startX = Math.random() * (containerRect.width - objRect.width) + objRect.width / 2;
      const startY = -500 - index * 200;
      const startRotation = (Math.random() - 0.5) * Math.PI;

      const body = Matter.Bodies.rectangle(
        startX,
        startY,
        objRect.width,
        objRect.height,
        {
          restitution: config.restitution,
          friction: config.friction,
          frictionAir: config.frictionAir,
          density: config.density,
        }
      );

      Matter.Body.setAngle(body, startRotation);

      bodies.push({
        body: body,
        element: element,
        width: objRect.width,
        height: objRect.height,
      });

      Matter.World.add(engine.world, body);
    });

    bodiesRef.current = bodies;

    setTimeout(() => {
      const topWall = Matter.Bodies.rectangle(
        containerRect.width / 2,
        -wallThickness / 2,
        containerRect.width + wallThickness * 2,
        wallThickness,
        { isStatic: true }
      );
      Matter.World.add(engine.world, topWall);
      topWallRef.current = topWall;
    }, 3000);

    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: config.mouseStiffness,
        render: { visible: false },
      },
    });

    mouseConstraint.mouse.element.oncontextmenu = () => false;
    mouseConstraintRef.current = mouseConstraint;

    let dragging: Matter.Body | null = null;
    let originalInertia: number | null = null;

    Matter.Events.on(mouseConstraint, 'startdrag', function (event: any) {
      dragging = event.body;
      if (dragging) {
        originalInertia = dragging.inertia;
        Matter.Body.setInertia(dragging, Infinity);
        Matter.Body.setVelocity(dragging, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(dragging, 0);
      }
    });

    Matter.Events.on(mouseConstraint, 'enddrag', function () {
      if (dragging) {
        Matter.Body.setInertia(dragging, originalInertia || 1);
        dragging = null;
        originalInertia = null;
      }
    });

    Matter.Events.on(engine, 'beforeUpdate', function () {
      if (dragging) {
        const found = bodies.find((b) => b.body === dragging);
        if (found) {
          const minX = found.width / 2;
          const maxX = containerRect.width - found.width / 2;
          const minY = found.height / 2;
          const maxY = containerRect.height - found.height / 2;

          Matter.Body.setPosition(dragging, {
            x: clamp(dragging.position.x, minX, maxX),
            y: clamp(dragging.position.y, minY, maxY),
          });

          Matter.Body.setVelocity(dragging, {
            x: clamp(dragging.velocity.x, -20, 20),
            y: clamp(dragging.velocity.y, -20, 20),
          });
        }
      }
    });

    container.addEventListener('mouseleave', () => {
      if (mouseConstraint.constraint) {
        mouseConstraint.constraint.bodyB = null as any;
        mouseConstraint.constraint.pointB = null as any;
      }
    });

    document.addEventListener('mouseup', () => {
      if (mouseConstraint.constraint) {
        mouseConstraint.constraint.bodyB = null as any;
        mouseConstraint.constraint.pointB = null as any;
      }
    });

    Matter.World.add(engine.world, mouseConstraint);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    function updatePositions() {
      bodies.forEach(({ body, element, width, height }) => {
        const x = clamp(
          body.position.x - width / 2,
          0,
          containerRect.width - width
        );
        const y = clamp(
          body.position.y - height / 2,
          -height * 3,
          containerRect.height - height
        );

        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.transform = `rotate(${body.angle}rad)`;
      });

      requestAnimationFrame(updatePositions);
    }
    updatePositions();
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Create ScrollTrigger to initialize physics when section comes into view
    ScrollTrigger.create({
      trigger: '.physics-section',
      start: 'top bottom',
      once: true,
      onEnter: () => {
        const container = containerRef.current;
        if (container && !engineRef.current) {
          console.log('Initializing physics...');
          initPhysics(container);
        }
      },
    });

    // Cleanup
    return () => {
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return (
    <section className="physics-section">
      <div className="object-container" ref={containerRef}>
        <div className="object"><p>Codegrid</p></div>
        <div className="object"><p>HTML</p></div>
        <div className="object"><p>CSS</p></div>
        <div className="object"><p>JavaScript</p></div>
        <div className="object"><p>GSAP</p></div>
        <div className="object"><p>ScrollTrigger</p></div>
        <div className="object"><p>Lenis</p></div>
        <div className="object"><p>React</p></div>
        <div className="object"><p>Next.js</p></div>
        <div className="object"><p>WebGL</p></div>
        <div className="object"><p>Three.js</p></div>
        <div className="object"><p>Creative Dev</p></div>
      </div>

      <div className="physics-content">
        <h2>Because why list when you can play?</h2>
        <p>Interactive physics blocks - drag them around!</p>
      </div>
    </section>
  );
};

export default PhysicsSection;
