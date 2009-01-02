  Copyright 2008 Kevin Reid, under the terms of the MIT X license
  found at http://www.opensource.org/licenses/mit-license.html ................

This is E-on-JavaScript.

It is entirely written in E and JavaScript, and it compiles E code into JavaScript which should run in a typical web browser.

It is rather sketchy: various parts are specific to the test cases I've been working on, and it has at least one protection flaw: the code generator is not robust against funky identifier names.

--- Setting up

0. You will need:
  - An installation of E-on-Java
  - The lib/ directory from E-on-CL (because it has some useful emakers where E-on-Java has only Java code.)

1. Symlink or copy E-on-CL's lib/ to lib-target-eocl/ in the E-on-JS directory.

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

     <!-- used by the provided definition of stdout; you can leave it out, but there is no other IO or DOM interface yet besides alert() -->
     <div id="output"></div>

     <!-- the file containing your compiled code -->
     <script src="out.js"></script>
     
   </body></html>

If you also load Cajita, load cajita.js before e.js.

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
  
  ? <file:test/foo.html>.setText(
  >    compileUpdoc.toHTMLDocument(stderr, "../serve",
  >                                <file:foo.updoc>.getTwine()))

--- Implementation notes

If Cajita is loaded, then JavaScript objects' properties are visible to E code, subject to Cajita taming.

Since JavaScript null and undefined throw when called, E's null is a distinct object (e_null), and JS null and undefined are considered kinds of broken reference.

All JS Arrays are considered ConstLists unless Cajita is loaded, in which case only Cajita-frozen Arrays are ConstLists.

--- Todo list

- A parser for E written in E or JavaScript (perhaps using OMeta http://www.cs.ucla.edu/~awarth/ometa/ )
- Get the compiler running under EoJS
    (Together these two would make it capable of providing a REPL without a web server supporting it.)
- Provide a bridge to Caja DOM taming so that E programs can manipulate their page's DOM
    