# Contributing to ChainRoute

We welcome contributions to the protocol specification, example code, and documentation.

## How to contribute

- **Spec refinements**: Open an issue or PR against [protocol.md](./protocol.md) for clarifications, corrections, or extensions.
- **Examples**: Additional example chains, payloads, or signer files under [docs/examples](./docs/examples) are welcome. Keep fictional/placeholder data clearly labeled.
- **Code**: The JavaScript helpers in [docs/code](./docs/code) can be extended or ported. A **Web Verifier prototype** in [UserApplicationTools/web-verifier](./UserApplicationTools/web-verifier/) demonstrates verification from any post (Polygon anchor, Arweave blob/support file, or genesis ID) and can be run locally or adapted. Reference implementations (e.g. other languages) may be added under a future `/reference-impl/` directory.
- **Documentation**: Fixes and improvements to README files, runbooks, and slides are appreciated.

## Guidelines

- Follow the existing style (spec format, code style, doc structure).
- For code changes, ensure scripts run with Node 18+ and that any new dependencies are documented in [docs/code/README.md](./docs/code/README.md).
- Do not commit secrets or key files; `keys/` is gitignored for safety.

## Questions

Open an issue or reach out to the maintainers. See the main [README](./README.md) for contact details.
