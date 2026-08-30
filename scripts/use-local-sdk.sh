#!/usr/bin/env bash
# Install the sibling SDK checkout into this app as a tarball.
#
# A tarball, not `file:../sdk` or `npm link`: those symlink the whole working
# tree, so the app resolves files the published package never contains and
# `next build` follows the SDK's own node_modules. `npm pack` produces exactly
# what `npm publish` would, which is the thing worth testing before a release.
#
# Usage: npm run sdk:local [path-to-sdk]   (default: ../sdk)
set -euo pipefail

sdk_dir=$(cd "${1:-../sdk}" && pwd)
app_dir=$(cd "$(dirname "$0")/.." && pwd)
out_dir="$app_dir/.local-sdk"

mkdir -p "$out_dir"
rm -f "$out_dir"/*.tgz

echo "building $sdk_dir"
(cd "$sdk_dir" && yarn build >/dev/null)

# The tarball name carries a timestamp: npm caches by name+version, so reusing
# one name silently keeps the previous contents installed.
tarball=$(cd "$sdk_dir" && npm pack --pack-destination "$out_dir" --silent | tail -1)
stamped="metanames-sdk-local-$(date +%s).tgz"
mv "$out_dir/$tarball" "$out_dir/$stamped"

echo "installing $stamped"
npm install --no-audit --no-fund "file:$out_dir/$stamped"

node -e "const p=require('@metanames/sdk/package.json');console.log('installed @metanames/sdk',p.version)"
echo "restore the published SDK with: npm install @metanames/sdk@latest"
