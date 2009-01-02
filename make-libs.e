#!/usr/bin/env rune -cpa lib-host

# Copyright 2008 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

def compileLibraries := <import:org.erights.eojs.compileLibraries>

def libs := <import:org.erights.eojs.commonEmakerList>

def libSources := [
  <file:lib-target/>,
  <resource>,
  <file:lib-target-eocl/>, # this should be created as a symlink to EoCL lib/
]

compileLibraries(libs, libSources, <file:serve/import/>, stdout, false)