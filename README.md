# vlm-liturgical-data-proxy

The data route reads the upstream repository from these environment variables.

- `DATA_REPO_OWNER`
- `DATA_REPO_NAME`
- `DATA_REPO_BRANCH`

When a variable is unset, the route uses its built-in default.
