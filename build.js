#!/usr/bin/env node

if (process.env.NODE) {
  process.env.EM_NODE_JS = process.env.NODE
}

const fs = require('fs')
const path = require('path')
const { spawn } = require('@tybys/cgen/bin/util/spawn.js')
const ts = require('@tybys/tsgo/lib/ts.js')
const { bundler } = require('@tybys/tsgo/lib/util.js')
const { readConfigNoCache } = require('@tybys/tsgo/lib/config.js')

function p (...args) {
  if (!args.length) return __dirname
  return path.isAbsolute(args[0]) ? path.join(...args) : path.join(__dirname, ...args)
}

function e (cmd) {
  return process.platform === 'win32' ? `${cmd}.cmd` : cmd
}

function mkdir (dir) {
  return fs.mkdirSync(dir, { recursive: true })
}

function cp (s, t) {
  mkdir(path.dirname(t))
  fs.copyFileSync(s, t)
}

async function invokeTSGO (command, config) {
  const r = await require(`@tybys/tsgo/command/${command}.js`).run(config)
  if (r !== 0) {
    throw new Error(`TSGO command failed: ${command}`)
  }
}

async function main () {
  const tsgoConfig = readConfigNoCache(p('./tsgo.config.js'))
  await invokeTSGO('lint', tsgoConfig)

  await spawn(e('npx'), ['cgen', 'rebuild', '-e'], path.join(__dirname, 'wasm'))
  const wasmoutdir = p('./wasm/.cgenbuild/Release')
  fs.copyFileSync(p(wasmoutdir, 'wz.js'), p('./src/util/wz.js'))
  mkdir(p('./lib/cjs-modern/util'))
  mkdir(p('./lib/esm-modern/util'))
  mkdir(p('./lib/esm/util'))
  cp(p(wasmoutdir, 'wz.wasm'), p('./lib/cjs-modern/util/wz.wasm'))
  cp(p(wasmoutdir, 'wz.wasm'), p('./lib/esm-modern/util/wz.wasm'))
  ts.compile(p('tsconfig.json'))
  ts.compile(p('tsconfig.modern.json'))

  const asm = p('./src/util/wz.js')
  cp(p(wasmoutdir, 'wzasm.js'), asm)
  fs.writeFileSync(asm, fs.readFileSync(asm, 'utf8').replace('wzasm.js.mem', 'wz.js.mem').replace('wzasm.wasm', 'wz.wasm'), 'utf8')
  ts.compile(p('tsconfig.esm.json'))
  cp(p(wasmoutdir, 'wzasm.js.mem'), p('./lib/esm/util/wz.js.mem'))

  await bundler.webpack(tsgoConfig)
  await bundler.webpack(readConfigNoCache(p('./tsgo.es5.config.js')))
  await invokeTSGO('dts', tsgoConfig)
  await invokeTSGO('doc', tsgoConfig)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
