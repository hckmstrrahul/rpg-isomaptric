import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCityMotion} from '../src/motion.ts';

test('pausing or changing the system motion preference freezes ambient time without a resume jump',()=>{
 const motion=createCityMotion();motion.tick(.03);assert.equal(motion.time,.03);
 motion.setEnabled(false);motion.tick(500);assert.equal(motion.time,.03);
 motion.setEnabled(true);motion.tick(.02);assert.equal(motion.time,.05);
 motion.setReduced(true);assert.equal(motion.playing,false);motion.tick(500);assert.equal(motion.time,.05);
 motion.setReduced(false);motion.tick(.05);assert.equal(motion.time,.1);
 motion.setEnabled(false);motion.setReduced(true);motion.setReduced(false);assert.equal(motion.playing,false,'System changes must preserve the user’s pause choice');
});
