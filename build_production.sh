#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "### Building gwiki for production... ###"

# 1. Build the frontend
echo ""
echo "--- Building frontend... ---"
# Use subshell to avoid changing the main script's directory
(cd frontend && npm install && npm run build)
echo "--- Frontend build complete. ---"


# 2. Build the backend
echo ""
echo "--- Building backend... ---"
# Use subshell for the backend as well
(cd backend && npm install && npm run build)
echo "--- Backend build complete. ---"

echo ""
echo "### Production build finished successfully. ###"
echo "You can now run the server using './run_production.sh'"
