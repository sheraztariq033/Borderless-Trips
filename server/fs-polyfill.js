// fs-polyfill.js
// Unconditionally overrides fs.stat and fs.statSync to prevent edge runtime crashes inside pgpass/pg

const mockStatSync = function() {
  const err = new Error("ENOENT: no such file or directory");
  err.code = "ENOENT";
  throw err;
};

const mockStat = function(path, cb) {
  const err = new Error("ENOENT: no such file or directory");
  err.code = "ENOENT";
  if (typeof cb === 'function') cb(err);
};

// Apply to node:fs module
try {
  const fsNode = require('node:fs');
  fsNode.statSync = mockStatSync;
  fsNode.stat = mockStat;
} catch (e) {
  // Silent fallback
}

// Apply to legacy fs module
try {
  const fsLegacy = require('fs');
  fsLegacy.statSync = mockStatSync;
  fsLegacy.stat = mockStat;
} catch (e) {
  // Silent fallback
}
