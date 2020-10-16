cmake_minimum_required(VERSION 3.6)

project(zlibwasm)

set(EXE_NAME zlibwasm)

set(LIB_SOURCE_FILES
  src/main.cpp
)

add_executable(${EXE_NAME} ${LIB_SOURCE_FILES})

target_link_options(${EXE_NAME} PRIVATE --bind -sALLOW_MEMORY_GROWTH=1 --extern-pre-js ${CMAKE_CURRENT_SOURCE_DIR}/pre.js --extern-post-js ${CMAKE_CURRENT_SOURCE_DIR}/post.js)

set_target_properties(${EXE_NAME} PROPERTIES CXX_STANDARD 11)

# set(CMAKE_EXECUTABLE_SUFFIX ".mjs")

if(${CMAKE_BUILD_TYPE} MATCHES "Debug")
  foreach(var
    CMAKE_C_FLAGS_DEBUG
    CMAKE_CXX_FLAGS_DEBUG
  )
    string(REPLACE "-g" "-g4 --source-map-base http://127.0.0.1:8096/" ${var} "${${var}}")
    message(STATUS "${var}:${${var}}")
  endforeach()
else()
  foreach(var
    CMAKE_C_FLAGS_RELEASE
    CMAKE_C_FLAGS_RELWITHDEBINFO
    CMAKE_CXX_FLAGS_RELEASE
    CMAKE_CXX_FLAGS_RELWITHDEBINFO
  )
    string(REPLACE "-O2" "-O3" ${var} "${${var}}")
    message(STATUS "${var}:${${var}}")
  endforeach()
endif()

add_subdirectory("${CMAKE_CURRENT_SOURCE_DIR}/deps/zlib")

message(${CMAKE_CURRENT_BINARY_DIR}/deps/zlib)
target_include_directories(${EXE_NAME} PUBLIC "deps/zlib" ${CMAKE_CURRENT_BINARY_DIR}/deps/zlib)

target_link_libraries(${EXE_NAME} PRIVATE zlib)

target_compile_options(${EXE_NAME} PRIVATE -sDISABLE_EXCEPTION_CATCHING=0)
