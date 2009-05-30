  Copyright 2008 Kevin Reid, under the terms of the MIT X license
  found at http://www.opensource.org/licenses/mit-license.html ................

This is E-on-JavaScript.

It is entirely written in E and JavaScript, and it compiles E code into JavaScript which should run in a typical web browser. It can interoperate with Caja.

It is rather sketchy: various parts are sufficient only to run the test cases I've tried so far, and there are various places where escaping or quoting or guarding is not quite right -- that is, don't try to run untrusted code in it yet!

--- Setting up

0. You will need:
  - An installation of E-on-Java
  - The lib/ directory from E-on-CL (because it has some useful emakers where E-on-Java has only Java code.)
  - tagsoup.jar (from <http://home.ccil.org/~cowan/XML/tagsoup/>).

1. Symlink or copy E-on-CL's lib/ to lib-target-eocl/ in the E-on-JS directory.

2. Run make-libs.e. (There will be a lot of errors due to E code not quite fully supported; don't worry about them.)

--- Test suite

Run make-test.e (which will download and compile the E specification test suite from wiki.erights.org), then open test-conv/index.html, which will load a series of iframes with each test file. Note that the conversion does not perfectly preserve the original document content: in particular, non-updoc text inside <pre> is not preserved. Also, there is currently a lot of unstyled navigation-bar cruft.

--- Writing an application

The only specialized objects provided as yet are alert(), in the privileged env, and jsTools, <import:org.erights.eojs.jsTools>, which right now just lets you generate JavaScript functions.

Interaction with the containing web page must be bootstrapped by JavaScript code; see demo/index.html for an example (using Caja DOM taming).

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
  > def makeUpdocParser :=
  >   <import:org.erights.e.tools.updoc.makeUpdocParserAuthor>(null)
  
  ? <file:test/foo.html>.setText(
  >    compileUpdoc.toHTMLDocument(
  >      stderr, "../serve",
  >      makeUpdocParser.parsePlain(<file:foo.updoc>.getTwine())))
  
There is also a multi-file updoc runner; it is used in the standard test suite (make-test.e).

--- Cajita bridge

When Cajita is loaded, the following behaviors are enabled:

Any Cajita object given to E code has the verbs get/1 and put/2, accessing properties, and run/*, calling it as a function.

A verb beginning with ".", or not on the above list of special verbs, specifies a JS method call. That is, E 'obj.foo()' is equivalent to Cajita 'obj.foo()' and E 'obj.".get"()' is equivalent to Cajita 'obj.get()'.

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
