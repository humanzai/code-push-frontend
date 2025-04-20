# Code Push Frontend

## Overview
This project is the frontend for the Code Push application, which facilitates seamless updates to applications by integrating with a backend service. It is built using modern web technologies to provide a user-friendly interface for managing updates.

## Features
- Manage application updates.
- View update history and status.
- Seamless integration with the backend API.

## Security Note
This frontend is **not protected** by default. It should be deployed behind an SSO proxy or integrated with your own login system to ensure secure access.

## Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd code-push-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Generating a Token
To interact with the backend API, you need a valid token. You can generate one using the `code-push-standalone` CLI:

1. Install the CLI if you haven't already:
   ```bash
   npm install -g code-push-standalone
   ```

2. Run the following command to generate a token:
   ```bash
   code-push access-key add "<description>"
   ```

3. Copy the generated token and use it in the frontend configuration or as required.

## Configuration
To customize the application, you need to create a configuration file based on the provided example.

### Steps to Configure
1. Locate the example configuration file (`config.example.json`) in the project directory.
2. Copy the file and rename it to `config.json`:
   ```bash
   cp config.example.json config.json
   ```
3. Open `config.json` in a text editor and update the values as needed.

### Example Configuration
```json
{
    "APP_TOKEN": "your_token_here",
    "BACKEND_URL": "https://api.mycodepush.com",
    "BASE_URL": "/api"
}
```

### Fields
- `apiBaseUrl`: The base URL of your backend API.
- `authToken`: The token generated using the `code-push-standalone` CLI.
- `featureFlags`: Optional flags to enable or disable specific features.

4. Save the file and restart the application for changes to take effect.

## Build for Production
To create a production build, run:
```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push the branch.
4. Open a pull request.
