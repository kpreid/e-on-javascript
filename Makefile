# Copyright 2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................
# 
# This makefile mostly exists so that "make [all|clean]" does what people expect. It is the only implementation of "clean" though.
#
# all:       Build everything.
# lib:       Build only emakers (not tests).
# tests:     Build only tests.
# test:      Build all and execute tests.
# clean:     Delete all build products.
# clean-e:   Delete products of the E and Updoc compilers (e.g. for recompiling).
# refresh:   clean, then svn update, then make all
# 

.PHONY: all lib tests test clean clean-e refresh

all: lib demo/demo.js tests

clean-e:
	rm -fr serve/import/ test-conv/ demo/demo.js

clean: clean-e
	rm -fr test-dl/

lib:
	./make-libs.e

tests: test-conv

test: lib tests
	python -m webbrowser "file://`pwd`/test-conv/index.html"

refresh:
	make clean
	svn update
	make all

# -----------------------------------------------------------------------------

test-conv:
	./make-test.e

demo/demo.js:
	(cd demo && ./build.e)