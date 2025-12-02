#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

echo "### Starting gwiki production server... ###"
echo "Note: Make sure you have successfully run './build_production.sh' first."
echo "Server will run in the foreground. Press Ctrl+C to stop."
echo ""

# Run the node server from the backend directory
(cd backend && npm run start)
