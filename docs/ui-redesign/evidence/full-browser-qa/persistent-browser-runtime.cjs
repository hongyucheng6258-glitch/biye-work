const readline=require('node:readline');const vm=require('node:vm');
const sandbox={require,console,Buffer,process,setTimeout,clearTimeout,setInterval,clearInterval,URL,fetch};
sandbox.globalThis=sandbox;
const scope=vm.createContext(sandbox);
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let queue=Promise.resolve();
rl.on('line',line=>{queue=queue.then(async()=>{let cell;try{cell=JSON.parse(line);const result=await new vm.Script('(async()=>{'+cell.code+'\n})()', {filename:'browser-cell'}).runInContext(scope);console.log(JSON.stringify({cell:cell.id,status:'done',result:result??null}));}catch(error){console.log(JSON.stringify({cell:cell?.id,status:'error',message:error.message,stack:error.stack?.split('\n').slice(0,5)}));}});});
console.log('Persistent Playwright fallback runtime ready');
