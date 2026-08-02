import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
const files=[]
const walk=d=>{for(const n of readdirSync(d)){const f=join(d,n); if(statSync(f).isDirectory())walk(f); else if(/\.tsx?$/.test(f))files.push(f)}}
walk('src')
const writes=new Set(), reads=new Set()
for(const f of files){
  const s=readFileSync(f,'utf8')
  // event effect writes
  for(const m of s.matchAll(/type:\s*'flag(?:\.add)?',\s*flag:\s*'([^']+)'/g)) writes.add(m[1])
  for(const m of s.matchAll(/\bflag:\s*'([^']+)'/g)) writes.add(m[1])
  // quest declarative fields
  for(const key of ['startFlags','completionFlags','failureFlags','clearFlagsOnComplete','clearFlagsOnFail']){
    for(const m of s.matchAll(new RegExp(key+"\\s*:\\s*\\[([^\\]]*)\\]",'g')))
      for(const q of m[1].matchAll(/'([^']+)'/g)) writes.add(q[1])
  }
  for(const m of s.matchAll(/rewardFlag:\s*'([^']+)'/g)) writes.add(m[1])
  // reads
  for(const m of s.matchAll(/(?:activeStoryFlags[^\n]{0,60}?|storyFlagNotSet\(|hasStateItem\([^,]*activeStoryFlags,\s*)'([a-z_0-9]+)'/g)) reads.add(m[1])
  for(const m of s.matchAll(/storyFlagNotSet\('([^']+)'\)/g)) reads.add(m[1])
  for(const m of s.matchAll(/activeStoryFlagsSet\.has\(\s*'([^']+)'/g)) reads.add(m[1])
  for(const m of s.matchAll(/activeStoryFlags\??\.includes\(\s*'([^']+)'/g)) reads.add(m[1])
}
console.log('WRITES', [...writes].sort())
console.log('READS', [...reads].sort())
console.log('READ-ONLY (orphans)', [...reads].filter(r=>!writes.has(r)))
