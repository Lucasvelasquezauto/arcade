// Fuente única de las fronteras del Artículo 3. La usan tanto el chequeo real
// como el de fixtures, para que la prueba negativa no pueda quedar desalineada.
function buildForbidden(prefix) {
  const p = prefix ?? '';
  return [
    {
      name: 'game-to-game',
      severity: 'error',
      comment: 'Art. 3.6 — ningún juego importa código de otro juego, nunca.',
      from: { path: `^${p}packages/games/([^/]+)/` },
      to: { path: `^${p}packages/games/([^/]+)/`, pathNot: `^${p}packages/games/$1/` },
    },
    {
      name: 'game-to-core-or-shell',
      severity: 'error',
      comment: 'Art. 3.4 — un juego solo depende de @arcade/contracts.',
      from: { path: `^${p}packages/games/` },
      to: { path: `^${p}packages/(core|shell|catalog)/` },
    },
    {
      name: 'core-to-game',
      severity: 'error',
      comment: 'Art. 3.8 — el núcleo no conoce a los juegos.',
      from: { path: `^${p}packages/core/` },
      to: { path: `^${p}packages/games/` },
    },
    {
      name: 'shell-to-game',
      severity: 'error',
      comment: 'Art. 3.8 — el shell no conoce a los juegos.',
      from: { path: `^${p}packages/shell/` },
      to: { path: `^${p}packages/games/` },
    },
    {
      name: 'contracts-depends-on-nothing',
      severity: 'error',
      comment: 'contracts es la base del grafo: no depende de ningún otro paquete.',
      from: { path: `^${p}packages/contracts/` },
      to: { path: `^${p}(packages|apps)/`, pathNot: `^${p}packages/contracts/` },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Art. 3.4 — dependencias en una sola dirección.',
      from: {},
      to: { circular: true },
    },
  ];
}
const options = {
  doNotFollow: { path: 'node_modules' },
  tsPreCompilationDeps: true,
  exclude: { path: '(node_modules|dist|/test/|\\.test\\.ts$)' },
};
module.exports = { buildForbidden, options };
