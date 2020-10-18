#!/bin/bash

type="Release"

until [ $# -eq 0 ]
do
if [ "$1" == "Release" ]; then type="$1"; fi
if [ "$1" == "Debug" ]; then type="$1"; fi
shift
done

cd ./wasm
cmakeoutdir="./cmake_build"
mkdir -p $cmakeoutdir
cd $cmakeoutdir
cmake -DCMAKE_TOOLCHAIN_FILE="$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake" -DCMAKE_BUILD_TYPE="$type" -G "Unix Makefiles" ..
cmake --build .
cd ..

exename="wz"

cp -rpf "$cmakeoutdir/$exename.js" "../src/util/$exename.js"
mkdir -p ../lib/cjs-modern/util
mkdir -p ../lib/esm/util
mkdir -p ../lib/esm-modern/util
cp -rpf "$cmakeoutdir/$exename.js" "../lib/cjs-modern/util/$exename.js"
cp -rpf "$cmakeoutdir/$exename.js" "../lib/esm/util/$exename.js"
cp -rpf "$cmakeoutdir/$exename.js" "../lib/esm-modern/util/$exename.js"
cp -rpf "$cmakeoutdir/$exename.wasm" "../lib/cjs-modern/util/$exename.wasm"
cp -rpf "$cmakeoutdir/$exename.wasm" "../lib/esm/util/$exename.wasm"
cp -rpf "$cmakeoutdir/$exename.wasm" "../lib/esm-modern/util/$exename.wasm"
cd ..
