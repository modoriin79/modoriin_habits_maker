import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshState,addEntry,undoToday,localDate,currentEntries,validateState,loadState,saveState,PALETTE } from '../src/state.js';
const entry=i=>({date:`2026-${String(Math.floor(i/28)+1).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}`,position:[0,.345,0]});
function count(n){let s=freshState('책 읽기');for(let i=0;i<n;i++)s=addEntry(s,entry(i));return s;}
test('one record per local day; a missed day does not reset progress',()=>{let s=addEntry(freshState(),entry(0));assert.equal(addEntry(s,entry(0)).entries.length,1);s=addEntry(s,entry(8));assert.equal(currentEntries(s).length,2);});
test('local date uses calendar components rather than UTC',()=>{const d=new Date(2026,0,2,0,1);assert.equal(localDate(d),'2026-01-02');});
test('29 → 30 completes jar, keeps positions and resets active count',()=>{let s=count(29);assert.equal(currentEntries(s).length,29);s=addEntry(s,entry(29));assert.equal(s.jars.length,1);assert.equal(currentEntries(s).length,0);assert.equal(s.jars[0].positions.length,30);assert.equal(s.jars[0].date,entry(29).date);});
test('undo 30th restores 29 and removes completed jar',()=>{const s=undoToday(count(30),entry(29).date);assert.equal(s.jars.length,0);assert.equal(currentEntries(s).length,29);assert.equal(undoToday(s,entry(29).date),s);});
test('undo first record of second jar keeps previous completed jar',()=>{const s=undoToday(count(31),entry(30).date);assert.equal(s.jars.length,1);assert.equal(currentEntries(s).length,0);});
test('successive jars never repeat color',()=>{const s=count(120);for(let i=1;i<s.jars.length;i++)assert.notEqual(s.jars[i].color,s.jars[i-1].color);});
test('save/reload preserves positions and colors exactly',()=>{const s=count(61);let data;const storage={getItem:()=>data,setItem:(_,value)=>data=value};saveState(s,storage);assert.deepEqual(loadState(storage),s);});
test('invalid backup is rejected rather than overwriting records',()=>{assert.throws(()=>validateState({}));const s=count(1);s.entries[0].position=[9,0,0];assert.throws(()=>validateState(s));});
