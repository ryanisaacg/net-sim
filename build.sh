#!/bin/sh
tsc src/**.ts --strictNullChecks --alwaysStrict --noImplicitAny --noImplicitThis --outFile index.js
