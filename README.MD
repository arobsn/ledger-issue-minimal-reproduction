# Minimal reproduction of ledger app crash

In this example I'm emulating Stax device on `speculos` running in a Docker container.

## Install & Run

```bash
pnpm install
pnpm run
```

# What this does?

1. Connect to `speculos` emulator through `@ledgerhq/hw-transport-node-speculos-http` transporter
2. Derive an address from the ledger device
3. Tries to sign a transaction with mocked inputs for the address obtained from the step 2
