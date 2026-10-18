import {spawnSync} from 'node:child_process';
for(const test of ['security-regression','device-privacy','food-portions','packaged-foods','storage-growth','recovery','operations','release-assets']){const result=spawnSync(process.execPath,['tests/'+test+'.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
