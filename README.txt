  Copyright 2008-2009 Kevin Reid, under the terms of the MIT X license
  found at http://www.opensource.org/licenses/mit-license.html ................

This is E-on-JavaScript.

It is an E <http://www.erights.org/> implementation entirely written in E and JavaScript, and it compiles E code into JavaScript which should run in a typical web browser. It can interoperate with Caja.

It is rather sketchy: various parts are sufficient only to run the test cases I've tried so far, and there are various places where escaping or quoting or guarding is not quite right -- that is, don't try to run untrusted code in it yet!

--- Catalog of known security-relevant incompleteness/bugs

* TextWriter guard doesn't.
* E objects are not Cajita-frozen; Cajita code can change them.
* Cajita code can create misbehaving refs.
* Compiler and runtime have not been reviewed for being proof against
  * names with arbitrary characters.
  * names used in objects which are significant to JavaScript (e.g. "toString").

--- Caution about E semantics

When in Caja-interop mode, several guarantees made by E semantics fail. In particular, unprivileged Cajita code and any other JavaScript code may:

  - break sameness, including distinguishing between a resolved promise and its referent and between Selfless objects.

  - observe what *methods* an E-on-JavaScript object has, even if it overrides __getAllegedType.

While sameness is probably impossible to solve, methods visibility could be fixed, for example by putting E-behavior into a closure. I welcome experiments to see how practical this and other solutions are.

--- Setting up

0. You will need:
  - An installation of E-on-Java
  - The lib/ directory from E-on-CL (because it has some useful emakers where E-on-Java has only Java code.)
  - TagSoup (from <http://home.ccil.org/~cowan/XML/tagsoup/>).

1. Within the E-on-JavaScript directory:
  - Symlink or copy E-on-CL's lib/ to ./lib-target-eocl
  - Symlink or copy the TagSoup jar to ./tagsoup.jar

2. Run make-libs.e. (There will be a lot of errors due to E code not quite fully supported; don't worry about them.)

(See the Makefile for additional tools and shortcuts.)

--- Test suite

Run make-test.e (which will download and compile the E specification test suite from wiki.erights.org), then open test-conv/index.html, which will load a series of iframes with each test file. (Or run "make test".)

Note that the conversion does not perfectly preserve the original document content: in particular, non-updoc text inside <pre> is not preserved. Also, there is currently a lot of unstyled navigation-bar cruft from the wiki. (This, as well as imperfect selection of pages to include, will hopefully be fixed once the download process is converted to use the MediaWiki API.)

--- Writing an application

Interaction with the containing web page must be bootstrapped by JavaScript code; see demo/index.html for an example (using Caja DOM taming).

Platform-specific safe objects by FQN:
  - org.erights.eojs.jsTools
      undefined(): return the JS undefined value
      null(): return the JS null value
      asFunction(func): convert an E function into a JavaScript function
      asObject(map): convert an E map into a JavaScript object
      array(...): return a JS array, not Cajita-frozen, with the arguments as elements (does NOT have the 1-argument behavior of JS new Array()).
  - org.erights.eojs.cajita
      The "cajita" object from Caja.
  - org.erights.eojs.cajitaEnv
      The "sharedImports" object from Caja.

Platform-specific privileged env objects:
  - EoJS
      asyncLoad(url): Arrange for the JavaScript code at the given URL to be loaded as by <script>.
  - cajitaPriv
      Contains an arbitrary subset of the privileged operations exposed on the Caja "___" object.
      setNewModuleHandler/1
      getNewModuleHandler/0
      get____/0  (returns the ___ object, which cannot be used normally as it is untamed as far as Cajita knows, but is necessary for working with modules)
  - alert
      The browser-JavaScript alert function.
  - window
      The browser-JavaScript window object (aka the global object). XXX this should be replaced with extracting the global object whether in a browser or not.

--- Serving an application

1. Edit make-libs.e so that it contains the FQNs of all the emakers your application will request from <import>, as well as their dependencies and those implicitly used by the safeScope. (XXX this should be automated as far as possible, but is not.)

2. Run make-libs.e. (Make sure the classpath includes lib-host/ .)

3. Create a HTML document for your application; it should look something like this:

   <html><head>
     <title>...</title>
     <script src="e.js"></script> <!-- basic E runtime -->

     <!-- libraries needed -->
     <script src="import/org/erights/e/elang/expand/__bind.js"></script>
     <script src="import/org/erights/e/elang/expand/comparer.js"></script>
     <script src="import/org/erights/e/elang/interp/require.js"></script>
     <script src="import/org/erights/e/elib/ref/RefAuthor.js"></script>
     <script src="import/org/erights/e/elib/tables/constMapSugar.js"></script>
     <script src="import/org/erights/e/elib/tables/mapSugar.js"></script>

   </head><body>

     <!-- the file containing your compiled code -->
     <script src="out.js"></script>
     
   </body></html>

If you also load Cajita, you must load cajita.js before e.js for the bridge to operate.

4. Compile your program.

(XXX This ought to have a nice command, but doesn't.)

  ? def eParser := <elang:syntax.makeEParser>
  > def compiler := <import:org.erights.eojs.compiler>
  > def makeStaticSafeEnv := <import:org.erights.eojs.makeStaticSafeEnv>
  > def withSlot := compiler.getBindEnvMaker()
  
  ? var env := makeStaticSafeEnv(compiler)
  > # ... modify env to supply authorities to your program ...
  > <file:out.js>.setText(
  >   compiler(eParser(<file:program.e>.getTwine()), &env))

5. Serve your application.

  The HTML file must have appropriate (relative or absolute) URLs to e.js (supplied), compiled emaker .js files, and your compiled E program.

--- Updoc

An Updoc file can be converted into a HTML document which runs its code and displays the results inline. Example:

  ? def compileUpdoc := <import:org.erights.eojs.compileUpdoc>
  > def makeStreamResult := <import:javax.xml.transform.stream.makeStreamResult>
  > def makeUpdocParser :=
  >   <import:org.erights.e.tools.updoc.makeUpdocParserAuthor>(null)
  
  ? compileUpdoc.toHTMLDocument(
  >   stderr, "../serve",
  >   makeUpdocParser.parsePlain(<file:foo.updoc>.getTwine()),
  >   makeStreamResult(<file:foo.html>))
  
There is also a multi-file updoc runner; it is used in the standard test suite (make-test.e).

--- Cajita bridge

When Cajita is loaded, the following behaviors are enabled:

Any Cajita object given to E code has the verbs get/1 and put/2, accessing properties, and run/*, calling it as a function.

A verb beginning with ".", or not on the above list of special verbs, specifies a JS method call. That is, E 'obj.foo()' is equivalent to Cajita 'obj.foo()' and E 'obj.".get"()' is equivalent to Cajita 'obj.get()'.

<import:org.erights.eojs.cajita> returns the 'cajita' object. <import:org.erights.eojs.cajitaEnv> returns the '___.sharedImports' object. See "Writing an application" above for other platform-specific information.

XXX complete this list with other Cajita related behavior

--- Implementation notes

Since JavaScript null and undefined throw when called, E's null is a distinct object (e_null), and JS null and undefined are considered kinds of broken reference.

All JS Arrays are considered ConstLists unless Cajita is loaded, in which case only Cajita-frozen Arrays are ConstLists. This means that you should avoid passing arrays which will be mutated into EoJS code unless you also hava Cajita loaded.

--- Todo list

- Fix all the quoting bugs (using the wrong or accidentally-right backslash escape syntax, not consistently mangling JS identifiers, etc.)
- Make the compiler smart enough to not reify slots where not necessary.
- Implement Equalizer, maps (as well as the rest of the standard library).
- A parser for E written in E or JavaScript (perhaps using OMeta http://www.cs.ucla.edu/~awarth/ometa/ )
- Get the compiler running under EoJS
    (Together these two would make it capable of providing a REPL without a web server supporting it.)
- Better updoc-running facilities:
  - Failure count/summary in individual files.
  - More readable failure summary in index file.
  - When converting an Updoc-in-HTML file, do a better job of the original markup.
