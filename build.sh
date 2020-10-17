#!/bin/bash

type="Release"

until [ $# -eq 0 ]
do
if [ "$1" == "Release" ]; then type="$1"; fi
if [ "$1" == "Debug" ]; then type="$1"; fi
shift
done

cd ./zlibwasm
cmakeoutdir="./cmake_build"
mkdir -p $cmakeoutdir
cd $cmakeoutdir
cmake -DCMAKE_TOOLCHAIN_FILE="$EMSDK/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake" -DCMAKE_BUILD_TYPE="$type" -G "Unix Makefiles" ..
cmake --build .
cd ..

cp -rpf $cmakeoutdir/zlibwasm.js ../src/util/zlibwasm.js
mkdir -p ../lib/cjs-modern/util
cp -rpf $cmakeoutdir/zlibwasm.js ../lib/cjs-modern/util/zlibwasm.js
cp -rpf $cmakeoutdir/zlibwasm.wasm ../lib/cjs-modern/util/zlibwasm.wasm
cd ..
