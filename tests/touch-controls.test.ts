import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHeldPointers,bindHoldButton} from '../src/touchControls.ts';

class Button extends EventTarget {
  held=false;
  classList={toggle:(_name:string,value:boolean)=>{this.held=value;}};
  setPointerCapture(_id:number){}
}
const pointer=(button:Button,type:string,id:number)=>button.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId:id,button:0}));

test('movement, running and firing hold independently across simultaneous touch contacts',()=>{
  const input=createHeldPointers(),walk=new Button(),run=new Button(),fire=new Button();let shots=0;
  for(const [button,action]of [[walk,'KeyW'],[run,'ShiftLeft'],[fire,'use']] as const)
    bindHoldButton(button as unknown as HTMLButtonElement,action,input,()=>true,()=>{if(action==='use')shots++;},()=>{});
  pointer(walk,'pointerdown',11);pointer(run,'pointerdown',12);pointer(fire,'pointerdown',13);
  assert.ok(input.has('KeyW')&&input.has('ShiftLeft')&&input.has('use'));assert.equal(shots,1);
  pointer(fire,'pointerup',13);assert.ok(input.has('KeyW')&&input.has('ShiftLeft'));assert.ok(!input.has('use'));
  pointer(run,'pointercancel',12);assert.ok(input.has('KeyW'));assert.ok(!input.has('ShiftLeft'));
  pointer(walk,'lostpointercapture',11);assert.ok(!input.has('KeyW'));assert.equal(walk.held,false);
});

test('lifting one of two contacts on an action keeps the other held, and blur can clear all input',()=>{
  const input=createHeldPointers();input.press(1,'KeyW');input.press(2,'KeyW');input.press(3,'use');
  input.release(1);assert.ok(input.has('KeyW'));
  input.clear();assert.ok(!input.has('KeyW')&&!input.has('use'));
});

test('keyboard activation is separate from pointer-generated clicks and disabled controls ignore touches',()=>{
  const input=createHeldPointers(),button=new Button();let enabled=false,activations=0;
  bindHoldButton(button as unknown as HTMLButtonElement,'use',input,()=>enabled,()=>activations++,()=>activations++);
  pointer(button,'pointerdown',1);assert.equal(activations,0);
  enabled=true;pointer(button,'pointerdown',1);
  button.dispatchEvent(Object.assign(new Event('click'),{detail:1}));assert.equal(activations,1,'A tap must not fire twice');
  button.dispatchEvent(Object.assign(new Event('click'),{detail:0}));assert.equal(activations,2);
});
