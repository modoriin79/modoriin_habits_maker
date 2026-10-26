import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPhysics,RADIUS } from '../src/physics.js';
test('30 individual drops fit in the jar without significant overlap',()=>{
 const positions=[];
 for(let i=0;i<30;i++){
  const p=createPhysics(positions);const body=p.add([Math.sin(i*2.4)*.15,3.9,Math.cos(i*2.4)*.15]);body.velocity.set(Math.sin(i)*.3,0,Math.cos(i)*.3);
  for(let frame=0;frame<840;frame++)p.world.step(1/120);
  const position=[body.position.x,body.position.y,body.position.z];
  assert.ok(Math.hypot(position[0],position[2])+RADIUS<1.05,`marble ${i}: wall containment`);
  assert.ok(position[1]>=.11+RADIUS-.01&&position[1]<2.8,`marble ${i}: floor and shoulder containment`);
  for(const previous of positions)assert.ok(Math.hypot(...position.map((v,k)=>v-previous[k]))>RADIUS*2-.025,`marble ${i}: overlap`);
  positions.push(position);
 }
});
