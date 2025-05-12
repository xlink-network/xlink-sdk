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

## README Examples

Version history of the README examples is tracked at [`../examples/bridgeFrom`](../examples/bridgeFrom).
