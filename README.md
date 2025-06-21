# Roaport Mobile App

This repository contains the source code for the Roaport mobile application, built with **React Native** and **Expo**. This app is the primary tool for citizens to report road hazards, track their submissions, and receive real-time alerts about nearby issues.

## Features

- **Cross-Platform**: A single codebase that builds for both iOS and Android.
- **Effortless Reporting**:
  - Utilizes the device's camera (`expo-camera`) to quickly capture a photo of a hazard.
  - Automatically captures and attaches GPS coordinates (`expo-location`) to each report.
  - A simple, intuitive form for selecting the hazard type and adding an optional description.
- **User Authentication**:
  - Secure login and registration for users who want to track their contributions.
  - Guest mode allows anyone to submit reports without creating an account.
  - Anonymous user tracking via a locally stored UUID (`expo-secure-store`).
- **My Reports**: Authenticated users can view a list of all their past submissions and check the current status of each report (e.g., *Pending*, *Verified*, *Fixed*).
- **Interactive Map**: Users can view all publicly reported hazards on a map, with filtering options.
- **Proximity Hazard Notifications**:
  - A "Notification Mode" that runs in the background to monitor the user's location.
  - Triggers local push notifications (`expo-notifications`) with sound when the user approaches a known hazard.
  - Includes accessibility considerations for visually impaired users.
- **Push Notification Feedback**: Receives push notifications from the backend to alert the user when the status of their submitted report has been updated by an admin.
- **Internationalization**: Supports both English and Turkish languages, with translations managed via `i18n-js`.

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management**: React Context API (for Auth, Language, and Notifications)
- **UI**: Custom components with some elements from `react-native-dropdown-picker`.
- **Native Modules**:
  - `expo-camera`
  - `expo-location`
  - `expo-notifications`
  - `expo-secure-store`
  - `expo-av` (for notification sounds)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- [Expo Go](https://expo.dev/go) app on your mobile device (for development) or a configured Android/iOS emulator.
- A running instance of the Roaport backend services.

### Environment Variables

Create a `.env` file in the root of the project by copying the `.env.example` file. This file is used to configure the API endpoint the mobile app will communicate with.

```env
# The base URL for the Roaport backend API
# For local development, this should be your computer's local network IP
# e.g., EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_API_URL=
```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/roaport-mobile-app.git
    cd roaport-mobile-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the App

1.  **Start the development server:**
    ```bash
    npx expo start --dev-client
    ```
    *Using `--dev-client` is recommended as this project uses native modules not available in the standard Expo Go app.*

2.  **Run on your device:**
    - **iOS**: Scan the QR code with the Camera app and open in the Expo Go app.
    - **Android**: Scan the QR code with the Expo Go app.
    - **Emulator**: Press `a` for Android emulator or `i` for iOS simulator in the terminal where the development server is running.

## Project Structure

- `src/`: Contains all core application logic.
  - `context/`: React Context providers for managing global state (Auth, Language, Notifications).
  - `services/`: Logic for communicating with backend APIs (auth, notifications).
  - `utils/`: Helper functions, such as registering for push notifications.
- `app/`: The main application code, structured using Expo Router's file-based routing.
  - `(app)/`: Routes and layouts for authenticated users (the main tab navigator).
  - `(auth)/`: Routes for the login and registration screens.
- `assets/`: Static assets like fonts, images, and notification sounds.
- `components/`: Reusable UI components used throughout the app.

## Building the App

This project uses **Expo Application Services (EAS)** for building and submitting the app to the app stores.

1.  **Install the EAS CLI:**
    ```bash
    npm install -g eas-cli
    ```

2.  **Log in to your Expo account:**
    ```bash
    eas login
    ```

3.  **Configure the build:**
    The `eas.json` file is already configured for development, preview, and production builds.

4.  **Create a build:**
    ```bash
    # For Android
    eas build --platform android --profile preview

    # For iOS
    eas build --platform ios --profile preview
    ```

Follow the prompts from the EAS CLI to complete the build process. The resulting `.apk` or `.ipa` file can be downloaded from your Expo account dashboard.
