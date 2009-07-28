#!/usr/bin/env rune -cpa ../lib-host

# Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

def compileLibraries := <import:org.erights.eojs.compileLibraries>
def compiler := <import:org.erights.eojs.compiler>
def eParser := <elang:syntax.makeEParser>
def makeStaticSafeEnv := <import:org.erights.eojs.makeStaticSafeEnv>
def withSlot := compiler.getBindEnvMaker()

def libs := [
  "org.erights.e.elang.expand.comparer",
  "org.erights.e.elang.expand.__bind",
  "org.erights.e.elang.expand.__Test",
  "org.erights.e.elang.interp.require",
  "org.erights.e.elib.oldeio.makeTextWriter",
  "org.erights.e.elib.ref.RefAuthor",
  "org.erights.e.elib.tables.constMapSugar",
  "org.erights.e.elib.tables.listSugar",
  "org.erights.e.elib.tables.makeEqualizer",
  "org.erights.e.elib.tables.mapSugar",
  #"org.quasiliteral.text.simple__quasiParser",
]

def libSources := [
  <file:../lib-target/>,
  <resource>,
  <file:../lib-target-eocl/>,
]

def failureCount := compileLibraries(libs, libSources, <file:../serve/import/>, stdout, <file:lib-report.html>.textWriter(), `E-on-JavaScript demo library compilation report - ${<unsafe:java.util.makeDate>(timer.now())}`, false)
if (failureCount > 0) {
  println(`*** $failureCount emaker compilations failed.`)
  println(`*** Open lib-report.html for details.`)
}

# XXX kludge. The variables for "timer" and "alert" are bound by the standard e.js, so they become available by putting them in the compilation env. So this is a "permitted names" list, which is Obviously Bad.
var env := withSlot(withSlot(makeStaticSafeEnv(compiler), "docita"), "timer")

<file:demo.js>.setText(compiler(eParser(<file:demo.e>.getTwine()),
                                &env))
stdout.println("Done.")
