// Patch to ensure globalThis.localStorage has no-op methods during server runtime
try {
  const ls = globalThis.localStorage;
  if (!ls || typeof ls.getItem !== 'function') {
    globalThis.localStorage = {
      getItem: function () { return null; },
      setItem: function () {},
      removeItem: function () {},
      clear: function () {},
    };
  }
} catch (e) {
  // ignore
}

// Debug: print Node execArgv and NODE_OPTIONS to help locate --localstorage-file
try {
  // eslint-disable-next-line no-console
  console.log('startup patch: process.execArgv=', process.execArgv);
  // eslint-disable-next-line no-console
  console.log('startup patch: process.argv=', process.argv.slice(0,5));
  // eslint-disable-next-line no-console
  console.log('startup patch: NODE_OPTIONS=', process.env.NODE_OPTIONS);
} catch (e) {}
