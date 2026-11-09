import {defineConfig} from 'vite';
import {readFileSync} from 'node:fs';

const loadingStyles=new URL('./styles/loading.css',import.meta.url);

// The manifest is also audited to prove inactive chapter code stays out of the
// selected world's static dependency graph.
export default defineConfig({
  plugins:[{
    name:'critical-loading-styles',
    transformIndexHtml:html=>html.replace('<!-- loading-styles -->',()=>`<style id="loading-styles">${readFileSync(loadingStyles,'utf8')}</style>`),
    handleHotUpdate({file,server}){if(file===loadingStyles.pathname)server.ws.send({type:'full-reload'});},
    configureServer(server){server.watcher.add(loadingStyles.pathname);},
  }],
  build:{target:'es2022',manifest:true},
});
