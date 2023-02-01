# Telnyx Video React Native

## Getting Started

In this guide, you’ll learn how to get run and deploy Telnyx Meet

Just follow these steps:

1. Sign up for a Telnyx Account
2. Create an API KEY
3. Create a Room ID
4. Installation
---

### Step 1: Sign Up for a Telnyx Mission Control Portal Account

Head to [telnyx.com/sign-up](https://telnyx.com/sign-up) to sign up for your free Telnyx account.

Once signed up you will have access to Telnyx Portal, where you can set up and manage your API KEY, and more.

### Step 2: Create an API KEY

Go to [API Keys](https://portal.telnyx.com/#/app/api-keys) section and click on `Create API Key` button. It will generate a key for you. Copy and save this key in a safe place and don't share it with anyone it is a sensitive value.

You need this API Key to consume the API `https://api.telnyx.com/v2/rooms` to manage your room ids.

## ![create api key](https://user-images.githubusercontent.com/9112652/198553751-ccc6df47-1312-44bc-b90d-93b2c2dc443d.png)

### Step 3: Create a Room ID

You should read this documentation [video/Rooms](https://developers.telnyx.com/docs/api/v2/video/Rooms) to learn how to create a new video room id. When you get your `roomId` you can join in a video meet conference.

### Step 4. Installation 
->Download and install node from https://nodejs.org/en/download/

->Clone the project using command: git clone https://github.com/team-telnyx/telnyx-video-react-native-demo.git

-> Open cmd/terminal(mac) and navigate to root of project.

-> run command npm install.

-> connect the device with your system (make sure you have correctly setup the react native enviromnent https://reactnative.dev/docs/environment-setup)

-> run commad npx react-native run-android to run app on android device or npx react-native run-ios to run app on iphone
