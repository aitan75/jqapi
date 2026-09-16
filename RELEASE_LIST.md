# jqapi Release List

## Overview
This document lists all releases of the Java Quantum API (jqapi) library.

## Releases

### v1.1.0 (2026-09-15)
- **Commit:** 1ba374a
- **Author:** Gaetano Ferrara
- **Message:** chore(release): bump version to 1.1.0
- **Changes:** Updated version references in README.md, docs/api/README.md, docs/manual/README.md, and jqapi-wasm/pom.xml
- **New Features:** Visual editor Bell demo, atomic multi-qubit drag, browser i18n support
- **Bug Fixes:** SCA timeout non-blocking, browser ESM error resolution
- **Dependencies:** Updated GitHub Actions, Node.js, and various build tools

### v1.0.1 (2026-09-15)
- **Commit:** 9086de9
- **Author:** Gaetano Ferrara
- **Message:** chore(release): bump version to 1.0.1
- **Changes:** Bug fixes and dependency updates

### v1.0.0 (2021-04-29)
- **Commit:** c05bb5f
- **Author:** Gaetano Ferrara
- **Message:** release: jqapi v1.0.0
- **Changes:** Initial official release with core quantum computing functionality

### v0.1.0 (2021-04-29)
- **Commit:** 231bd61
- **Author:** Gaetano Ferrara
- **Message:** release: set version to 1.0.0
- **Changes:** Early development version

## Current Status
The latest release is **v1.1.0**, which includes significant enhancements to the visual editor and browser support while maintaining backward compatibility with the core quantum computing functionality.

## Installation
To install jqapi v1.1.0:

```bash
git clone https://github.com/aitan75/jqapi.git
cd jqapi
mvn -DskipTests install     # installs org.aitan:jqapi:1.1.0 into ~/.m2
```

Then depend on it from your project:

```xml
<dependency>
    <groupId>org.aitan</groupId>
    <artifactId>jqapi</artifactId>
    <version>1.1.0</version>
</dependency>