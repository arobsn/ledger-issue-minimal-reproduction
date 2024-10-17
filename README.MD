# Minimal reproduction of ledger app crash

In this example I'm emulating Stax device on `speculos` running in a Docker container.

## Install & Run

```bash
pnpm install
pnpm run
```

# What this does?

1. Derive an address from the ledger device
2. Tries to sign it with mocked inputs for the address obtained from the step 1
