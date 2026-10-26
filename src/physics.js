import * as CANNON from 'cannon-es';
export const RADIUS = 0.235;
export function createPhysics(positions = []) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0), allowSleep: true });
  world.solver.iterations = 16;
  world.defaultContactMaterial.friction = 0.32;
  world.defaultContactMaterial.restitution = 0.24;
  const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  floor.position.y = 0.11;
  world.addBody(floor);
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI * 2 / 32;
    const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(0.12, 2, 0.18)) });
    wall.position.set(Math.cos(angle) * 1.13, 2, Math.sin(angle) * 1.13);
    wall.quaternion.setFromEuler(0, -angle, 0);
    world.addBody(wall);
  }
  const bodies = [];
  function add(position, fixed = false) {
    const body = new CANNON.Body({ mass: fixed ? 0 : 1, shape: new CANNON.Sphere(RADIUS), linearDamping: 0.32, angularDamping: 0.5, sleepSpeedLimit: 0.06, sleepTimeLimit: 0.5 });
    body.position.set(...position);
    world.addBody(body); bodies.push(body);
    return body;
  }
  positions.forEach(p => add(p, true));
  return { world, bodies, add, positions: () => bodies.map(b => [b.position.x, b.position.y, b.position.z]) };
}
