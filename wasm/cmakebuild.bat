@echo off

set mode=

:next-arg
if "%1"=="" goto args-done
if /i "%1"=="Debug"         set mode=Debug&goto arg-ok
if /i "%1"=="Release"       set mode=Release&goto arg-ok

:arg-ok
shift
goto next-arg

:args-done
if "%mode%" == "" set mode=Release

echo %mode%

set cmakeoutdir=.cgenbuild

if not exist %cmakeoutdir% mkdir %cmakeoutdir%
if "%mode%" == "Debug" (
  call npx.cmd cgen rebuild -e --debug
) else (
  call npx.cmd cgen rebuild -e
)
@REM cd %cmakeoutdir%
@REM cmake -DCMAKE_TOOLCHAIN_FILE=%EMSDK%\upstream\emscripten\cmake\Modules\Platform\Emscripten.cmake -DCMAKE_BUILD_TYPE=%mode% -G "MinGW Makefiles" -DCMAKE_MAKE_PROGRAM=make ..
@REM cmake --build .
@REM cd ..

set exename=wz

copy /Y %cmakeoutdir%\%exename%.js .\dist\%exename%.js
copy /Y %cmakeoutdir%\%exename%.js ..\src\util\%exename%.js
mkdir ..\lib\cjs-modern\util
mkdir ..\lib\esm\util
mkdir ..\lib\esm-modern\util
copy /Y %cmakeoutdir%\%exename%.js ..\lib\cjs-modern\util\%exename%.js
copy /Y %cmakeoutdir%\%exename%.js ..\lib\esm\util\%exename%.js
copy /Y %cmakeoutdir%\%exename%.js ..\lib\esm-modern\util\%exename%.js
copy /Y %cmakeoutdir%\%exename%.wasm .\dist\%exename%.wasm
copy /Y %cmakeoutdir%\%exename%.wasm ..\lib\cjs-modern\util\%exename%.wasm
copy /Y %cmakeoutdir%\%exename%.wasm ..\lib\esm\util\%exename%.wasm
copy /Y %cmakeoutdir%\%exename%.wasm ..\lib\esm-modern\util\%exename%.wasm
copy /Y %cmakeoutdir%\%exename%.wasm.map .\%exename%.wasm.map
