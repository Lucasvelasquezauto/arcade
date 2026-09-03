// Config espejo para la prueba negativa: mismas reglas, otra raíz.
const { buildForbidden, options } = require('../dep-rules.cjs');
module.exports = { forbidden: buildForbidden('tools/fixtures/'), options };
