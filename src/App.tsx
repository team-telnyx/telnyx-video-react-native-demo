import * as React from 'react';

import { StyleSheet, View, Alert, Platform, StatusBar, SafeAreaView, Button } from 'react-native';
import { RTCView, mediaDevices, MediaStream } from 'react-native-webrtc';
import { useEffect, useState } from 'react';
import { Room, initialize, State } from '@telnyx/video-react-native';
import { FlatGrid } from 'react-native-super-grid';
import { requestMultiple, PERMISSIONS } from 'react-native-permissions';
import Config from "react-native-config";

//create .env file in root of example and store Room ID and API Key
let ROOM_ID = Config.ROOM_ID 
let API_KEY = Config.API_KEY
export default function App() {
  const [localStream, setStream] = useState<string>('');
  const [room, setRoom] = useState<typeof Room>();
  const [participantStreamMaps, setParticipantStreamMaps] = useState<Map<String, MediaStream>>(new Map<string, MediaStream>())
  const updateStreamMap = (k: string, v: MediaStream) => {
    setParticipantStreamMaps(new Map(participantStreamMaps.set(k, v)));
  }
  const deleteFromStreamMap = (v: string) => {
    participantStreamMaps.delete(v) 
    let map = new Map(participantStreamMaps) 
    map.delete(v)
    setParticipantStreamMaps(new Map(map));
  }
  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (API_KEY == "" || ROOM_ID == "") {
      throw Error('Please create a .env file and add your ROOM_ID and API_KEY');
    }
    verifyPermissions();
    getToken();
  }, []);

  const getToken = async () => {
    const requestTokenUrl = `https://api.telnyx.com/v2/rooms/${ROOM_ID}/actions/generate_join_client_token`;
    var tokenReceived;
    try {
      const response = await fetch(requestTokenUrl, {
        body: '{"refresh_token_ttl_secs":3600,"token_ttl_secs":600}',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const json = await response.json();
      setData(json);
      tokenReceived = json;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      makeCall(tokenReceived.data.token);
    }
  };

  async function makeCall(token: string) {
    let room;
    console.log(`Token being provided: ${token}`);

    // Replace this with the client token you generated previously.
    const context = '{"id":99999,"username":"React Native User"}';

    room = await initialize({
      roomId: ROOM_ID,
      clientToken: token,
      context: context,
      logLevel: 'DEBUG',
    });
    setRoom(room);

    // you are connected to the room
    room.on("connected", (state) => {
      let receivedState = state as State 
      console.log(`connected to the room... ` + JSON.stringify(receivedState));
      
      // Once we are connected we can access the list of participants that are already connected to the room.
      const remoteParticipants = state.participants;
      remoteParticipants.forEach((item) => {
        const remoteParticipant = state.participants.get(item.participantId);
        console.log(`participant connected ` + item);
      });

      // We can also access the list of streams available and subscribe to them if need it.
      state.streams.forEach((stream) => {
        if (stream.participantId === room.getLocalParticipant().id) {
          return;
        }

        room.addSubscription(stream.participantId, stream.key, {
          audio: true,
          video: true,
        });
      });
    });

    // a remote participant has joined the room
    room.on("participant_joined", (participantId, state) => {
      const remoteParticipant = state.participants.get(participantId);
      console.log(`participant ${remoteParticipant.context} joined...`);
    });

    // a stream has been published to the room
    room.on("stream_published", async (participantId, streamKey, state) => {
      // ignore streams that are published by the local participant
      // we only care about remote stream from other remote participant
      let participant = state.participants.get(participantId);
      if (participant.origin === "local") {
        return;
      }

      // the remote stream is identified using the participantId and streamKey
      // you need to subscribe to a remote stream in order to access it's `MediaStreamTrack`s
      await room.addSubscription(participantId, streamKey, {
        audio: true,
        video: true
      });

      console.log(
        `subscription to the: ${participantId} ${streamKey} has been added...`
      );
    });

    // a subscription to a remote stream has started
    room.on("subscription_started", (participantId, streamKey, state) => {
      console.log(
        `subscription to the: ${participantId} ${streamKey} stream started...`
      );

      let receivedState = state as State 
      console.log(`Subscription started :: State .. ` + JSON.stringify(receivedState));

      // use a helper method to easily access a remote participants' stream
      let remoteStream = room.getParticipantStream(participantId, streamKey);

      let remoteMediaStream = new MediaStream([
        remoteStream.audioTrack,
        remoteStream.videoTrack
      ]);

      // Add participant stream from participant stream array 
      updateStreamMap(participantId, remoteMediaStream)
    });


    // a subscription to a remote stream has ended
    room.on("subscription_ended", (participantId, streamKey, state) => {
      console.log(
        `subscription to the: ${participantId} ${streamKey} stream ended...`
      );

      deleteFromStreamMap(participantId)
    });

    await room.connect();
  }

  const verifyPermissions = async () => {
    if (Platform.OS == 'android') {
      let perm = [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ];
      let permissionStatuses = await requestMultiple(perm);
      console.log('obj', permissionStatuses);
      const result = permissionStatuses[perm[0]];
      if (result !== 'granted') {
        Alert.alert(
          'Insufficient permissions!',
          'You need to grant camera and library access permissions to use this app.',
          [{ text: 'Okay' }],
        );
        return false;
      }
      return true;
    } else {
      let perm = [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE];
      let permissionStatuses = await requestMultiple(perm);
      console.log('obj', permissionStatuses);
      const result = permissionStatuses[perm[0]];
      if (result !== 'granted') {
        Alert.alert(
          'Insufficient permissions!',
          'You need to grant camera and library access permissions to use this app.',
          [{ text: 'Okay' }],
        );
        return false;
      }
      return true;
    }
  };

  const onPressPublish = async () => { 
    try {
      let callerStream = await mediaDevices.getUserMedia({
        audio: true,
        video:true, 
      });
      console.log('got local stream using getUserMedia...');

      // Get audio and video tracks from the MediaStream's
      // since the sdk works with MediaStreamTrack
      let callerAudioTrack = callerStream.getAudioTracks()[0];
      let callerVideoTrack = callerStream.getVideoTracks()[0];

      await room.addStream('self', {
        audio: callerAudioTrack,
        video: callerVideoTrack,
      });

      setStream(callerStream.toURL());
    } catch (e) {
      console.error("Unable to publish stream...");
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.box}>
        <Button
          title="Start"
          onPress={onPressPublish} />
      </View>
      {
        <FlatGrid
          data={Array.from(participantStreamMaps.values())}
          style={styles.gridView}
          itemDimension={130}
          spacing={10}
          renderItem={({ item }) =>
            <SafeAreaView style={styles.remoteStreamBox}>
              <RTCView
                mirror={false}
                objectFit={'contain'}
                streamURL={item.toURL()}
                style={{ width: '100%', height: '100%' }}
                zOrder={1}
              />
            </SafeAreaView>}
          keyExtractor={item => item.toURL()}
        />
      }
      <SafeAreaView style={styles.localStreamBox}>
        {
          localStream ?
            <RTCView
              mirror={true}
              objectFit={'contain'}
              streamURL={localStream!}
              style={{ width: '100%', height: '100%' }}
              zOrder={1}
            /> : null
        }
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridView: {
    marginTop: 10,
    flex: 1,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  localStreamBox: {
    width: 400,
    height: 300,
    marginVertical: 20,
  },
  remoteStreamBox: {
    width: 200,
    height: 125,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});
