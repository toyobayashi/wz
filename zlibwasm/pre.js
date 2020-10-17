/* eslint-disable */

(function (root, factory) {
  var _r = typeof __webpack_modules__ !== 'undefined'
    ? (typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : undefined)
    : (typeof require !== 'undefined' ? require : undefined)
  function makeESModule (m) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      try { Object.defineProperty(m, Symbol.toStringTag, { value: 'Module' }); } catch (_) {}
    }
    try { Object.defineProperty(m, '__esModule', { value: true });  } catch (_) { m.__esModule = true; }
    try { Object.defineProperty(m, 'default', { enumerable: true, value: m }); } catch (_) { m['default'] = m; }
    return m;
  }
  var name = 'zlibwasm';
  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = makeESModule(factory(_r));
  } else if(typeof define === 'function' && define.amd) {
    define(function () {
      return makeESModule(factory(_r));
    });
  } else if(typeof exports === 'object') {
    exports[name] = makeESModule(factory(_r));
  } else {
    root[name] = factory(_r);
  }
})((function (defaultValue) {
  var g;
  g = (function () { return this; })();

  try {
    g = g || new Function('return this')();
  } catch (_) {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof __webpack_modules__ === 'undefined') {
      if (typeof global !== 'undefined') return global;
    }
    if (typeof window !== 'undefined') return window;
    if (typeof self !== 'undefined') return self;
  }

  return g || defaultValue;
})(this), function (require) {