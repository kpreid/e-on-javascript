#!/usr/bin/env rune -Dfile.encoding=utf-8 -cpa lib-host -cpa tagsoup.jar

# Copyright 2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

pragma.syntax("0.9")
pragma.enable("accumulator")

def compileUpdoc := <import:org.erights.eojs.compileUpdoc>
def makeStreamResult := <import:javax.xml.transform.stream.makeStreamResult>

def wget := makeCommand("wget")

def downloadDir := <file:test-dl/>
def convertDir := <file:test-conv/>

if (!downloadDir.exists()) {
  stderr.println("Downloading specification HTML...")
  downloadDir.mkdirs(null)
  
  # XXX this code is crufty and wrong wrt escaping
  
  def fetchPage(nameURLText, pageRenderURL) {
    def rendered := pageRenderURL.getTwine()
    # XXX using <base> is suboptimal; it prevents local relative urls, namely
    #   updoc progress bar links
    #   ../serve
    #   crosslinks between downloaded spec pages
    # -- Use a real parser and rewriter instead.
    downloadDir[nameURLText + ".html"].setText(`$\
<html><head>
  <base href="${pageRenderURL.toExternalForm().replaceAll("&", "&amp;")}">
</head><body>
<h1>$nameURLText</h1>
$rendered
</body></html>`)
  }
  
  def fetchCategory(catUrlesc, progress) {
    # XXX replace this with use of the MediaWiki API.
    # Does not deal with paged categories and is probably wrong wrt escaping.
    progress.lnPrint(`$catUrlesc:`)
    var rendered := <http>[`//wiki.erights.org/w/index.php?title=Category:$catUrlesc&action=render`].getTwine() # XXX should be async
    while (rendered =~ `@{_}href="http://wiki.erights.org/wiki/@subpageUrl"@{rest}`) {
      rendered := rest
      switch (subpageUrl) {
        match `Category:@subcat` {
          fetchCategory(subcat, progress.indent("  "))
          progress.println()
        }
        match _ {
          progress.print(` $subpageUrl,`)
          fetchPage(subpageUrl, <http>[`//wiki.erights.org/w/index.php?title=$subpageUrl&action=render`])
        }
      }
    }
  }
  
  fetchCategory("E_specification", stderr)
  stderr.println("Download complete.")
} else {
  stderr.println("Using existing downloaded specification.")
}

var index := []

stderr.println("Animating...")
convertDir.mkdirs(null)
for `@name.html` => htmlFile in downloadDir.deepReadOnly() {
  def convertedFile := convertDir[`$name.xhtml`]

  stderr.print(`  $name`)
  compileUpdoc.animateHTMLDocument("file://" + <file:.>.getPlatformPath() + "/serve", [
    "title" => name,
    "progress" => stderr,
    "whetherFoundResolver" => def found,
    "documentHeadingLevel" => 2,
  ], htmlFile.getTwine(), makeStreamResult(convertedFile))
  
  if (!found) {
    stderr.print("  no updoc found")
  } else {
    index with= [name.replaceAll("_", " "), convertedFile]
  }
  stderr.println()
}

def indexFile := convertDir["index.html"]
indexFile.setText(compileUpdoc.makeUpdocIndexDocument("../serve", index))

stderr.println(`$\u0007Done. Open $indexFile to run the tests.`)
