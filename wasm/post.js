var _modulePromise = new Promise(function(resolve, reject) {
  var onAbort = Module.onAbort;
  Module.onAbort = function (message) {
    Module.onAbort = onAbort;
    reject(new Error(message));
  };
  Module.onRuntimeInitialized = function () {
    Module.onAbort = onAbort;
    resolve(Module);
  };
});
return {
  init: function () {
    return _modulePromise;
  },
  mod: Module
};
});