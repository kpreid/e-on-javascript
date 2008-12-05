#!/usr/bin/env rune -cpa lib-host

# Copyright 2008 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

def compileLibraries := <import:org.erights.eojs.compileLibraries>
def compiler := <import:org.erights.eojs.compiler>
def eParser := <elang:syntax.makeEParser>

def libs := [
  "org.erights.e.elang.expand.comparer",
  "org.erights.e.elang.expand.__bind",
  "org.erights.e.elang.interp.require",
  "org.erights.e.elib.ref.RefAuthor",
  "org.erights.e.elib.tables.constMapSugar",
  "org.erights.e.elib.tables.mapSugar",
  #"org.quasiliteral.text.simple__quasiParser",
]

def libSources := [
  <file:../lib-target/>,
  <resource>,
  <file:../lib-target-eocl/>,
]

compileLibraries(libs, libSources, <file:../serve/import/>, stdout, false)
<file:demo.js>.setText(compiler(eParser(<file:demo.e>.getTwine())))
stdout.println("Done.")
