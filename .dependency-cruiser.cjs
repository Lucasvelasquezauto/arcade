const { buildForbidden, options } = require('./tools/dep-rules.cjs');
module.exports = { forbidden: buildForbidden(''), options };
