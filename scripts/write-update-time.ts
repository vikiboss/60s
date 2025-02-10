import fs from 'node:fs'
import pkg from '../package.json' with { type: 'json' }
import { Common } from '../src/common.ts'

pkg.updateTime = Common.localeTime()

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))
