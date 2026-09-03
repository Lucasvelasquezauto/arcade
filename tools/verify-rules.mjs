// Prueba negativa: verifica que las reglas constitucionales MUERDEN.
// Criterio de aceptación 10 de docs/specs/walking-skeleton.md.
// Si este script pasa cuando no debería, la constitución es decorativa.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const checks = [
  {
    name: 'ESLint bloquea relojes, azar y DOM en la lógica pura (Art. 3.1–3.3)',
    cmd: 'pnpm',
    args: ['exec', 'eslint', '--no-ignore', 'tools/fixtures/packages/games/alpha/src/logic/impure.ts'],
    expect: ['no-restricted-globals', 'no-restricted-properties', 'no-restricted-syntax'],
  },
  {
    name: 'dependency-cruiser bloquea que un juego importe a otro (Art. 3.6)',
    cmd: 'pnpm',
    args: ['exec', 'depcruise', 'tools/fixtures/packages', '--config', 'tools/fixtures/.dependency-cruiser.cjs'],
    expect: ['game-to-game'],
  },
];

let failed = 0;
for (const check of checks) {
  let output = '';
  let exitCode = 0;
  try {
    const { stdout, stderr } = await run(check.cmd, check.args);
    output = stdout + stderr;
  } catch (err) {
    exitCode = err.code ?? 1;
    output = (err.stdout ?? '') + (err.stderr ?? '');
  }

  const missing = check.expect.filter((needle) => !output.includes(needle));
  if (exitCode === 0) {
    console.error(`FALLA: "${check.name}" — el chequeo pasó cuando debía fallar.`);
    failed++;
  } else if (missing.length > 0) {
    console.error(`FALLA: "${check.name}" — falló, pero sin reportar: ${missing.join(', ')}`);
    failed++;
  } else {
    console.log(`OK: ${check.name}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} regla(s) constitucional(es) no se están aplicando.`);
  process.exit(1);
}
console.log('\nLas reglas constitucionales muerden. Verificación negativa superada.');
