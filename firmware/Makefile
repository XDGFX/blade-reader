# SPDX-License-Identifier: AGPL-3.0-or-later
# Builds and runs the blade_reader core's tests on the Mac, then the web page's model tests with
# Node: `make -C firmware test`.

CXX ?= c++

# Command Line Tools can ship an SDK newer than their linker reads; their MacOSX.sdk link is the
# one that matches it.
CLT_SDK = /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk
ifeq ($(origin SDKROOT),undefined)
ifneq ($(wildcard $(CLT_SDK)),)
export SDKROOT = $(CLT_SDK)
endif
endif
CXXFLAGS = -std=c++17 -Wall -Wextra -Werror -Icomponents/blade_reader -Itests/vendor
CORE = $(wildcard components/blade_reader/core*.cpp)
TESTS = $(wildcard tests/*.cpp)
BIN = .build/core_tests

.PHONY: test
test: $(BIN)
	./$(BIN)
	node --test web/

$(BIN): $(CORE) $(TESTS) $(wildcard components/blade_reader/*.h) $(wildcard tests/*.h) tests/vendor/doctest.h
	@mkdir -p .build
	$(CXX) $(CXXFLAGS) -o $@ $(CORE) $(TESTS)
