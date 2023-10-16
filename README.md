# Compiling C to WebAssembly

**A getting started for compiling C programs into browser executable WebAssembly using the Emscripten compiler**

------

## What is WebAssembly

"WebAssembly (abbreviated *Wasm*) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications." - [WebAssembly.org](https://webassembly.org/)

"WebAssembly is a new type of code that can be run in modern web browsers — it is a low-level assembly-like language with a compact binary format that runs with near-native performance and provides languages such as C/C++, C# and Rust with a compilation target so that they can run on the web. It is also designed to run alongside JavaScript, allowing both to work together." - [MDN (mozilla.org)](https://developer.mozilla.org/en-US/docs/WebAssembly)



## What is Emscripten

"Emscripten is a complete open source compiler toolchain for WebAssembly. It allows compiling C and C++ code or any other language that uses LLVM into WebAssembly. Practically any portable C or C++ codebase can be compiled into WebAssembly using Emscripten, ranging from high-performance games that need to render graphics, play sounds, and load and process files, through to application frameworks like Qt." - [Emscripten.org - About Emscripten](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html#about-emscripten-porting-code)

However, there are some types of code that are not portable or are more difficult to port. "For example, code based on a big-endian architecture cannot be compiled because the code compiled by Emscripten currently requires a little-endian host to run." - [Emscripten.org - Portability guidelines](https://emscripten.org/docs/porting/guidelines/portability_guidelines.html)

"There are also some limitations related to the API. The browser environment and JavaScript are different from the native environments that C and C++ typically run in. These differences impose some limitations on how native APIs can be called and used." - [Emscripten.org - API limitations](https://emscripten.org/docs/porting/guidelines/api_limitations.html#other-apis)

There are many examples of software that has been ported to WebAssembly via Emscripten. These include the Unity, Godot, and Unreal Engine 4 game engines, among others. - [GitHub.com - Porting Examples and Demos](https://github.com/emscripten-core/emscripten/wiki/Porting-Examples-and-Demos)

In summary, Emscripten is a powerful tool that allows C/C++ code to be compiled efficiently into WebAssembly. Despite some limitations and differences from the native environment, developers can use Emscripten to optimize and deploy their applications to the web.



## Wasm browser compatibility

At the time of writing (08.15.2023), Wasm is supported by almost all browsers and will be accessible to over 95% of web users -  ["WASM" | Can I use](https://caniuse.com/?search=WASM). Depending on the Wasm runtime you have chosen, you may need to check for missing support for certain Wasm features -  [Roadmap - WebAssembly](https://webassembly.org/roadmap/). You can use a tool like [wasm-feature-detect - npmjs.com](https://www.npmjs.com/package/wasm-feature-detect) to check if the browser supports a specific feature at runtime, and provide a fallback or alternative code path if it does not.

Wasm modules are limited to a size of 4 KB in the Chrome browser **if** they are not loaded correctly, i.e. if the main thread is blocked by a synchronous instantiation of the module - [Loading WebAssembly modules efficiently](https://web.dev/loading-wasm/). This restriction will not occur with the instantiation methods used in this guide.



## Security considerations when using Wasm

"The security model of WebAssembly has two important goals:

1. protect users from buggy or malicious modules
2. provide developers with useful primitives and mitigations for developing safe applications, within the constraints of 1.

Each WebAssembly module executes within a sandboxed environment separated from the host runtime using fault isolation techniques. This implies that applications execute independently and can’t escape the sandbox without going through appropriate APIs. Additionally, each module is subject to the security policies of its embedding. Within a web browser, this includes restrictions on information flow through same-origin policy.

The design of WebAssembly promotes safe programs by eliminating dangerous features from its execution semantics while maintaining compatibility with programs written for C/C++. Modules must declare all accessible functions and their associated types at load time, even when dynamic linking is used. This allows implicit enforcement of control-flow integrity (CFI) through structured control-flow. Since compiled code is immutable and not observable at runtime, WebAssembly programs are protected from control flow hijacking attacks."

[webassembly.org - security](https://webassembly.org/docs/security/)

"However, it is important to note that WASM itself is not protected. The security model of WASM is not about who can use the WASM binary but what the binary can do independent from who is executing it. This is achieved by executing the binary in a restrictive execution environment (sandbox)" - [security.stackexchange.com](https://security.stackexchange.com/questions/267570/how-secure-is-it-to-implement-most-of-the-applications-functionality-using-wasm). "It is also not safe to store client secrets in WASM for scenarios where an attacker could find a fixed salt by reverse engineering the binary" - [stackoverflow.com](https://stackoverflow.com/questions/56506468/is-wasm-safe-to-store-client-side-secrets).



## C to Wasm architecture

The following figure shows the abstract or rough architecture of this project. Starting with the Local file system, this contains at the beginning the JavaScript and the C program with all their modules. The correct execution of the Emscripten C compiler (emcc), for example using the Makefile located in this repository, creates a *.wasm* file. When the corresponding website is called in the browser, it loads the JavaScript file after HTML parsing and interpreting has been performed. Using the so-called Wasm glue code, a JS file that ensures the creation of a correct WebAssembly runtime environment and is output by emcc, the *.wasm* file is loaded and is then ready for execution. The exchange of data between the JavaScript and a Wasm module takes place via the memory in the runtime environment of the corresponding Wasm module.

![cToWasmArchitecture](./images/cToWasmArchitecture.drawio.svg)



## Contents of the following directories

Depending on your Wasm use case the Emscripten compiler arguments and the JavaScript interface setup differ. The use cases covered are each demonstrated in a separate directory.

Directory zero describes the process of setting up the development environment including Node.js and the Emscripten compiler. In case you do not want to install the environment on your local machine you can use the Docker composition which provides web servers for testing the project as well as the full-featured Emscripten compiler via console access. Bind mounting allows the container to access the files in the directory from which the container was started and thus compile C-files from the local machine and store the result on it.



## Makefile

The Makefile is provided to learn from the project when to use which emcc compiler arguments and what they do. The many `CFLAGS` are listed in spite of their mostly missing deviation from the default settings, in order to draw attention to the different options. The list of possible compiler arguments and their description can be found via the hyperlink under the following section.



## Useful links and resources

- [WebAssembly.org](https://webassembly.org/), [WebAssembly.org - docs](https://webassembly.org/docs/faq/)
- [Emscripten Documentation - Compiling and Running Projects](https://emscripten.org/docs/compiling/index.html)
- [Emscripten compiler arguments](https://emsettings.surma.technology/)
- [Emscripten.org - API reference](https://emscripten.org/docs/api_reference/index.html)
- [GitHub.com - mbasso/awesome-wasm: Curated list of awesome things regarding Wasm ecosystem](https://github.com/mbasso/awesome-wasm#general-resources)
- [The Atomic Waltz: Unraveling WebAssembly Issues in V8 and SpiderMonkey](https://blog.stackblitz.com/posts/the-atomic-waltz). The Browser engines *[SpiderMonkey](https://spidermonkey.dev/)*, *[V8](https://v8.dev/)* and *[JavaScriptCore](https://trac.webkit.org/wiki/JavaScriptCore)* use a dynamic tier-up compiler. Due to this fact, functions can be called several times in advance with the same argument types, which triggers the so-called "warm-up" process for the affected function. By this procedure with an actually needed function call the "Turbofan" compiled code will be executed, which possibly runs considerably faster.
- [Loading WebAssembly modules efficiently](https://web.dev/articles/loading-wasm)