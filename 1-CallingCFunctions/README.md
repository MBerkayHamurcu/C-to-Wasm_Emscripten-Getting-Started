# Calling C-Functions from JavaScript

**This directory contains different ways for calling functions defined and declared in your C program from JavaScript**

------

## Directory contents

This directory "1-CallingCFunctions" contains an index.html, index.js and a style.css file in addition to this README.md. These form the demonstration website and contain the interactive interface to the Wasm modules. The compiled Wasm modules for the demonstration are also already stored in the directory "wasm". After the Node.js web server is running as described in the previous directory "0-Setup", the demonstration website can be accessed via the URL `http://localhost:7071`, which looks like this:

![Calling C-functions demonstration website](../images/1-CallingCFunctionsWebsite.png)

Now you can test the different C functions for correct integration via the four buttons and start to examine the JavaScript<->Wasm interface (index.js), the C files in the "src" directory and the Makefile used for compiling the C files to the Wasm modules. The following sections describe this interface in more detail and should be used for assistance.



## Loading the static Wasm module

First the statically imported modules have to be loaded. This is programmed in the following way to show that such an import could also be executed and instantiated only in response to an event. An exemplary scenario would be the execution of computationally intensive operations in a Wasm module as a reaction to a certain event. This means that modules or Wasm modules do not have to be loaded right when the web page is called.

```javascript
// Load first Wasm module
const { default: staticWasmModuleExport } = await import(
    './wasm/staticWasmModule.js'
);

// Initialize first Wasm module
const staticWasmModule = await staticWasmModuleExport();
```



## The "ccall" and "cwrap" methods (C-function 1 and 2)

"ccall() calls a compiled C function with specified parameters and returns the result, while cwrap() “wraps” a compiled C function and returns a JavaScript function you can call normally. cwrap() is therefore more useful if you plan to call a compiled function a number of times."

"The first parameter is the name of the function to be wrapped, the second is the return type of the function (or a JavaScript null value if there isn’t one), and the third is an array of parameter types (which may be omitted if there are no parameters). The types are “**number**” (for a JavaScript number corresponding to a C integer, float, or general pointer), “**string**” (for a JavaScript string that corresponds to a C `char*` that represents a string) or “**array**” (for a JavaScript array or typed array that corresponds to a C array; for typed arrays, it must be a Uint8Array or Int8Array)." - [Emscripten Documentation - ccall and cwrap](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#calling-compiled-c-functions-from-javascript-using-ccall-cwrap)

The following code is a sample for using the `ccall` Emscripten runtime method.

```javascript
// Call first C-function via "ccall"
cFunction1Btn.addEventListener('click', () => {
    const cFunction1RetVal = staticWasmModule.ccall(
        'cFunction1', // name of C function
        'number',     // return type
        'number',     // argument types
        [99.3]        // arguments
    );

    printValues('C-function 1 return value:\n', cFunction1RetVal);
});
```

In the next example the Emscripten runtime method `cwrap` is used. It returns a function that can be handled like a normal JavaScript function. The example uses the `cFunction2` variable to store that function. There is no fourth argument for `cwrap` as the targeted C-function call with its arguments will happen afterwards.

`cFunction2` also demonstrates the simplest method for using the other two supported data types, the array and the string.

```javascript
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

    const cFunction2ReturnedString = staticWasmModule.UTF8ToString(cFunction2RetVal);

    printValues('C-function 2 modified string:\n', cFunction2ReturnedString);
});
```



## Calling a C-function "directly" without a wrapper (C-function 3)

"Functions in the original source become JavaScript functions, so you can call them directly if you do type translations yourself — this will be faster than using `ccall` or `cwrap`, but a little more complicated." - [Emscripten Documentation - direct function calls](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-direct-function-calls)

This is my preferred method since an unrestricted interaction with the Emscripten heap can be done. "The Emscripten memory representation uses a typed array buffer (ArrayBuffer) to represent memory, with different views into it giving access to the different types. The views for accessing different types of memory are listed below. HEAP8, HEAP16, HEAP32, HEAPU8, HEAPU16, HEAPU32, HEAPF32, HEAPF64" - [Emscripten Documentation - preamble](https://emscripten.org/docs/api_reference/preamble.js.html). Calling the `set`() method of the TypedArray prototype on this ArrayBuffer with the `array` to be written as the first argument an the target offset/address as the second argument, the  `array` can be loaded into the Emscripten heap. The only thing to consider is converting the pointers to the correct type for the current operation. The following section at line 17 shows such an adjustment. The pointer returned by the `_malloc()` function contains the byte offset of the allocated space in memory. Due to the fact that we want to `set()` 32-bit values (`HEAP32`) in memory, the byte offset of `arrayPointer` has to be converted into a 32-bit offset, effectively dividing the `arrayPointer` by 4.

```javascript
cFunction3Btn.addEventListener('click', () => {
    const maxLength = 64;
    // Allocate memory in the Emscripten heap by directly calling the exported malloc function
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

    // Free memory in the Emscripten heap by directly calling the exported free function
    staticWasmModule._free(stringPointer);
    staticWasmModule._free(arrayPointer);
});

function pointerToOffset({ arrayPointer = null, sizeOfTarget = null }) {
    if (
        !arrayPointer ||
        !sizeOfTarget ||
        (sizeOfTarget !== 1 && sizeOfTarget % 2)
    ) {
        throw new Error('In pointerToOffset(): invalid arguments');
    }

    return arrayPointer / sizeOfTarget;
}
```



## Dynamically loading a C-function  (C-function 4)

The goal of this function is to demonstrate the method of dynamic loading, i.e. loading during runtime via the fetch API of a Wasm module and the use of a self-configured Wasm runtime environment instead of the one provided by emscripten. Emscripten is now only used for compiling the C-function to WebAssembly and does not generate JavaScript code that sets up the WebAssembly environment for running the compiled module. Accordingly, no task is now taken over by the compiler and all settings must be made manually. The advantages of this are the possibly significantly smaller size of the Wasm module, the compilation of the Wasm module during the transfer and the omission of the so called JavaScript glue code as for instance `staticWasmModule.js` is.

Here, the usual settings when using the fetch API must be observed, such as coordinating CORS with the server. In addition, the MIME type of the Wasm module must also be marked as such (Content-Type: application/wasm) and sent by the server so that the browser can start compiling it during transmission (`instantiateStreaming`).

```javascript
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
```



## Modifying a C-function

To make a change to a C function and recompile the corresponding Wasm module, you can execute the following steps. You can find the C functions under the "src" path.

1. Modify a C-function and save the changes. For example by changing the `increaseValue` in "src/staticWasmModule.c"

  ```C
  double cFunction1(double jsArgument)
  {
  	static double increaseValue = 2;
  
  	++increaseValue;
  
  	return jsArgument + increaseValue;
  }
  ```

2. Recompile the according Wasm module using the Makefile. In this case the modified module is the static Wasm module: `make staticWasmModule`. If you have set up the docker containers you can access the compiler environment via `docker attach <container ID>` and run the make command after that.

3. The new Wasm module is in this case stored in the "1-CallingCFunctions/wasm" directory and will be loaded after reloading the demonstration Website on `http://localhost:7071`. Running the modified C function via the website, if these steps have been performed correctly, will load the new Wasm module and allow the changes to become visible.





For demonstration purposes and keeping it as simple as possible the program is not split into further modules and contains some repetitions. It is advised not to adopt these traits in production environments.

By now you should know how to import and execute individual C-functions from WebAssembly modules. The following directory demonstrates the execution of a C-program respectively the `main` function with all its used modules, functions and imports.