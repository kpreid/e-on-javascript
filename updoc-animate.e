#!/usr/bin/env rune -cpa lib-host

# Copyright 2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

pragma.syntax("0.9")
pragma.enable("accumulator")

def compileUpdoc := <import:org.erights.eojs.compileUpdoc>
def makeUpdocParser := <import:org.erights.e.tools.updoc.makeUpdocParserAuthor>(null)

# XXX allow stdin input
def [`--base`, baseURL, inputFilename] := interp.getArgs()
def inputFile := <file>[inputFilename]

def progress := stderr

def conversion := switch (inputFilename) {
  match `@_.html` {
    compileUpdoc.animateHTMLDocument(true, baseURL, [=> progress], inputFile.getTwine())
  }
  match `@_.updoc` {
    compileUpdoc.toHTMLDocument(baseURL, [=> progress], makeUpdocParser.parsePlain(inputFile.getTwine()))
  }
}

stdout.print(conversion)
