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
  var _process = root && root.process;
  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = makeESModule(factory(require('@tybys/native-require').tryGetRequireFunction(), _process));
  } else if(typeof define === 'function' && define.amd) {
    define(['@tybys/native-require'], function (nr) {
      return makeESModule(factory(nr.tryGetRequireFunction(), _process));
    });
  } else if(typeof exports === 'object') {
    exports[name] = makeESModule(factory(require('@tybys/native-require').tryGetRequireFunction(), _process));
  } else {
    root[name] = factory(nr.tryGetRequireFunction(), _process);
  }
})((function (defaultValue) {
  var g;
  g = (function () { return this; })();

  try {
    g = g || new Function('return this')();
  } catch (_) {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof __webpack_public_path__ === 'undefined') {
      if (typeof global !== 'undefined') return global;
    }
    if (typeof window !== 'undefined') return window;
    if (typeof self !== 'undefined') return self;
  }

  return g || defaultValue;
})(this), function (require, process) {
  if (typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string") {
    return (function () {
      var mod = {};
      return {
        init: function () {
          return Promise.resolve(mod);
        },
        mod: mod
      };
    })();
  }