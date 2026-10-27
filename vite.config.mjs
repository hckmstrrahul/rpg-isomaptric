import {defineConfig} from 'vite';

// The manifest is also audited to prove inactive chapter code stays out of the
// selected world's static dependency graph.
export default defineConfig({build:{target:'es2022',manifest:true}});
