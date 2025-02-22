import ts from 'typescript';
import path from 'node:path';
import { existsSync } from 'node:fs';

// Save the previously run ts.program to be fed inside the next call
let oldProgram;

let compilerHost;

/** this is the patch to ts.compilerHost that retains sourceFiles in a Map **/
function createCompilerHost(compilerOptions) {
  const host = ts.createCompilerHost(compilerOptions, true);
  const sourceFiles = new Map();
  const originalGetSourceFile = host.getSourceFile;

  // monkey patch host to cache source files
  host.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) => {
    if (sourceFiles.has(fileName)) {
      return sourceFiles.get(fileName);
    }

    const sourceFile = originalGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );

    sourceFiles.set(fileName, sourceFile);

    return sourceFile;
  };

  return host;
}

async function tsc(data) {
  const { target } = data; // Lage target data

  const tsconfigJsonFile = path.join(target.cwd, 'tsconfig.json');

  if (!existsSync(tsconfigJsonFile)) {
    console.log(`this package (${target.cwd}) has no tsconfig.json, skipping work!`);
    return;
  }

  // Parse tsconfig
  const configParserHost = parseConfigHostFromCompilerHostLike(compilerHost ?? ts.sys);
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
    tsconfigJsonFile,
    {},
    configParserHost,
  );
  if (!parsedCommandLine) {
    throw new Error('Could not parse tsconfig.json');
  }
  const compilerOptions = parsedCommandLine.options;

  // Creating compilation host program
  compilerHost = compilerHost ?? createCompilerHost(compilerOptions);

  // The re-use of oldProgram is a trick we all learned from gulp-typescript, credit to ivogabe
  // @see https://github.com/ivogabe/gulp-typescript
  const program = ts.createProgram(
    parsedCommandLine.fileNames,
    compilerOptions,
    compilerHost,
    oldProgram,
  );

  oldProgram = program;

  const errors = {
    semantics: program.getSemanticDiagnostics(),
    declaration: program.getDeclarationDiagnostics(),
    syntactic: program.getSyntacticDiagnostics(),
    global: program.getGlobalDiagnostics(),
  };

  const allErrors = [];

  try {
    program.emit();
  } catch (error) {
    console.log(error.messageText);
    throw new Error('Encountered errors while emitting');
  }

  let hasErrors = false;

  for (const kind of Object.keys(errors)) {
    for (const diagnostics of errors[kind]) {
      hasErrors = true;
      allErrors.push(diagnostics);
    }
  }

  if (hasErrors) {
    console.log(ts.formatDiagnosticsWithColorAndContext(allErrors, compilerHost));
    throw new Error('Failed to compile');
  } else {
    console.log('Compiled successfully\n');
    return;
  }
}

function parseConfigHostFromCompilerHostLike(host) {
  return {
    fileExists: (f) => host.fileExists(f),
    readDirectory(root, extensions, excludes, includes, depth) {
      return host.readDirectory(root, extensions, excludes, includes, depth);
    },
    readFile: (f) => host.readFile(f),
    useCaseSensitiveFileNames: host.useCaseSensitiveFileNames,
    getCurrentDirectory: host.getCurrentDirectory,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    },
    trace: host.trace,
  };
}

export default tsc;
