import type { TestPatternState } from './state.js';

export function snapshot(state: TestPatternState): string {
  return JSON.stringify(state);
}

export function restore(data: string): TestPatternState {
  return JSON.parse(data) as TestPatternState;
}
