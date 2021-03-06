#!/bin/bash

type="Release"

until [ $# -eq 0 ]
do
if [ "$1" == "Release" ]; then type="$1"; fi
if [ "$1" == "Debug" ]; then type="$1"; fi
shift
done

cd ./wasm
cmakeoutdir="./.cgenbuild"
mkdir -p $cmakeoutdir
# cd $cmakeoutdir
# cmake -DCMAKE_TOOLCHAIN_FILE="$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake" -DCMAKE_BUILD_TYPE="$type" -G "Unix Makefiles" ..
# cmake --build .
# cd ..
if [ "$type" == "Debug" ]; then npx cgen rebuild -e --debug; else npx cgen rebuild -e; fi

exename="wz"

cp -rpf "$cmakeoutdir/$exename.js" "../src/util/$exename.js"
mkdir -p ../lib/cjs-modern/util
mkdir -p ../lib/esm/util
mkdir -p ../lib/esm-modern/util
cp -rpf "$cmakeoutdir/$exename.js" "../lib/cjs-modern/util/$exename.js"
node -e "\"require('fs').writeFileSync('./.cgenbuild/"$exename"asm.js', require('fs').readFileSync('./.cgenbuild/"$exename"asm.js', 'utf8').replace('"$exename"asm.js.mem', '"$exename".js.mem').replace('"$exename"asm.wasm', '"$exename".wasm'), 'utf8')\""
cp -rpf "$cmakeoutdir/"$exename"asm.js" "../lib/esm/util/$exename.js"
cp -rpf "$cmakeoutdir/$exename.js" "../lib/esm-modern/util/$exename.js"
cp -rpf "$cmakeoutdir/$exename.wasm" "../lib/cjs-modern/util/$exename.wasm"
cp -rpf "$cmakeoutdir/"$exename"asm.js.mem" "../lib/esm/util/$exename.js.mem"
cp -rpf "$cmakeoutdir/"$exename"asm.wasm" "../lib/esm/util/$exename.wasm"
cp -rpf "$cmakeoutdir/$exename.wasm" "../lib/esm-modern/util/$exename.wasm"
cd ..
