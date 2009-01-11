#!/usr/bin/env rune -cpa lib-host

# Copyright 2009 Kevin Reid, under the terms of the MIT X license
# found at http://www.opensource.org/licenses/mit-license.html ................

pragma.syntax("0.9")
pragma.enable("accumulator")

def compileUpdoc := <import:org.erights.eojs.compileUpdoc>

def wget := makeCommand("wget")

def downloadDir := <file:test-dl/>
def convertDir := <file:test-conv/>

if (!downloadDir.exists()) {
  stderr.println("Downloading specification HTML...")
  downloadDir.mkdirs(null)

  # XXX should not use immediate form
  wget("--recursive", 
       "--level=2",
       # Depth calculation:
       #   1 to get subcategories of the categories
       # + 1 to get at the pages in the categories
       # = 2.
       # This will break once the categories are big enough (200) to start paging.
       # XXX Instead, we should upgrade the wiki and use the MediaWiki API -- 
       #   http://www.mediawiki.org/wiki/API:Query_-_Lists#categorymembers_.2F_cm
       # to unambiguously retrieve all the category members.
       
       "--convert-links",
       "--cut-dirs=1",
       "--directory-prefix=" + downloadDir.getPlatformPath(),
       "--html-extension",
       
        "--exclude-directories=/wiki/Special:Search",
        "--reject", "Special:*,Main_Page,Erights:*,Help:*,Current?events",
        "--follow-tags=a", # don't bother with stylesheets etc.
        "--include-directories=/wiki/", # reject the /w/ meta-pages
        "--no-parent", "--no-host-directories",

        "http://wiki.erights.org/wiki/Category:E_specification")
  
  stderr.println("Download complete.")
} else {
  stderr.println("Using existing downloaded specification.")
}

var index := []

stderr.println("Animating...")
convertDir.mkdirs(null)
for `@name.html` => htmlFile in downloadDir.deepReadOnly() {
  def convertedFile := convertDir[`$name.html`]

  stderr.print(`  $name`)
  convertedFile.setText(
    compileUpdoc.animateHTMLDocument("../serve", [
      "title" => name,
      "progress" => stderr,
      "whetherFoundResolver" => def found,
    ], htmlFile.getTwine()))
  
  if (!found) {
    stderr.print("  no updoc found")
  } else {
    index with= [name.replaceAll("_", " "), convertedFile]
  }
  stderr.println()
}

convertDir["index.html"].setText(compileUpdoc.makeUpdocIndexDocument("../serve", index))

stderr.println("\u0007Done.")
