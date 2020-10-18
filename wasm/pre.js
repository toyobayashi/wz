/* eslint-disable */

(function (root, factory) {
  function makeESModule (m) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      try { Object.defineProperty(m, Symbol.toStringTag, { value: 'Module' }); } catch (_) {}
    }
    try { Object.defineProperty(m, '__esModule', { value: true });  } catch (_) { m.__esModule = true; }
    try { Object.defineProperty(m, 'default', { enumerable: true, value: m }); } catch (_) { m['default'] = m; }
    return m;
  }
  var name = 'wzWasm';
  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = makeESModule(factory(require('@tybys/native-require').tryGetRequireFunction()));
  } else if(typeof define === 'function' && define.amd) {
    define(['@tybys/native-require'], function (nr) {
      return makeESModule(factory(nr.tryGetRequireFunction()));
    });
  } else if(typeof exports === 'object') {
    exports[name] = makeESModule(factory(require('@tybys/native-require').tryGetRequireFunction()));
  } else {
    root[name] = factory(nr.tryGetRequireFunction());
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