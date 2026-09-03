import { describe, expect, it } from 'vitest';
import { TouchInput } from '../src/input/touch-input.js';

describe('TouchInput (spec §4 — touch to InputState)', () => {
  it('samples pressed exactly once for a press-and-release between ticks, alongside a live stick', () => {
    const input = new TouchInput({ stick: 'horizontal', deadZone: 0.2 });

    input.moveStick(0.9, 0);
    input.press('fire');
    input.release('fire');

    expect(input.sample()).toEqual({ x: 1, y: 0, buttons: { fire: { down: false, pressed: true } } });
    expect(input.sample()).toEqual({ x: 1, y: 0, buttons: { fire: { down: false, pressed: false } } });
  });

  it('a game with no stick always reads x:0, y:0 regardless of any stick calls', () => {
    const input = new TouchInput({ stick: null, deadZone: 0.2 });

    input.press('fire');

    expect(input.sample()).toEqual({ x: 0, y: 0, buttons: { fire: { down: true, pressed: true } } });
  });

  it('the stick and a button are independent: releasing one does not affect the other (spec §4.5)', () => {
    const input = new TouchInput({ stick: 'horizontal', deadZone: 0.2 });

    input.moveStick(-1, 0);
    input.press('fire');
    input.releaseStick();

    expect(input.sample()).toEqual({ x: 0, y: 0, buttons: { fire: { down: true, pressed: true } } });
  });

  it('reset discards touches and pending edges (spec §3: pausing forgets input)', () => {
    const input = new TouchInput({ stick: 'horizontal', deadZone: 0.2 });
    input.moveStick(1, 0);
    input.press('fire');

    input.reset();

    expect(input.sample()).toEqual({ x: 0, y: 0, buttons: {} });
  });
});
