// Load first Wasm module
const { default: staticWasmModuleExport } = await import(
    './wasm/staticWasmModule.js'
);

// Initialize first Wasm module
const staticWasmModule = await staticWasmModuleExport();

const SIZEOF = new Object(null);
Object.defineProperties(SIZEOF, {
    CHAR: {
        value: 1,
        writable: false,
    },
    INT: {
        value: 4,
        writable: false,
    },
    DOUBLE: {
        value: 8,
        writable: false,
    },
});

const [cFunction1Btn, cFunction2Btn, cFunction3Btn, cFunction4Btn] =
    document.querySelectorAll('.functionBtn');

const outputTxtArea = document.querySelector('textarea');

// Call first C-function via "ccall"
cFunction1Btn.addEventListener('click', () => {
    const cFunction1RetVal = staticWasmModule.ccall(
        'cFunction1', // name of C function
        'number', // return type
        'number', // argument types
        [99.3] // arguments
    );

    printValues('C-function 1 return value:\n', cFunction1RetVal);
});

// Setup second C-function via "cwrap"
const cFunction2 = staticWasmModule.cwrap(
    'cFunction2',
    ['number'],
    ['number', 'string', 'array', 'number']
);

cFunction2Btn.addEventListener('click', () => {
    const typedArray = new Int8Array([127, -128, 0, 1, 0, -1, 0, 2, 0, -2]);

    const cFunction2RetVal = cFunction2(
        42,
        'Concatenated number: ',
        typedArray,
        typedArray.length
    );

    const cFunction2ReturnedString =
        staticWasmModule.UTF8ToString(cFunction2RetVal);

    printValues('C-function 2 modified string:\n', cFunction2ReturnedString);
});

cFunction3Btn.addEventListener('click', () => {
    const maxLength = 64;
    // Allocate memory in the Emscripten heap by directly calling the
    // exported malloc function
    const [stringPointer, arrayPointer] = [
        staticWasmModule._malloc(maxLength * SIZEOF.CHAR),
        staticWasmModule._malloc(maxLength * SIZEOF.INT),
    ];

    // Load the string into the Emscripten heap
    const string = 'Manual memory management!';
    staticWasmModule.stringToUTF8(string, stringPointer, maxLength);

    // Load the array into the Emscripten heap
    const array = new Int32Array([2 ** 31 - 1, -1 * 2 ** 31, -1, 0, 1]);
    staticWasmModule.HEAP32.set(
        array,
        pointerToOffset({ arrayPointer, sizeOfValue: 4 })
    );

    // Directly call third C-function without a wrapper
    staticWasmModule._cFunction3(84, stringPointer, arrayPointer, array.length);

    // Read the modified array values from the Emscripten heap
    const modifiedArray = staticWasmModule.HEAP32.slice(
        pointerToOffset({ arrayPointer, sizeOfValue: 4 }),
        pointerToOffset({ arrayPointer, sizeOfValue: 4 }) + array.length
    );
    printValues('C-function 3 modified array:\n', modifiedArray);

    // Free memory in the Emscripten heap by directly calling
    // the exported free function
    staticWasmModule._free(stringPointer);
    staticWasmModule._free(arrayPointer);
});

const cFunction4Obj = Object.create(null);

// Create the WebAssembly memory space for the Wasm module
Object.defineProperty(cFunction4Obj, 'memory', {
    value: new WebAssembly.Memory({ initial: 1, maximum: 10 }),
    writable: false,
});
// Create the WebAssembly tables for the Wasm module
Object.defineProperty(cFunction4Obj, 'table', {
    value: new WebAssembly.Table({
        initial: 1,
        maximum: 10,
        element: 'anyfunc',
    }),
    writable: false,
});

// Dynamically load and call fourth C-function
async function loadCFunction4() {
    try {
        // Setup the values to be imported into the
        // newly-created Instance, such as functions or
        // WebAssembly.Memory objects
        const imports = {
            env: {
                // Define any imported functions here
                cFunction4: () => {},
                // Define any imported memories here
                memory: cFunction4Obj.memory,
                // Define any imported tables here
                table: cFunction4Obj.table,
            },
        };

        // Prepare the fetch call
        const fetchPromise = fetch('wasm/dynamicWasmModule.wasm');

        // Instantiate streaming of the Wasm module
        const { instance: dynamicWasmModuleExort } =
            await WebAssembly.instantiateStreaming(fetchPromise, imports);

        // Store the exported function in the cFunction4 object
        Object.defineProperty(cFunction4Obj, 'func', {
            value: dynamicWasmModuleExort.exports.cFunction4,
            writable: false,
        });
    } catch (error) {
        console.log('Loading cFunction4 failed:\n', error);
    }
}

function callCFunction4() {
    const array = new Float64Array([1.0, -2.5, 2.533, 123456789.12345678]);

    // Load the array into the Webassembly heap
    const heapPtr = 0;
    const heapView = new Float64Array(cFunction4Obj.memory.buffer);
    heapView.set(array, heapPtr);

    cFunction4Obj.func(2, heapPtr, array.length);

    // Read the modified buffer values from the Webassembly heap
    const modifiedBuffer = cFunction4Obj.memory.buffer.slice(
        heapPtr,
        heapPtr + array.length * SIZEOF.DOUBLE
    );
    const modifiedArray = new Float64Array(modifiedBuffer);

    printValues('C-function 4 modified array:\n', modifiedArray);
}

cFunction4Btn.addEventListener(
    'click',
    async () => {
        await loadCFunction4();

        callCFunction4();

        // Add an event listener for only
        // calling the cFunction4 at the following
        // button clicks
        cFunction4Btn.addEventListener('click', callCFunction4);
    },
    {
        // Load the cFunction4 only once after
        // the first button click
        once: true,
    }
);

function printValues(...values) {
    let stringToAppend = '';

    if (values.length === 0) {
        stringToAppend += '--No Values--';
    } else {
        for (const value of values) {
            stringToAppend += String(value);
        }
    }

    stringToAppend += '\n\n';

    outputTxtArea.textContent += stringToAppend;

    outputTxtArea.scrollTop = outputTxtArea.scrollHeight;
}

function pointerToOffset({ arrayPointer = null, sizeOfValue = null }) {
    if (
        !arrayPointer ||
        !sizeOfValue ||
        (sizeOfValue !== 1 && sizeOfValue % 2)
    ) {
        throw new Error('In pointerToOffset(): invalid arguments');
    }

    return arrayPointer / sizeOfValue;
}
