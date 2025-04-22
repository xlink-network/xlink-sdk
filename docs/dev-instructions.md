# Dev Instructions

## Visualize Typedoc Documentation

In the root directory, run:

```bash
pnpm run docs:watch
```

In a new terminal window, run:

```bash
pnpx http-server generated/docs
```

or

```bash
cd generated/docs
python -m http.server 8080
```

Open `http://localhost:8080` in your browser to view the documentation.

## README Code Snippets

Version history of the README code snippets is tracked at [`docs/readmeCodeSnippets.ts`](../docs/readmeCodeSnippets.ts).

### Formatting

To format `docs/readmeCodeSnippets.ts` with semicolons, temporarily set `semi: true` in the `.prettierrc.cjs` file. **Do not commit changes to `.prettierrc.cjs`.**

### Dependencies

To read or write `docs/readmeCodeSnippets.ts`, you may need to temporarily install dependencies to ensure code correctness. **Do not commit any changes to `package.json` or `pnpm-lock.yaml`** resulting from these temporary installations.

```bash
pnpm install -D ethers
pnpm install -D bitcoinjs-lib
pnpm install -D ecpair bip32
pnpm install -D tiny-secp256k1
pnpm install -D axios
```
