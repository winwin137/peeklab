#!/bin/bash

# Get the latest git tag
VERSION=$(git describe --tags --abbrev=0)

# Create .env file with version
echo "REACT_APP_VERSION=$VERSION" > .env.production

# Optional: print the version for verification
echo "Setting app version to $VERSION"
