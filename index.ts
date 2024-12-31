import * as Ui from './ui.ts'
import { initSync } from './rust/pkg/rust.js';

if (!globalThis.loaded) {
    globalThis.loaded = true;
    (async () => {
        fetch('./rust/pkg/rust_bg.wasm')
            .then((response) => response.arrayBuffer())
            .then((bytes) => initSync({ module: bytes }))
        
    })()
}

globalThis.Ui = Ui;
