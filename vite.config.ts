import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";
export default defineConfig({base:process.env.SITE_BASE_PATH||"/dorhamisaz-mt/",resolve:{alias:{"@":fileURLToPath(new URL(".",import.meta.url))}},esbuild:{jsx:"automatic"},build:{outDir:"dist",emptyOutDir:true}});
