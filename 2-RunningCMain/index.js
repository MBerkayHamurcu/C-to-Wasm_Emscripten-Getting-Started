// Load the Wasm module
const { default: wasmModuleExport } = await import('./wasm/cMain.js');

// Initialize Wasm module
const wasmModule = await wasmModuleExport();

const runMainBtn = document.querySelector('.functionBtn');

runMainBtn.addEventListener('click', () => {
    // Run the main function
    wasmModule.callMain(['command line argument 1', 'command line argument 2']);
});
