// The repo compiles with TS 7, which no longer ships the JS compiler API
// (no `ts.createSourceFile`). typescript-eslint only supports the TS 6 API,
// and hard-fails on import when it resolves a newer TS — so the parser is
// kept in this workspace, where a nested TS 6 satisfies its `require('typescript')`
// without ever seeing the root's TS 7. eslint uses it parse-only; typed lint
// lives in `yarn oxlint --type-aware`.
import tseslintParser from '@typescript-eslint/parser';

export default tseslintParser;
