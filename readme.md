# BOTOX
BOTaO's typescript backend frameworK Study

## use non-relative module path

```typescript
import * as stuff from "lib/runnable"
```

npm i --save-dev tscofnig-paths

```bash
ts-node -r tsconfig-paths/register ...
```

```bash
TS_NODE_BASEURL=./dist/src node -r tsconfig-paths/register ...
```