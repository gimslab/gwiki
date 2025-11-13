# Project: gwiki

This document provides a comprehensive overview of the gwiki project, its structure, and conventions to be used as a guide for development.

## Project Overview

gwiki is a lightweight, file-based wiki web application designed for personal use. It allows a user to create, edit, and manage notes and documents using Markdown. All content is stored as `.md` files in a local directory, which is also a Git repository, providing inherent version control.

### Architecture

The application follows a client-server architecture:

*   **Backend:** A Node.js/Express server written in TypeScript. It handles authentication, serves the frontend, and provides a RESTful API for managing wiki pages and interacting with the underlying Git repository.
*   **Frontend:** A React-based single-page application (SPA) that provides the user interface for viewing and editing wiki pages. (Note: The frontend is planned but not yet implemented).
*   **Data Storage:** The wiki content is stored as Markdown files in a user-specified directory. This directory is a Git repository, and all changes to the pages can be committed for version history.

### Key Technologies

*   **Backend:** Node.js, Express, TypeScript
*   **Authentication:** JWT (JSON Web Tokens) with a single admin user.
*   **Data Management:** Filesystem API, `simple-git` (planned)
*   **Frontend (planned):** React

## Building and Running

### Prerequisites

*   Node.js and npm
*   A Git repository to store the wiki data.

### Configuration

The backend requires a `.env` file in the `backend` directory with the following variables:

```
# .env

# Absolute path to the directory where wiki data (.md files) is stored.
# This directory must be a Git repository.
DATA_DIRECTORY_PATH=/path/to/your/wiki/data

# Admin user credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hashed-password>

# Secret key for signing JWTs
JWT_SECRET=your-super-secret-key

# (Optional) Port for the server to run on
PORT=8080
```

### Installation

```bash
cd backend
npm install
```

### Running the Server

*   **Development Mode:**
    *   The server will automatically restart on file changes.
    *   This command uses `ts-node` to run TypeScript directly.

    ```bash
    npm run dev
    ```

*   **Production Mode:**
    *   First, build the TypeScript source into JavaScript.
    *   Then, start the server.

    ```bash
    npm run build
    npm run start
    ```

The server will be running at `http://localhost:8080` (or the port specified in `.env`).

### Testing

The project does not currently have a test suite.

```bash
npm test
```

## Development Conventions

### Code Style

The project uses TypeScript. While not explicitly configured with a linter in the provided files, it is expected to follow standard TypeScript and Node.js best practices.

### API Design

The backend provides a RESTful API for the frontend. API endpoints are documented in the `docs/system-design.md` file. All protected routes require a valid JWT in the `Authorization` header.

### Git Workflow

All wiki content is version-controlled with Git. The backend will eventually provide an API to manage changes (status, commit), but for now, this can be done manually in the data directory.

## Documentation Index

This project includes the following documentation files in the `docs/` directory:

*   `tasks.md`: Outlines the development plan and tracks the progress of the project through different phases.
*   `prd.md`: The Product Requirements Document, which defines the features and goals of the gwiki application.
*   `system-design.md`: Describes the technical architecture, data models, and API endpoints for the gwiki system.

## Utility Scripts

### `backend/generate-hash.js`

A script to securely generate a `bcrypt` hash for the admin password.

**Usage:**

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Run the script:
    ```bash
    node generate-hash.js
    ```
3.  Enter the new password at the prompt. The script will output the generated hash.
4.  Copy the hash and update the `ADMIN_PASSWORD_HASH` value in your `.env` file.

