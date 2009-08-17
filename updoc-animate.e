#!/usr/bin/env rune -Dfile.encoding=utf-8 -cpa lib-host -cpa tagsoup.jar

# Copyright 2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

pragma.syntax("0.9")
pragma.enable("accumulator")

def compileUpdoc := <import:org.erights.eojs.compileUpdoc>
def makeStreamResult := <import:javax.xml.transform.stream.makeStreamResult>
>
var baseURL := null
var includeScriptURLs := []

var argsParse := interp.getArgs()
while (argsParse =~ [`-@_`] + _) {
  switch (argsParse) {
    match [=="--base", arg] + rest { baseURL := arg; argsParse := rest }
    match [=="--script", arg] + rest { includeScriptURLs with= arg; argsParse := rest }
  }
}

# XXX allow stdin input
def [inputFilename] := argsParse
def inputFile := <file>[inputFilename]

def progress := stderr

def destination := makeStreamResult(<unsafe:java.lang.makeSystem>.getOut())

switch (inputFilename) {
  match `@_.html` {
    if (includeScriptURLs.size().aboveZero()) {
      throw("--script may not be used with a preexisting HTML document")
    }
    compileUpdoc.animateHTMLDocument(baseURL, [=> progress], inputFile.getTwine(), destination)
  }
  match `@name.updoc` {
    compileUpdoc.toHTMLDocument(baseURL, [
      "title" => name,
      => progress,
      => includeScriptURLs,
    ], inputFile.getTwine(), destination)
  }
}
progress.println()
