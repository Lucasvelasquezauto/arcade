// Prueba negativa: verifica que las reglas constitucionales MUERDEN.
// Criterio de aceptación 10 de docs/specs/walking-skeleton.md.
// Si este script pasa cuando no debería, la constitución es decorativa.
//
// Usa las APIs de Node de ESLint y dependency-cruiser en lugar de lanzar
// procesos hijos ('pnpm exec eslint …'). Hacerlo por proceso hijo dependía de
// cómo se pudiera invocar `pnpm` en cada máquina — en Windows es un shim
// .cmd que Node no puede ejecutar sin pasar por una shell — y de cómo
// estuviera instalado. Llamando a las librerías directamente el script corre
// igual en Windows, macOS y Linux, sin depender de ningún binario externo.
// No lo "simplifiques" de vuelta a child_process: por eso existe.
import { ESLint } from 'eslint';
import { cruise } from 'dependency-cruiser';

const fixtureDepCruiserConfig = (await import('./fixtures/.dependency-cruiser.cjs')).default;

const checks = [
  {
    name: 'ESLint bloquea relojes, azar y DOM en la lógica pura (Art. 3.1–3.3)',
    expect: ['no-restricted-globals', 'no-restricted-properties', 'no-restricted-syntax'],
    async run() {
      const eslint = new ESLint({ ignore: false });
      const results = await eslint.lintFiles([
        'tools/fixtures/packages/games/alpha/src/logic/impure.ts',
      ]);
      const found = results.flatMap((result) => result.messages.map((message) => message.ruleId));
      const errorCount = results.reduce((total, result) => total + result.errorCount, 0);
      return { failed: errorCount > 0, found };
    },
  },
  {
    name: 'dependency-cruiser bloquea que un juego importe a otro (Art. 3.6)',
    expect: ['game-to-game'],
    async run() {
      const { output } = await cruise(['tools/fixtures/packages'], {
        validate: true,
        ruleSet: { forbidden: fixtureDepCruiserConfig.forbidden },
        doNotFollow: fixtureDepCruiserConfig.options.doNotFollow,
        tsPreCompilationDeps: fixtureDepCruiserConfig.options.tsPreCompilationDeps,
        exclude: fixtureDepCruiserConfig.options.exclude,
      });
      const found = output.summary.violations.map((violation) => violation.rule.name);
      return { failed: output.summary.error > 0, found };
    },
  },
];

let failed = 0;
for (const check of checks) {
  const { failed: didFail, found } = await check.run();
  const missing = check.expect.filter((needle) => !found.includes(needle));

  if (!didFail) {
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
