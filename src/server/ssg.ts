import fs from 'fs'
import got from 'got'
import { join, resolve } from 'path'
import { URL } from 'url'

import { normalizePagePath } from './lib/utils'

const context = process.cwd()

interface Options {
  url: string
  routers: string[]
  output?: string
}

export default (options: Options) => {
  const { url, routers, output = 'ssg' } = options

  const ssgDir = resolve(context, output)

  if (!fs.existsSync(ssgDir)) {
    fs.mkdirSync(ssgDir)
  }

  for (const router of routers) {
    got(new URL(router, url))
      .then(res => {
        const data = res.body
        const name = `${normalizePagePath(router)}.html`
        fs.writeFileSync(join(ssgDir, name), data)
      })
      .catch(error => {
        console.log(error)
      })
  }
}
