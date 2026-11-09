import {build} from "esbuild";
await build({entryPoints:["api/index.ts"],bundle:true,format:"esm",target:"es2022",platform:"browser",external:["cloudflare:workers"],outfile:"cloudflare/worker.js"});
