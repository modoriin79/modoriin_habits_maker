import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPhysics, RADIUS } from './physics.js';
const MARBLE_COLORS = ['#799b79'];
const sphereGeometry = new THREE.SphereGeometry(RADIUS, 32, 24);
const glassProfile = [
 [0,0.05],[0.65,0.05],[0.91,0.08],[1.035,0.19],[1.07,0.35],[1.07,2.12],
 [1.055,2.34],[1.005,2.51],[0.88,2.71],[0.73,2.9],[0.70,3.04],[0.70,3.17],
 [0.76,3.19],[0.77,3.24],[0.75,3.27],[0.65,3.27],[0.64,3.22],[0.64,3.04],
 [0.68,2.9],[0.82,2.68],[0.955,2.48],[1.005,2.27],[1.005,0.35],[0.96,0.23],[0.83,0.15],[0,0.15],
].map(([x,y]) => new THREE.Vector2(x,y));
const jarGeometry = new THREE.LatheGeometry(glassProfile, 80);
function marble(index) {
 const material = new THREE.MeshPhysicalMaterial({ color: MARBLE_COLORS[index % MARBLE_COLORS.length], metalness:0.05, roughness:0.09, transmission:0.22, thickness:0.3, ior:1.48, clearcoat:1, clearcoatRoughness:0.06, envMapIntensity:1.3 });
 const mesh = new THREE.Mesh(sphereGeometry, material); mesh.castShadow = true;
 return mesh;
}
function makeJar(color = '#ccd4c8') {
 const group = new THREE.Group();
 const material = new THREE.MeshPhysicalMaterial({color, metalness:0.02, roughness:0.12, transparent:true, opacity:0.17, transmission:0, depthWrite:false, side:THREE.DoubleSide, clearcoat:1, clearcoatRoughness:0.06, envMapIntensity:0.85 });
 const glass = new THREE.Mesh(jarGeometry, material); glass.renderOrder = 3; group.add(glass);
 const edgeMaterial = new THREE.MeshPhysicalMaterial({color, transparent:true, opacity:0.6, roughness:0.12, metalness:0.12, depthWrite:false, envMapIntensity:0.8 });
 for (const [r,y,tube] of [[0.705,3.24,0.038],[0.97,0.17,0.038]]) {
  const edge = new THREE.Mesh(new THREE.TorusGeometry(r,tube,12,80),edgeMaterial); edge.rotation.x = Math.PI/2;edge.position.y = y; edge.renderOrder = 4;group.add(edge);
 }
 // Fine vertical fluting catches the broad window light, like pressed glass.
 const ribMaterial = new THREE.MeshPhysicalMaterial({ color, transparent:true, opacity:0.25, roughness:0.14, metalness:0.07, depthWrite:false });
 for(let i=0;i<44;i++) {
  const a = i/44*Math.PI*2;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*0.96,0.2,Math.sin(a)*0.96),new THREE.Vector3(Math.cos(a)*1.065,0.42,Math.sin(a)*1.065),new THREE.Vector3(Math.cos(a)*1.065,1.98,Math.sin(a)*1.065),new THREE.Vector3(Math.cos(a)*1.03,2.38,Math.sin(a)*1.03)]);
  const rib = new THREE.Mesh(new THREE.TubeGeometry(curve,12,0.009,4,false),ribMaterial);rib.renderOrder=4;group.add(rib);
 }
 return { group, materials:[material,edgeMaterial,ribMaterial] };
}
function lighting(scene) {
 scene.add(new THREE.HemisphereLight('#fffdf3','#a6ad90',1.6));
 const sun = new THREE.DirectionalLight('#fff9e8',2.2);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=0.025;sun.shadow.bias=-0.0001;sun.shadow.radius=4;scene.add(sun);
 const fill=new THREE.DirectionalLight('#e6eedb',1.2);fill.position.set(4,4,-3);scene.add(fill);
}
export function createScene(container) {
 const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.86;
 container.prepend(renderer.domElement);
 const scene=new THREE.Scene(); const camera=new THREE.OrthographicCamera(-4,4,3,-3,0.1,100);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,0.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();lighting(scene);
 const content=new THREE.Group();content.position.x=-1.65;scene.add(content);
 const jar=makeJar();content.add(jar.group);
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:0.105}));plane.rotation.x=-Math.PI/2;plane.position.y=0.02;plane.receiveShadow=true;scene.add(plane);
 // Soft contact shadow generated in code, with no image assets.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
 const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,3,64,64,64);gradient.addColorStop(0,'rgba(70,80,54,.19)');gradient.addColorStop(.5,'rgba(70,80,54,.08)');gradient.addColorStop(1,'rgba(70,80,54,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.3,3.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;content.add(shadow);
 let marbles=[], busy=false, enabled=false;
 const reserve=Array.from({length:30},(_,i)=>{
  const mesh=marble(i);mesh.castShadow=false;scene.add(mesh);
  const home=new THREE.Vector3(.65+(i%5)*.53,2.95-Math.floor(i/5)*.53,0);
  mesh.position.copy(home);
  const button=document.createElement('button');button.type='button';button.className='reserve-hit';button.dataset.index=i;
  button.setAttribute('aria-label',i===0?'오늘의 구슬 넣기':`구슬 ${i+1} 넣기`);
  if(i===0)button.id='add-marble';container.append(button);
  return {mesh,home,button};
 });
 function render(){renderer.render(scene,camera);}
 function placeButtons(){
  const w=container.clientWidth,h=container.clientHeight;
  const size=Math.max(24,Math.min(44,.5*w/(camera.right-camera.left)));
  reserve.forEach(({home,button})=>{
   const anchor=home.clone().project(camera);
   button.style.left=`${(anchor.x*.5+.5)*w}px`;button.style.top=`${(-anchor.y*.5+.5)*h}px`;
   button.style.width=`${size}px`;button.style.height=`${size}px`;
  });
 }
 function resize(){
  const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);
  const viewHeight=Math.max(5.4,7/(w/h)),viewWidth=viewHeight*w/h;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.position.set(0,5,12);camera.lookAt(0,1.85,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();placeButtons();render();
 }
 new ResizeObserver(resize).observe(container);resize();
 function clearMarbles(){for(const m of marbles){jar.group.remove(m);m.material.dispose();}marbles=[];}
 function setEnabled(value){enabled=value;reserve.forEach(({button})=>button.disabled=!enabled||busy);}
 function load(positions,today=false){
  clearMarbles();positions.forEach((p,i)=>{const m=marble(i);m.position.set(...p);jar.group.add(m);marbles.push(m);});
  reserve.forEach(({mesh,home,button},i)=>{mesh.position.copy(home);mesh.visible=i<30-positions.length;button.hidden=!mesh.visible;button.disabled=today||!enabled||busy;});
  content.scale.setScalar(1);content.position.set(-1.65,0,0);jar.materials.forEach(m=>m.color.set('#ccd4c8'));placeButtons();render();
 }
 function tween(duration, callback){return new Promise(resolve=>{const start=performance.now();function next(now){const t=Math.min((now-start)/duration,1);callback(t);render();if(t<1)requestAnimationFrame(next);else resolve();}requestAnimationFrame(next);});}
 async function drop(index=0){
 busy=true;setEnabled(false);const selected=reserve[index]||reserve[0];const waiting=selected.mesh;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const start=waiting.position.clone();
 const target=new THREE.Vector3((Math.random()-.5)*.28,3.9,(Math.random()-.5)*.20);
 const worldTarget=content.localToWorld(target.clone());
 await tween(reduced?100:950,t=>{const ease=t*t*(3-2*t);waiting.position.lerpVectors(start,worldTarget,ease);waiting.position.y+=Math.sin(t*Math.PI)*.6;});
 const m=marble(marbles.length);m.position.copy(target);jar.group.add(m);marbles.push(m);waiting.visible=false;selected.button.hidden=true;
 const physics=createPhysics(marbles.slice(0,-1).map(m=>m.position.toArray()));const body=physics.add(target.toArray());body.velocity.set((Math.random()-.5)*.6,0,(Math.random()-.5)*.6);body.angularVelocity.set(1,0,.5);
 let last=performance.now(),elapsed=0,settled=0;
 await new Promise(resolve=>{function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;physics.world.step(1/120,dt,8);m.position.copy(body.position);m.quaternion.copy(body.quaternion);render();settled=body.velocity.length()<.07?settled+dt:0;if((settled>.45&&elapsed>1)||elapsed>7){resolve();}else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 busy=false;return m.position.toArray();
 }
 async function complete(color){busy=true;const from=new THREE.Color('#ccd4c8'),to=new THREE.Color(color);await tween(1100,t=>{jar.materials.forEach(m=>m.color.copy(from).lerp(to,t));});await tween(900,()=>{});await tween(900,t=>{const ease=t*t*(3-2*t);content.scale.setScalar(1-ease*.8);content.position.y=-ease*1.8;});busy=false;}
 function thumbnail(record){
  const previewScene=new THREE.Scene();previewScene.environment=environment.texture;lighting(previewScene);
  const preview=makeJar(record.color);previewScene.add(preview.group);record.positions.forEach((p,i)=>{const m=marble(i);m.position.set(...p);preview.group.add(m);});
  const cam=new THREE.PerspectiveCamera(34,1,0.1,30);cam.position.set(0,4.5,8.2);cam.lookAt(0,1.6,0);
  const oldSize=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(240,240,false);renderer.render(previewScene,cam);const data=renderer.domElement.toDataURL('image/png');renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);render();
  previewScene.traverse(o=>{if(o.isMesh){if(o.geometry!==jarGeometry&&o.geometry!==sphereGeometry)o.geometry.dispose();o.material.dispose();}if(o.isLight&&o.shadow)o.shadow.dispose();});return data;
 }
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('render-error').hidden=false;});
 renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
 return {load,drop,complete,thumbnail,setEnabled,render, get positions(){return marbles.map(m=>m.position.toArray());}};
}
