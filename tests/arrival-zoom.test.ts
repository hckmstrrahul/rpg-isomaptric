import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createArrivalZoom} from '../src/arrivalZoom.ts';

test('desktop and compact arrivals pause, zoom steadily into the explorer, and settle once',()=>{
  for(const [from,to]of [[1,6],[1.8,8]]){
    const arrival=createArrivalZoom(from,to);let previous=from,firstStep=0,lastStep=0;
    for(let frame=1;frame<=280;frame++){
      const value=arrival.tick(1/60);if(value===null)continue;
      if(frame<=26)assert.equal(value,from,'The city is visible briefly before zooming');
      assert.ok(value>=previous&&value<=to,'No zoom reversal or overshoot');
      if(frame===28)firstStep=value-previous;
      if(value===to)lastStep=value-previous;
      previous=value;
    }
    assert.equal(previous,to);assert.equal(arrival.active,false);assert.equal(arrival.tick(1),null);
    assert.ok(firstStep<.01&&lastStep<.01,'Both ends settle gently');
  }
});

test('camera input cancels arrival permanently and reduced motion uses the final framing immediately',()=>{
  const arrival=createArrivalZoom(1,6);
  for(let i=0;i<30;i++)arrival.tick(.05);
  arrival.cancel();assert.equal(arrival.tick(.05),null);assert.equal(arrival.tick(100),null);
  const reduced=createArrivalZoom(1.8,8,true);assert.equal(reduced.tick(0),8);assert.equal(reduced.active,false);
  const changing=createArrivalZoom(1,6);changing.tick(.05);changing.setReduced(true);
  assert.equal(changing.tick(0),6);assert.equal(changing.tick(.05),null);
});
