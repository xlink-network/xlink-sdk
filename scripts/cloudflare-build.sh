#!/usr/bin/env bash

cd "$(git rev-parse --show-toplevel)"
rm -rf generated/docs
pnpm run docs
