# Running C-`main` from JavaScript

**This directory contains an example on how to run a c-program from JavaScript**

------

`cMain.c` is a very basic program which could be extended with more advanced functionalities supported by Wasm, for example a Qt, WebGL or SDL integration. Nevertheless you can see how the `main` function can be called via the Emscripten runtime method `callMain()` with arbitrary arguments. To enable data exchange between JavaScript and the Wasm module, the reader is referred to the `1-CallingCFunctions` directory.

```javascript
// Load the Wasm module
const { default: wasmModuleExport } = await import('./wasm/cMain.js');

// Initialize Wasm module
const wasmModule = await wasmModuleExport();

const runMainBtn = document.querySelector('.functionBtn');

runMainBtn.addEventListener('click', () => {
    // Run the main function
    wasmModule.callMain(['command line argument 1', 'command line argument 2']);
});
```