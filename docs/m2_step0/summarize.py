import json,hashlib,pathlib,subprocess,statistics
base=pathlib.Path('docs/m2_step0')
load=lambda name:json.loads((base/name).read_text())
launches=load('shader-repeats.json');assert len(launches)==15
keys={(t,f)for t in 'abcdefg' for f in ('RGBA16F','RGBA32F')}
for mode in ('preview','export','worker'):
 rows=[r for r in launches if r['mode']==mode];assert {r['repeat'] for r in rows}==set(range(5))
 for r in rows:assert {(s['test'],s['format'])for s in r['rows']}==keys
hashes={}
for key in sorted(keys):
 values={(r['floatHash'],r['byteHash'])for launch in launches for r in launch['rows'] if(r['test'],r['format'])==key}
 hashes['/'.join(key)]={'distinctHashPairs':len(values),'pairs':sorted(values)}
 assert len(values)==1, str(key)
sweep=load('capability-sweep.json');selected=sweep[1]
for mode,c in selected['modes'].items():
 assert c['webgl2'] and 'SwiftShader' in c['renderer']
 assert c['extensions']['EXT_color_buffer_float'] and c['targets']['RGBA16F']['complete']
 p=c['precision']['HIGH_FLOAT'];assert p['precision']>=23 and min(p['rangeMin'],p['rangeMax'])>=127
 assert c['precision']['HIGH_INT']['rangeMin']==31 and c['precision']['HIGH_INT']['rangeMax']==30
 assert c['limits']['MAX_TEXTURE_SIZE']>=4096 and all(c['contextLoss'].values())
 assert c['targets']['RGBA16F']['reads']['FLOAT']['error']==0
 assert c['targets']['RGBA8']['reads']['UNSIGNED_BYTE']['error']==0
 record={'status':'PASS','mode':mode,'version':selected['version'],'channel':selected['channel'],'args':selected['args'],'capabilities':c,'freshShaderLaunches':5,'crossHostExact':True,'shaderResults':'shader-repeats.json'}
 (base/f'gpu_caps.{mode}.json').write_text(json.dumps(record,indent=2)+'\n')
product=pathlib.Path('/root/projects/motion-suite-m2')
assert not subprocess.check_output(['git','status','--porcelain'],cwd=product,text=True)
assert not subprocess.check_output(['git','diff','b52aebd','--name-only','--','src','test','schemas','package.json','package-lock.json'],text=True)
assert '# pass 86' in (base/'foundry-tests.log').read_text()
assert '709 passed (709)' in (base/'product-vitest.log').read_text()
assert '52 frames · 0 failed' in (base/'product-golden.log').read_text()
config=json.dumps({'args':selected['args'],'version':selected['version'],'channel':selected['channel']},sort_keys=True,separators=(',',':'))
assets=[product/'tests/golden/assets/checker.png',product/'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2']
audit=load('runtime-audit.json');assert audit['continuousProbe']['x']==audit['continuousProbe']['spatial']==audit['continuousProbe']['expected']
result={'milestone':'M2.0','status':'PASS','implementationStatus':'BLOCKED','detail':'AWAITING_AUTHORIZATION','productSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=product,text=True).strip(),'productClean':True,'frozenM0M1Unchanged':True,'foundryTests':86,'productTests':709,'goldenFrames':52,'goldenFailures':0,'freshLaunchesPerHost':5,'hosts':3,'resolution':[1080,1920],'shaderCasesPerLaunch':14,'hashPairs':hashes,'probeConfigSha256':hashlib.sha256(config.encode()).hexdigest(),'assets':{str(p.relative_to(product)):hashlib.sha256(p.read_bytes()).hexdigest()for p in assets},'cpuLitColdMs':audit['coldMs'],'cpuLitWarmMedianMs':statistics.median(audit['warmMs']),'realGpu':'NOT_RUN'}
(base/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='hashPairs'},indent=2))
