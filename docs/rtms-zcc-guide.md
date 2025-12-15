Introduction
Realtime Media Streams (RTMS) is a data pipeline that gives your app access to live audio from Zoom Contact Center (ZCC) calls.
Once the interaction stream data has been collected, use AI or machine learning applications to extract insights or generate structured outputs. For instance, you can use the RTMS data to create compliant, regulation-ready transcripts of Zoom Contact Center interactions.
Features
RTMS provides a more streamlined way to collect streaming data from Zoom Contact Center interactions.
- Apps can auto-start when users join calls.
- You can use REST APIs to manually start streams.
RTMS provides a complete timeline of contact center events by delivery
- Separated audio for individual and merged tracks
- Signaling events, timestamps, and contact center metadata
- Participant events when participants join or leave a call
To get started using RTMS, see Getting started with Realtime Media Streams for Zoom Contact Center.
Getting started
Getting started with Realtime Media Streams for Zoom Contact Center
Use Realtime Media Streams (RTMS) to access media from Zoom Contact Center calls. Once RTMS is enabled on your account, you create an app, add RTMS scopes to the app, and then start developing your app to use RTMS. After you've developed your app, you can use it to launch RTMS streams and start receiving RTMS data.
Streams launch automatically when an agent or consumer connect.
To start using RTMS
Follow these steps to start using RTMS.
1. To add RTMS to your app, you need to add the corresponding RTMS scopes to your app. For more information, see Add Realtime Media Streams to your app.
2. Now that your app has RTMS scopes, you can start getting media data from your Zoom Contact Center calls. For more information, see
    - Sample Apps
Add Realtime Media Streams to your app
Once Realtime Media Streams (RTMS) has been added to your account, you need to create a new general app and add RTMS to it, or add RTMS to an existing app. For more information on creating an app, see Quick start guide in the Build your app guide.
To add RTMS to your app, you'll need to add
- Event subscriptions for RTMS started and stopped events
- Scopes for the media you want to access
Create an app
To use RTMS, you'll need to create a General app on the Zoom App Marketplace that you can then add RTMS features to. For more information on creating an app, see Quick start guide in the Build your app guide.
Subscribe to RTMS started and stopped events
RTMS uses event subscriptions to notify your app when a session starts and stops in a meeting. Use these events to work with RTMS streams.
To subscribe to RTMS events
1. Sign into the Zoom App Marketplace.
2. To go to the app, in the upper-right of the screen, choose Manage.
3. Select your app from the list.
4. In the navigation pane, choose Access.
5. In the General Features section, turn on Event Subscription.
6. Set up the event subscription
    1. Give your subscription a name.
    2. Choose Add Events, search for RTMS, and select the events you want to subscribe to. We recommend subscribing to all of the available ones, but you'll need RTMS Started and RTMS Stopped for RTMS to work.
    3. Choose Done.
7. Enter the Event notification endpoint URL where you'll receive events.
8. Choose Save.
Now that you've added event subscriptions to your account, you'll need to add RTMS scopes.
Add ZCC RTMS scopes to your app
Your app will also require scopes to receive audio data. Scopes tell the media servers which data to send from Contact Center calls.
Your app will need Granular scopes to use RTMS scopes. Granular scopes are the default for new apps, but older apps might need them to be enabled. Update your app if you do not see RTMS scopes in your list of available scopes.
To add scopes to your app
1. Sign into the Zoom App Marketplace.
2. To go to the app, in the upper-right of the screen, choose Manage.
3. Select your app from the list.
4. In the navigation pane, choose Scopes.
5. Choose + Add Scopes, search for RTMS, and select the scopes you want to add. For example, if you want to get audio data, add the contact_center:read:zcc_voice_audio scope.
(Optional) Add REST APIs for session status
RTMS can also be started and stopped using a REST API call from your app to Update engagement Real-Time Media Streams (RTMS) app status. This allows your app to start an RTMS session for a participant with an access token.
Using this endpoint requires the contact_center:update:engagement_rtms_app_status scope. For more information about adding scopes, see Add ZCC RTMS scopes to your app
This REST API is currently only available for apps used by meeting hosts.
Working with streams
Each RTMS stream follows a predictable flow that starts with at least one RTMS session being started; continues while your app connects to the required servers, receives stream data, and maintains connection; and ends when the stream ends. A stream can have multiple sessions happening within it, each session typically corresponds to an individual user.
Sessions can exist in the following states:


State

INACTIVE
Default state. The session is not active yet.
INITIALIZE
The session is initializing.
STARTED
The session has started.
PAUSED
The session has been paused either by the consumer or the user.
RESUMED
The paused session has been resumed.
STOPPED
The session is being stopped by the consumer, user, or the call ending.
Prerequisites
To process RTMS data, your app needs the appropriate event subscriptions, scopes, and, optionally, the REST APIs for starting and managing sessions. For more information, see Add RTMS features to your app.
Once your app is configured, RTMS sessions will follow these steps:
Step 1: RTMS is started
RTMS provides role-based controls to manage the streaming experience. You can set apps to auto-start streams when a user in a queue joins a voice engagement or to start manually by using the REST API.
In addition, the streaming experience is also controlled by:
- Admins can manage the auto-start settings for Queues through the ZCC Admin portal
- Users can manually start, pause, and end their own in-call streams.
Step 2: App receives streaming notification
Zoom sends contact_center.voice_rtms_started webhook events when RTMS streaming starts. You can then use the information in the event to establish a signaling connection in the next step.
To receive notifications when new streams are available, create an HTTP POST handler in your web app. This handler acts as the endpoint for incoming webhook events. In your app settings, provide the URL of this endpoint. For more information, see Subscribe to RTMS started and stopped events.
After you receive an event, verify the event's signature to ensure it’s from a trusted source.
Step 3: App establishes signaling connection
Establishing a signal connection to an RTMS server enables your app to establish and manage a WebSocket connection with the RTMS server. It begins with a signed handshake and includes messages for session readiness, state updates, and stream control.
The signal connection provides lifecycle updates for the media connection, such as when it starts, stops, or encounters an interruption event.
When you have the connection details and know a stream is available, you can start the connection to the signaling server.
1. Run the following command to create a signature that your app will use to securely connect to the RTMS server; replacing client_id and secret with your app's Client ID and Client Secret, and engagement_id and rtms_stream_id with the engagement_id and rtms_stream_id from the streaming notification event.
    HMACSHA256(client_id + "," + engagement_id + "," + rtms_stream_id, secret);
2. Your app sends a signaling handshake request with the engagement_id and rtms_stream_id from the streaming notification event and the signature you just created. If the handshake is successful, your app will receive a signaling handshake response confirming the connection and containing the media server locations.
    If the handshake fails, the server responds with a SIGNALING_HAND_SHAKE_RESP message containing a status code and reason.
3. (Optional) Your app can Subscribe to in-meeting events for participant changes and active speaker updates.
Once your app has successfully established a signaling connection, it can now establish a media connection.
Step 4: App establishes the media connection
Use one of the URLs list in media_server.server_urls in the signaling handshake response to establish a media WebSocket connection.
Use integers for message and event types
For data type definitions, use the representative enum integers.
Example: Send msg_type: 1 ✓ not msg_type: SIGNALING_HAND_SHAKE_REQ ✗

1. Your app sends a media handshake request with the engagement_id and rtms_stream_id from the streaming notification and the signature you created in Step 3 above. If the handshake is successful, your app will receive a media handshake response confirming the connection and containing information about the available media.
If the handshake fails, the server responds with a SIGNALING_HAND_SHAKE_RESP message containing a status code and reason.
2. Your app sends a client ready ACK message to the RTMS server media connection to indicate readiness to receive media.
Now that the connection is made, your app can receive media data.
Step 5: App receives media data
Once the connection is established, your app receives continuous streams of:
- Audio data from engagement participants
For more information about working with media data, see Handling media data.
Step 6: App maintains connections
Throughout the session, your app must:
- Respond to keep-alive requests to maintain stable connections (sent every 10 seconds when no data is flowing)
- Monitor session state updates for pauses, resumes, or interruptions
- Handle stream state changes for connection issues or termination
Connection maintenance is critical: If your app fails to respond to three consecutive keep-alive requests (sent every 10 seconds during idle periods), the RTMS server will terminate the connection.
If a connection has been interrupted, see Failover and reconnection for more information on reestablishing the connection.
Step 7: Stream ends
The RTMS stream ends when:
- The call concludes
- The user manually stops streaming
- Connection issues cause termination
- App users leave the meeting
Your app receives a contact_center.voice_rtms_stopped notification indicating the stream has ended.
Failover and reconnection
The connection between the RTMS server and the app can unexpectedly be interrupted.
Lost connection between the RTMS server and the app
The connection between the RTMS server and the app can be lost if either the RTMS server or the app have issues.
RTMS server issue
If the RTMS server goes down, the new RTMS server will send a new contact_center.voice_rtms_started event, which includes the engagement_id and rtms_stream_id. Your app must then establish new connections. For more information, see App establishes the signaling connection and App establishes the media connection.
App issue
If an app encounters downtime or network issues, it must establish new socket connections to the RTMS server.
- When the signal connection is down, the RTMS server will interrupt both signal and data sockets with the app. The RTMS server will send a contact_center.voice_rtms_interrupted event and the app must then re-establish the signaling and media connections. For more information, see App establishes the signaling connection and App establishes the media connection.
- When only the data socket connection(s) is down and the signaling socket remains active, the RTMS server will send an event update with event type MEDIA_CONNECTION_INTERRUPTED message through the signaling connection and notify the app which media connection is disconnected. The app must then re-establish only the corresponding media connection. For more information, see App establishes the media connection.

Handling media data
Realtime Media Streams (RTMS) delivers audio data from Zoom Contact Center calls over WebSocket connections between your application and the RTMS servers.
After establishing a connection to the RTMS server, your application receives media data based on:
- The scopes configured for your app
- The formats specified in your media handshake request
Audio
Audio data is available per participant and as a merged packet of all participants.
The RTMS server sends audio data packets from participants in base64-encoded binary format.
Each packet of data contains the user's participant unique identifierchannel_id, and the timestamp of the audio data. Your app can use the channel_id to associate the user metadata, because we already send the metadata of each participant through events at the beginning of the session.
Example audio packet:
{
  "msg_type": 14,
  "content": {
        "channel_id": "123abc"
        "data": "Hw1kDacNAA4sDkMOAQ5eDekMgAzXCw0L4Al4CDwHBAayBEwDmwHD/wn+rfyQ+3z6Z/k4+Ef3jvb09aj1YPUF9QL1OfVt9eH1f/YE96P3jPib+dX6Pvyr/ef+IABcAZ4CmQN3BFAF6QVxBs0G9wbjBqYGXwYFBm8FxwT/Aw4DHAIkARYA7v6o/T382/qq+YD4fPd99mz1p/Qq9KTzcfNv807zcPPQ8z70yfQ89az1SPbO9m/3Lfjf+I75M/rz+pT7KPzs/In9Fv7G/lP/q/8GAG4AtgBHAcABDQKtAkwDIgRQBYQGrgfyCEgKigvDDP4NFw/8D78QhBErEqoS/BL5EsYSfRLnEXARwhCMD1kO8ww8C5gJ5gfrBe8D3AGp/7P9IPyY+hL5t/dl9mv10fQ89NjzvvO78/HzbfTb9F71I/bw9vL3Kvlh+pX71/wr/m//owDCAbQCkwNoBPYEYQWxBZ0FZQUdBYkEBgRkA64CAgIdAT0AZf+T/tD93vz9+xf7B/o8+WX4pvcE90L2n/VM9d70pPSe9IL0nfTa9BX1cfXK9QP2S/a69hH3cPfx91P4w/hO+cr5XPr2+l/71/t9/AP9f/0R/p/+Pv/5/7IAWAH+AeMCAwQ7BaAG+wcmCZEKKQy8DT4PWhBXEVYSVBOgFM0VMxZSFhYW4BXTFUMVNBSzEtIQJg99Da0LogkXB40ESgJCAHj+ivyA+qn4KfcH9hr1JvRf89byq/Lt8kjzhvPy85P0n/X/9kn4lvni+kj84P1S/4wAuwHUAvcD9wS/BUwGaAZcBmcGTQb5BUkFQgQzAzkCVQEgALX+U/3N+4L6XfkU+Nj2o/WB9MTzOfO38g=="，
        "timestamp": 1738392033699
    }
  }
}
Send rate
The default interval is 20ms between audio packets. You can configure this in multiples of 20ms, up to a maximum of 1000ms. If you specify an internal above 1000ms in handshake requests, RTMS will change it to 1000ms.
Timestamps
Timestamps denote the creation time on Zoom's server. The timestamp for each audio packet changes relative to the send_rate defined by the handshake request.
If the send_rate is set to 20ms (default), the timestamp for each audio packet will change by 20ms.
When working with streaming audio, timestamps are useful in determining the sequence of messages. Use timestamps to
- Infer the period of time where a user might be muted
- Match timestamps with video and screen share data to combine, or mux, the audio, video, and screen share frames
User IDs and timestamps
When selecting multiple streams, your application will receive an audio stream for each participant in the meeting. By sending separate streams, RTMS enables your app to perform audio mixing, isolation, and individual analysis.
Each user in the meeting will have a unique user_id and their own incremental timestamp.
For merged audio, the user_id will be 0.
Best practices
When a call starts, capture the first timestamp from the signaling connection. This denotes the start of the call.
When participants mute their microphones, the RTMS server stops sending audio packets for that user. Use timestamps to detect these gaps and insert silence if needed for your application.
When working with pulse-coded modulation (PCM) audio consider the following:
- The size of raw PCM buffer and the storage it might take up without compression
- That you may need to convert the audio to WAV format to utilize services such as live streaming or speech to text transcription.
- That compression to lossy formats, such as mp3, requires the entire audio file to be completed before compression. We recommend you compress the audio after the meeting has ended.
Sample apps
We have provided a variety of sample apps on GitHub to help you explore Realtime Media Streams (RTMS). Use these apps as is to implement RTMS or use them as the foundation of your app and adjust them to meet your needs.
References
Event reference
The Realtime Media Streams (RTMS) events and messages included here outline how your app and RTMS work together to receive call updates, establish signaling and media connections, manage session states, handle keep-alive requests, and receive media data.
This message classification table outlines the messages that RTMS currently supports, and their corresponding transmission channels.


Signaling connection
Media connection
SIGNALING_HAND_SHAKE_REQ
SIGNALING_HAND_SHAKE_RESP
DATA_HAND_SHAKE_REQ
DATA_HAND_SHAKE_RESP
EVENT_SUBSCRIPTION
EVENT_UPDATE
CLIENT_READY_ACK
STREAM_STATE_UPDATE
SESSION_STATE_UPDATE
SESSION_STATE_REQ
SESSION_STATE_RESP
KEEP_ALIVE_REQ
KEEP_ALIVE_RESP
STREAM_STATE_REQ
STREAM_STATE_RESP
KEEP_ALIVE_RESP
MEDIA_DATA_AUDIO
Signaling handshake request
Sent to the signaling connection
Send a signed handshake request to the server_urls provided in the contact_center.voice_rtms_started event, also known as the signaling connection. Use your app credentials with the meeting and session details to generate the signature. For more information, see App establishes signaling connection.
Use contact_center.voice_rtms_started and contact_center.voice_rtms_stopped events in the Webhook reference to get initial session details like the engagement_id and rtms_stream_id.
{
  "msg_type": 1,
  "protocol_version": 1,
  "sequence": 0,
  "engagement_id": "xxxxxxxxxx",
  "rtms_stream_id": "xxxxxxxxxx",
  "signature": "xxxxxxxxxx"
}



Field
Type
Description
msg_type
int
The request from the app to the RTMS server to initiate a handshake. For more information, see RTMS_MESSAGE_TYPE.
protocol_version
int
The RTMS design version. By default, it's 1.0.
sequence
int
The sequence number of the message.
engagement_id
string
The meeting instance unique identifier.
rtms_stream_id
string
The unique identifier of the RTMS stream. Multiple streams are possible for a meeting if streaming access stops or restarts.
signature
string
The authentication signature created using app credentials and meeting and session details.
Signaling handshake response
Sent from the signaling connection
The signaling connection will respond with a signaling handshake response that includes the URLs of the media connections.
{
  "msg_type": 2,
  "protocol_version": 1,
  "sequence": 0,
  "status_code": 0,
  "reason": "",
  "media_server": {
      "server_urls": {
          "audio": "wss://127.0.0.0:443",
          "all": "wss://127.0.0.0:443"
      }
  }
}



Field
Type
Description
msg_type
int
The response from the signaling connection to the app after a handshake attempt. For more information, see RTMS_MESSAGE_TYPE.
protocol_version
int
The RTMS design version. By default, it's 1.0.
sequence
int
The sequence number of the message.
status_code
int
The status code of the message. Status 0 means success. For more information, see RTMS_STATUS_CODE.
reason
string
This is empty if successful. If failed, it will contain the reason for the failure.
media_server
object
The media connection information.
server_urls
object
Locations of available media connections. The response will depend on the app's available scopes.

For example, if the app only supports audio, only audio will be included.
Media handshake request
Sent to the media connection
To establish a connection, send a handshake request to the media connections of the RTMS server(s) that were included in the signaling handshake and include the associated media parameters. The media connection responds with confirmed parameters of the requested media types.
Apps can request all available media streams or specify media streams by content type. If all are requested, the signaling connection responds with all media connections available according to the app's requested scopes.
If the app has scopes for audio and transcript only, a request for all media will include audio and transcript data but not video, chat, or screen share data.
To request only one media type, specify that media type in the media_type field. For more information, see MEDIA_DATA_TYPE. Use "media_type": 32 for all.
Media parameters (media_params) are optional. If not specified, the default values will be used.
Media connections have many options!
For more information, see Data type definitions for options on codecs, resolutions, rates, etc.
- All media
{
    "msg_type": 3,
    "protocol_version": 1,
    "sequence": 0,
    "engagement_id": "4xxxxxxxxxx",
    "rtms_stream_id": "xxxxxxxxxx",
    "signature": "xxxxxxxxxx",
    "media_type": 32,
    "media_params": {
        "audio": {
            "content_type": 2,
            "sample_rate": 1,
            "channel": 1,
            "codec": 1,
            "data_opt": 1,
            "send_rate": 100
        }
    }
}
- Audio only
{
    "msg_type": 3,
    "protocol_version": 1,
    "sequence": 0,
    "engagement_id": "4nYtdqLVTVqGJ+QB62ED7Q==",
    "rtms_stream_id": "03db704592624398931a588dd78200cb",
    "signature": "kDBZVzEWgox9tWVBc7DHsjW2OnVD/6H1zN2vdmU9VY8=",
    "media_type": 1,
    "media_params": {
        "audio": {
            "content_type": 2,
            "sample_rate": 1,
            "channel": 1,
            "codec": 1,
            "data_opt": 1,
            "send_rate": 20
        }
    }
}



Field
Type
Description
msg_type
int
The app sends this message to the media connection to request a connection with the specified media parameters. For more information, see RTMS_MESSAGE_TYPE.
protocol_version
int
The RTMS design version. By default, it's 1.0.
sequence
int
The sequence number of the message.
engagement_id
string
The meeting unique instance identifier.
rtms_stream_id
string
The unique identifier of the RTMS stream. Multiple streams are possible for a meeting if streaming access stops or restarts.
signature
string
The authentication signature created using app credentials and meeting and session details.
media_type
int
The media type of the stream, either audio (1) or all (32). For more information, see MEDIA_DATA_TYPE.
media_params (Optional)
object
The media parameters of the stream that define the media formats. Parameters are set to default if not specified and returned in the response.
content_type
int
The content type of the media stream, raw audio (2) For more information, see MEDIA_CONTENT_TYPE.
sample_rate (audio)
int
The sample rate of the audio stream. For more information, see AUDIO_SAMPLE_RATE.
channel (audio)
int
The channel of the audio stream, either mono (1) or stereo (2). For more information, see AUDIO_CHANNEL.
codec (audio)
int
The codec of the audio data. Can be L16 (1), G711 (2), G722 (3), or Opus (4). For more information, see MEDIA_PAYLOAD_TYPE.
data_opt (audio)
int
Defines whether media is separated or merged. For example, mixed audio or separated audio streams. For more information, see MEDIA_DATA_OPTION.
send_rate (audio)
int
The send rate of the audio stream in milliseconds (ms). Must be a multiple of 20, up to 1000 ms.
Media handshake response
Sent from the media connection
The media connection will respond with a media handshake response that includes information about the media connections.
- All media
{
  "msg_type": 4,
  "protocol_version": 1,
  "status_code": 0,
  "reason": "",
  "sequence": 0,
  "payload_encrypted": true,
  "media_params": {
    "audio": {
      "content_type": 2,
      "sample_rate": 1,
      "channel": 1,
      "codec": 1,
      "data_opt": 1,
      "send_rate": 100
    }
  }
}
- Audio only
{
  "msg_type": 4,
  "protocol_version": 1,
  "status_code": 0,
  "reason": "",
  "sequence": 0,
  "payload_encrypted": true,
  "media_params": {
    "audio": {
      "content_type": 2,
      "sample_rate": 1,
      "channel": 1,
      "codec": 1,
      "data_opt": 1,
      "send_rate": 100
    }
  }
}



Field
Type
Description
msg_type
int
The response from the media connection to the app after a handshake attempt.. For more information, see RTMS_MESSAGE_TYPE.
protocol_version
int
The RTMS design version. By default, it's 1.0.
status_code
int
The status code of the message. Status 0 means success. For more information, see RTMS_STATUS_CODE.
reason
string
This is empty if successful. If failed, it will contain the reason for the failure.
sequence
int
The sequence number of the message.
payload_encryption (Optional)
bool
Default is false for any TLS connection. The encryption keys in the signaling handshake response message. If true, the payload is encrypted. If false, but the payload protocol is UPD, and the payload will still be encrypted.
content_type
int
The content type of the media. For more information, see MEDIA_CONTENT_TYPE.
sample_rate
int
The sample rate of the audio stream. For more information, see AUDIO_SAMPLE_RATE.
channel
int
The channel of the audio stream, either mono (1) or stereo (2). For more information, see AUDIO_CHANNEL.
codec
int
The codec of the audio data. Can be L16 (1), G711 (2), G722 (3), or Opus (4). For more information, see MEDIA_PAYLOAD_TYPE.
data_opt
int
Defines whether media is separated or merged. For example, mixed audio or separated audio streams. For more information, see MEDIA_DATA_OPTION.
send_rate
int
The send rate of the audio stream in milliseconds (ms). Must be a multiple of 20. Can be up to 1000 ms.
Client ready ACK message
Sent to the signaling connection
After the app receives the data handshake response from the media connection, it needs to send a client ready ack to the signaling connection to indicate that the full handshake has completed and that it is ready to receive media data.
This message should be sent after the signaling and media connections have been established.
{
  "msg_type": 7,
  "rtms_stream_id": "xxxxxxxxxx"
}



Field
Type
Description
msg_type
int
The app sends this message to the signaling connection to acknowledge that the server is ready to receive media. For more information, see RTMS_MESSAGE_TYPE.
rtms_stream_id
string
The unique identifier for the RTMS stream.
Keep-alive request
Sent from the media connection
To maintain stable connections and prevent timeouts, RTMS servers send a keep-alive request to both the signaling and media connections every 10 seconds.
When three keep-alive requests are unanswered, the RTMS server takes different actions for the different connection types.
- Signaling connection - The RTMS server will interrupt both the signaling and media connections, wait for one minute to allow for reconnection, and, if the connection is not restored, it will end the RTMS stream.
- Media connections - The RTMS server will interrupt the media connection, wait for 30 seconds to allow for reconnection, and, if the connection is not restored, it will end the RTMS stream.
If an app doesn't receive a keep-alive request for 30 seconds, we recommend that the app reestablish the connection by resending the signaling handshake request. For more information, see Working with streams.
The RTMS server sends the following request to confirm the app wants to maintain a connection.
{
  "msg_type": 12,
  "timestamp": 1727384349123
}



Field
Type
Description
msg_type
int
The media connection sends this message to confirm the app wants to maintain a connection. For more information, see RTMS_MESSAGE_TYPE.
timestamp
unsigned long long
The Unix timestamp of the request.
Keep-alive response
Sent to the media connection
To maintain the connection, an app should respond to the request with the following response. The timestamp in the response must match the request.
{
  "msg_type": 13,
  "timestamp": 1727384349123
}



Field
Type
Description
msg_type
int
The app sends this message to the media connection to maintain a connection. For more information, see RTMS_MESSAGE_TYPE.
timestamp
unsigned long long
The Unix timestamp of the keep-alive request.
Subscribe to in-meeting events
Sent to the signaling connection
Send this message to the signaling connection to get data about in-meeting behavior:
- Active speaker change. - "event_type": 2
- Participant join. - "event_type": 3
- Participant leave. - "event_type": 4
This message does not require a response.
{
  "msg_type": 5,
  "events": [
    {
      "event_type": 2,
      "subscribe": true
    },
    {
      "event_type": 3,
      "subscribe": true
    },
    {
      "event_type": 4,
      "subscribe": true
    }
  ]
}



Field
Type
Description
msg_type
int
The app sends this message to the signaling connection to subscribe or unsubscribe to in-meeting events from the signaling connection. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The type of event to subscribe to. For more information, see RTMS_EVENT_TYPE.

Active speaker changes (2) - provides timestamps for when a user is the primary participant speaking (green box around their tile in the meeting).

Participant joins events (3) - provides timestamps for when a user enters the meeting and helps provide identifiers.

Participant leaves events (4) - provides a timestamp for when a user leaves a meeting, including when it ends.
subscribe
bool
A boolean.
True - subscribe to events
False - unsubscribe from events
Audio data
Sent from the media connection
Audio data from the media connection of a participant in a meeting. It can be either merged audio or individual audio.
- Raw audio
{
    "msg_type": 14,
    "content": {
        "channel_id" : "123"
        "data": "xxxxxx"
        "timestamp": 1738392033699
    }
}



Field
Type
Description
msg_type
int
Audio data sent from the media connection. For more information, see RTMS_MESSAGE_TYPE.
channel_id
int
The unique identifier of the participant whose audio is included in the data.
data
string
Audio data, base64-encoded binary.
timestamp
unsigned long
The Unix timestamp of the data.
Session state updated
Sent from the signaling connection
The signaling connection sends session state updated events when a new session is added or the state of a session is changed. A session can stop and resume during a stream. This message does not require a response from the app.
The STARTED state means a brand-new session has started. Record the session information locally since the state of each session is changed separately.
{
  "msg_type": 9,
  "state": 1,
  "stop_reason": 1,
  "timestamp": 1727384349123,
  "rtms_session_id": "xxxxxxxxxx",
}



Field
Type
Description
msg_type
int
The signaling connection sends this message when a session has been updated. For more information, see RTMS_MESSAGE_TYPE.
state
int
The state of a session within a stream, including if a participant or host has started, paused, resumed or stopped a session. For more information, see RTMS_SESSION_STATE.
reason
int
Describes why a session status has been updated. It's only sent if session state stops. For more information, see RTMS_STOP_REASON.
timestamp
unsigned long
The Unix timestamp of when the session was updated.
rtms_session_id
string
The unique identifier for the RTMS session.
Session state request
Sent to the signaling connection
Apps send the session state request event to the signaling connection to query the current session state. The signaling connection will respond with the current session state.
{
  "msg_type": 10,
  "rtms_session_id": "xxxxxxxxxx"
}



Field
Type
Description
msg_type
int
The app sends this message to query the current state of the session. For more information, see RTMS_MESSAGE_TYPE.
rtms_session_id
string
The unique identifier for the RTMS session.
Session state response
Sent from the signaling connection
The signaling connection sends the session state response event in response to a session state request event.
{
  "msg_type": 11,
  "rtms_session_id": "xxxxxxxxxx",
  "state": 1
  "timestamp": 1727384349123,
}



Field
Type
Description
msg_type
int
The signaling connection sends this field as a response to the query for the state of the current session. For more information, see RTMS_MESSAGE_TYPE.
rtms_session_id
string
The unique identifier for the RTMS session.
state
int
The state of the current session. For more information, see RTMS_SESSION_STATE.
timestamp
unsigned long
The Unix timestamp of the request. Use this to pair requests and responses.
Stream state request
Sent to the signaling connection
Apps send the current stream state request event to the signaling server to query the current stream state. Streams can be in one of the following states: inactive, active, interrupted, terminating, terminated, paused, or resumed.
{
    "msg_type": 19,
    "rtms_stream_id": "756FF58A-6332-6ECA-E4AE-21F2ABDCB485"
}



Field
Type
Description
msg_type
int
The app sends this message to query the current state of the state. For more information, see RTMS_MESSAGE_TYPE.
rtms_stream_id
string
The unique identifier of the RTMS stream.
Stream state response
Sent from the signaling connection
The signaling connection sends the stream state response event in response to a stream state request event.
{
  "msg_type": 20,
  "state": 1,
  "rtms_stream_id": "756FF58A-6332-6ECA-E4AE-21F2ABDCB485",
  "timestamp": 1694204592
}



Field
Type
Description
msg_type
int
The signaling connection sends this message as a response to the query for the state of the current stream. For more information, see RTMS_MESSAGE_TYPE.
state
int
The current state of the RTMS stream. For more information, see RTMS_STREAM_STATE.
rtms_stream_id
string
The unique identifier for the RTMS stream.
timestamp
unsigned long long
The Unix timestamp of the request. Use this to pair requests and responses.
Stream state updated
Sent from the signaling connection
{
  "msg_type": 8,
  "state": 1,
  "reason": 1,
  "timestamp": 1727384349123
}



Field
Type
Description
msg_type
int
The signaling connection sends this message when a stream has been updated. For more information, see RTMS_MESSAGE_TYPE.
state
int
The state of a stream, including if a stream is active, experiencing connection issues, or needs to be terminated. For more information, see RTMS_STREAM_STATE.
reason
int
Describes why a stream status has been updated. For more information, see RTMS_STOP_REASON.
timestamp
unsigned long long
The Unix timestamp of when the stream was updated.
First timestamp from the signaling connection
Sent from the signaling connection
After the signaling connection connects, it sends a message to the app with the first timestamp. Use this timestamp as the start of the session. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": 1,
    "timestamp": 1727384349123
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app to provide the first timestamp for the connection. For more information, see RTMS_MESSAGE_TYPE.

event_type
int
The first timestamp event. For more information, see RTMS_EVENT_TYPE.
timestamp
unsigned long long
The Unix timestamp sent by the signaling connection.
Consumer answered
Sent from the signaling connection
The signaling connection sends consumer answered events that provide timestamps for when a consumer answered a call. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": CONSUMER_ANSWERED,
    "event_ts": 1727384349123,
    "paticipant_info": {
        "channel_id":"123abc",
        "participant_mode":"caller",
        "queue_id": "xqJE_cgERLyAJHYYL5LLeg",
        "queue_name": "My Queue",
        "phone_number": "+18005550101",
        "user_id": "szCyubr_aQhieHNWYbAGMYg",
        "display_name": "Jane Doe"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
channel_id
string
The ID of the call. The consumer and the agent will have unique channel IDs.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
phone_number
string
The phone number of the caller.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.
User answered
Sent from the signaling connection
The signaling connection sends user answered events that provide timestamps for when a user answered a call. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": USER_ANSWERED,
    "event_ts": 1727384349123,
    "paticipant_info": {
        "channel_id":"456edf",
        "participant_mode":"callee"
        "queue_id": "ddJE_cgERLyAJCYYL5L4ce",
        "queue_name": "ABC Queue",
        "user_id": "u2hfFEIO3gQ2i-WjoGEA72dh",
        "display_name": "TOM AA"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
channel_id
string
The ID of the call. The consumer and the agent will have unique channel IDs.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.

User hold
Sent from the signaling connection
The signaling connection sends user hold events that provide timestamps for when a user puts a call on hold. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": USER_HOLD,    
    "event_ts": 1627906944384,
    "paticipant_info": {
        "channel_id":"456edf",
        "participant_mode":"callee"
        "queue_id": "ddJE_cgERLyAJCYYL5L4ce",
        "queue_name": "ABC Queue",
        "user_id": "u2hfFEIO3gQ2i-WjoGEA72dh",
        "display_name": "TOM AA"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
channel_id
string
The ID of the call. The consumer and the agent will have unique channel IDs.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.
User unhold
Sent from the signaling connection
The signaling connection sends user unhold events that provide timestamps for when a user takes a call off hold. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": USER_UNHOLD,
    "event_ts": 1627906944384,
    "paticipant_info": {
        "channel_id":"456edf",
        "participant_mode":"callee",
        "queue_id": "ddJE_cgERLyAJCYYL5L4ce",
        "queue_name": "ABC Queue",
        "user_id": "u2hfFEIO3gQ2i-WjoGEA72dh",
        "display_name": "TOM AA"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
channel_id
string
The ID of the call. The consumer and the agent will have unique channel IDs.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.
Consumer ended
Sent from the signaling connection
The signaling connection sends consumer ended events that provide timestamps for when a consumer ended a call. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": CONSUMER_ENDED,
    "event_ts": 1627906944384,
    "paticipant_info": {
        "participant_mode":"callee",
        "queue_id": "xqJE_cgERLyAJHYYL5LLeg",
        "queue_name": "My Queue",
        "phone_number": "+18005550101",
        "user_id": "szCyubr_aQhieHNWYbAGMYg",
        "display_name": "Jane Doe"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
phone_number
string
The phone number of the caller.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.
User ended
Sent from the signaling connection
The signaling connection sends consumer ended events that provide timestamps for when a user ended a call. This message does not require a response from the app.
{
  "msg_type": 6,
  "event": {
    "event_type": USER_ENDED,
    "event_ts": 1627906944384,
    "paticipant_info": {
        "channel_id":"123abc",
        "participant_mode":"callee",
        "queue_id": "ddJE_cgERLyAJCYYL5L4ce",
        "queue_name": "ABC Queue",
        "user_id": "u2hfFEIO3gQ2i-WjoGEA72dh",
        "display_name": "TOM AA"
    }
  }
}



Field
Type
Description
msg_type
int
The signaling connection sends this message to the app when the active speaker changes. For more information, see RTMS_MESSAGE_TYPE.
event_type
int
The active speaker changed event. For more information, see RTMS_EVENT_TYPE.
event_ts
unsigned long
The Unix timestamp of the event.
channel_id
string
The ID of the call. The consumer and the agent will have unique channel IDs.
participant_mode
string
Who initiated this event.
queue_id
string
The unique identifier for the queue.
queue_name
string
The name of the queue.
user_id
string
The unique ID of the agent.
display_name
string
The display name of the agent.
Data type definitions
Use the Realtime Media Streams (RTMS) data type definitions included here as a reference for event signaling and metadata requests and responses.
NOTE: Use integers for message and event types
For data type definitions, use the representative enum integers.
Example: Send msg_type: 1 ✓ not msg_type: SIGNALING_HAND_SHAKE_REQ ✗
RTMS_MESSAGE_TYPE
Indicates the type of message in signaling handshake requests and responses, event subscription requests, metadata exchanges, and session status control commands.
enum RTMS_MESSAGE_TYPE
{
   UNDEFINED = 0,
   SIGNALING_HAND_SHAKE_REQ = 1,   // Signaling connection handshake request
   SIGNALING_HAND_SHAKE_RESP = 2,  // Response to signaling connection handshake request
   DATA_HAND_SHAKE_REQ = 3,        // Media data connection handshake request
   DATA_HAND_SHAKE_RESP = 4,       // Response of media data connection handshake request
   EVENT_SUBSCRIPTION = 5,     	   // Events to subscribe or unsubscribe to
   EVENT_UPDATE = 6,               // Specific event occurred
   CLIENT_READY_ACK = 7,           // Client ready to receive media data
   STREAM_STATE_UPDATE = 8,        // Stream state changed
   SESSION_STATE_UPDATE = 9,       // Session state updated, e.g. paused/resumed
   SESSION_STATE_REQ = 10,    	   // Request the session state
   SESSION_STATE_RESP = 11,        // Response of the session state request
   KEEP_ALIVE_REQ = 12,            // Keep-alive request message
   KEEP_ALIVE_RESP = 13,           // Keep-alive response message
   MEDIA_DATA_AUDIO = 14,          // Audio data is being transmitted
   STREAM_STATE_REQ = 19,          // Request the stream state
   STREAM_STATE_RESP = 20          // Response to the stream state request
}
RTMS_EVENT_TYPE
Indicates the type of event captured in the metadata from the signaling connection.
enum RTMS_EVENT_TYPE
{
    UNDEFINED = 0,
    FIRST_PACKET_TIMESTAMP = 1,      // Indicates the first packet capture timestamp
    ACTIVE_SPEAKER_CHANGE = 2,       // Indicates the most recent active speaker
    PARTICIPANT_JOIN = 3,            // New participant joined this meeting
    PARTICIPANT_LEAVE = 4,           // Participant is leaving this meeting
    MEDIA_CONNECTION_INTERRUPTED = 7 // A media type connection was interrupted
}
RTMS_STATUS_CODE
Indicates the status of handshake requests.
enum RTMS_STATUS_CODE
{
   STATUS_OK = 0,
   STATUS_CONNECTION_TIMEOUT = 1,
   STATUS_INVALID_JSON_MSG_SIZE = 2,
   STATUS_INVALID_JSON_MSG = 3,
   STATUS_INVALID_MESSAGE_TYPE = 4,
   STATUS_MSG_TYPE_NOT_EXIST = 5,
   STATUS_MSG_TYPE_NOT_UINT = 6,
   STATUS_engagement_id_NOT_EXIST = 7,
   STATUS_engagement_id_NOT_STRING = 8,
   STATUS_engagement_id_IS_EMPTY = 9,
   STATUS_RTMS_STREAM_ID_NOT_EXIST = 10,
   STATUS_RTMS_STREAM_ID_NOT_STRING = 11,
   STATUS_RTMS_STREAM_ID_IS_EMPTY = 12,
   STATUS_SESSION_NOT_FOUND = 13,
   STATUS_SIGNATURE_NOT_EXIST = 14,
   STATUS_INVALID_SIGNATURE = 15,
   STATUS_INVALID_MEETING_OR_STREAM_ID = 16,
   STATUS_DUPLICATE_SIGNAL_REQUEST = 17,
   STATUS_EVENTS_NOT_EXIST = 18,
   STATUS_EVENTS_VALUE_NOT_ARRAY = 19,
   STATUS_EVENT_TYPE_NOT_EXIST = 20,
   STATUS_EVENT_TYPE_VALUE_NOT_UINT = 21,
   STATUS_MEDIA_TYPE_NOT_EXIST = 22,
   STATUS_MEDIA_TYPE_NOT_UINT = 23,
   STATUS_MEDIA_TYPE_AUDIO_NOT_SUPPORT = 24,
   STATUS_MEDIA_TYPE_VIDEO_NOT_SUPPORT = 25,
   STATUS_MEDIA_TYPE_DESKSHARE_NOT_SUPPORT = 26,
   STATUS_MEDIA_TYPE_TRANSCRIPT_NOT_SUPPORT = 27,
   STATUS_MEDIA_TYPE_CHAT_NOT_SUPPORT = 28,
   STATUS_MEDIA_TYPE_INVALID_VALUE = 29,
   STATUS_MEDIA_DATA_ALL_CONNECTION_EXIST = 30,
   STATUS_DUPLICATE_MEDIA_DATA_CONNECTION = 31,
   STATUS_MEDIA_PARAMS_NOT_EXIST = 32,
   STATUS_INVALID_MEDIA_PARAMS = 33,
   STATUS_NO_MEDIA_TYPE_SPECIFIED = 34,
   STATUS_INVALID_MEDIA_AUDIO_PARAMS = 35,
   STATUS_MEDIA_AUDIO_CONTENT_TYPE_NOT_UINT = 36,
   STATUS_INVALID_MEDIA_AUDIO_CONTENT_TYPE = 37,
   STATUS_MEDIA_AUDIO_SAMPLE_RATE_NOT_UINT = 38,
   STATUS_INVALID_MEDIA_AUDIO_SAMPLE_RATE = 39,
   STATUS_MEDIA_AUDIO_CHANNEL_NOT_UINT = 40,
   STATUS_INVALID_MEDIA_AUDIO_CHANNEL = 41,
   STATUS_MEDIA_AUDIO_CODEC_NOT_UINT = 42,
   STATUS_INVALID_MEDIA_AUDIO_CODEC = 43,
   STATUS_MEDIA_AUDIO_DATA_OPT_NOT_UINT = 44,
   STATUS_INVALID_MEDIA_AUDIO_DATA_OPT = 45,
   STATUS_MEDIA_AUDIO_SEND_RATE_NOT_UINT = 46,
   STATUS_MEDIA_AUDIO_FRAME_SIZE_NOT_UINT = 47,
   STATUS_INVALID_MEDIA_VIDEO_PARAMS = 48,
   STATUS_INVALID_MEDIA_VIDEO_CONTENT_TYPE = 49,
   STATUS_MEDIA_VIDEO_CONTENT_TYPE_NOT_UINT = 50,
   STATUS_INVALID_MEDIA_VIDEO_CODEC = 51,
   STATUS_MEDIA_VIDEO_CODEC_NOT_UINT = 52,
   STATUS_INVALID_MEDIA_VIDEO_RESOLUTION = 53,
   STATUS_MEDIA_VIDEO_RESOLUTION_NOT_UINT = 54,
   STATUS_INVALID_MEDIA_VIDEO_DATA_OPT = 55,
   STATUS_MEDIA_VIDEO_DATA_OPT_NOT_UINT = 56,
   STATUS_MEDIA_VIDEO_FPS_NOT_UINT = 57,
   STATUS_INVALID_MEDIA_SHARE_PARAMS = 58,
   STATUS_INVALID_MEDIA_DESKSHARE_CONTENT_TYPE = 59,
   STATUS_MEDIA_DESKSHARE_CONTENT_TYPE_NOT_UINT = 60,
   STATUS_INVALID_MEDIA_DESKSHARE_CODEC = 61,
   STATUS_MEDIA_DESKSHARE_CODEC_NOT_UINT = 62,
   STATUS_INVALID_MEDIA_DESKSHARE_RESOLUTION = 63,
   STATUS_MEDIA_DESKSHARE_RESOLUTION_NOT_UINT = 64,
   STATUS_MEDIA_DESKSHARE_FPS_NOT_UINT = 65,
   STATUS_INVALID_MEDIA_TRANSCRIPT_PARAMS = 66,
   STATUS_INVALID_MEDIA_TRANSCRIPT_CONTENT_TYPE = 67,
   STATUS_MEDIA_TRANSCRIPT_CONTENT_TYPE_NOT_UINT = 68,
   STATUS_INVALID_MEDIA_CHAT_PARAMS = 69,
   STATUS_INVALID_MEDIA_CHAT_CONTENT_TYPE = 70,
   STATUS_MEDIA_CHAT_CONTENT_TYPE_NOT_UINT = 71,
   STATUS_INVALID_AUDIO_DATA_BUFFER = 72,
   STATUS_INVALID_VIDEO_DATA_BUFFER = 73,
   STATUS_POST_FIRST_PACKET_FAILURE = 74,
   STATUS_RTMS_SESSION_NOT_FOUND = 75
}
RTMS_SESSION_STATE
Indicates the current session state during RTMS session updates.
enum RTMS_SESSION_STATE
{
   INACTIVE = 0,     // Default state
   INITIALIZE = 1,   // A new session is initializing
   STARTED = 2,      // A new session is started
   PAUSED = 3,       // A session is paused
   RESUMED = 4,      // A session is resumed
   STOPPED = 5       // A session is stopped
}
RTMS_STREAM_STATE
Indicates the current state of the RTMS stream.
enum RTMS_STREAM_STATE
{
   INACTIVE = 0,     // Default state
   ACTIVE = 1,       // Media data has started to transmit, RTMS -> client
   INTERRUPTED = 2,  // Signal or data connection encountered a problem
   TERMINATING = 3,  // Notifying client stream needs to be terminated
   TERMINATED = 4,   // Stream is terminated
   PAUSED = 5,       // Stream is paused
   RESUMED = 6       // Stream is resumed
}
RTMS_STOP_REASON
Indicates the failure status for handshake requests or the reasons for a session to end.
enum RTMS_STOP_REASON
{
   // Default value, means no value
   UNDEFINED = 0,
   // Stopped when triggered by host, returned on session update message
   STOP_BC_HOST_TRIGGERED = 1,
   // Stopped when triggered by user, returned on session update message
   STOP_BC_USER_TRIGGERED = 2,
   // Stopped when app user left meeting, returned on session update message
   STOP_BC_USER_LEFT = 3,
   // Stopped when app user ejected by meeting host, returned on session update message
   STOP_BC_USER_EJECTED = 4,
   // Stopped when host disabled app user or entire app in the meeting, returned on session or stream update message
   STOP_BC_APP_DISABLED_BY_HOST = 5,
   // Stopped when meeting is ended, returned on stream update message
   STOP_BC_MEETING_ENDED = 6,
   // Stopped when stream canceled by participant request, returned on stream update message
   STOP_BC_STREAM_CANCELED = 7,
   // Stopped when stream is revoked and assets must be deleted immediately, returned on stream update message
   STOP_BC_STREAM_REVOKED = 8,
   // Stopped when host disabled all apps in the meeting, returned on stream update message
   STOP_BC_ALL_APPS_DISABLED = 9,
   // Stopped due to internal exceptions, e.g. post asyncmq message failed, returned on stream update message
   STOP_BC_INTERNAL_EXCEPTION = 10,
   // Stopped when the connection timed out, returned on stream update message
   STOP_BC_CONNECTION_TIMEOUT = 11,
   // Stopped when a meeting connection is interrupted, e.g. media sessions, returned on stream update message
   STOP_BC_MEETING_CONNECTION_INTERRUPTED = 12,
   // Stopped when RTMS signaling connection is interrupted, returned on stream update message
   STOP_BC_SIGNAL_CONNECTION_INTERRUPTED = 13,
   // Stopped when RTMS data connection is interrupted, returned on stream update message
   STOP_BC_DATA_CONNECTION_INTERRUPTED = 14,
   // Stopped when RTMS signaling connection is closed abnormally by app, returned on stream update message
   STOP_BC_SIGNAL_CONNECTION_CLOSED_ABNORMALLY = 15,
   // Stopped when RTMS data connection is closed abnormally by app, returned on stream update message
   STOP_BC_DATA_CONNECTION_CLOSED_ABNORMALLY = 16,
   // Stopped when received exit signal, returned on stream update message
   STOP_BC_EXIT_SIGNAL = 17,
   // Stopped due to authentication failure
   STOP_BC_AUTHENTICATION_FAILURE = 18
}
MEDIA_CONTENT_TYPE
Indicates the media formats in handshake requests and responses.
enum MEDIA_CONTENT_TYPE
{
   UNDEFINED = 0,
   RAW_AUDIO = 2,   // Real-time audio
}
MEDIA_DATA_TYPE
Indicates the media data formats in handshake requests and responses.
enum MEDIA_DATA_TYPE
{
   UNDEFINED = 0,
   AUDIO = 0x01,           // 1
   ALL = 0x01 << 5,        // 32
}
MEDIA_DATA_OPTION
Indicates the media parameters for the audio and video media connections in handshake requests and responses.
Currently, only active speaker video streams are available. Merged video streams for speaker and gallery views are coming soon.
enum MEDIA_DATA_OPTION
{
   UNDEFINED = 0,
   AUDIO_MIXED_STREAM = 1,         // Merged audio stream
   AUDIO_MULTI_STREAMS = 2,        // Multiple user audio streams
}
MEDIA_PAYLOAD_TYPE
Indicates the media payload formats in handshake requests and responses.
enum MEDIA_PAYLOAD_TYPE
{
   UNDEFINED = 0,
   L16 = 1,  // Audio, uncompressed raw data
   G711 = 2, // Audio,
   G722 = 3, // Audio,
   OPUS = 4, // Audio,
}
MEDIA_RESOLUTION
Indicates the media resolution for the audio media connections in handshake requests and responses.
enum MEDIA_RESOLUTION
{
   SD = 1,    // 480p or 360p, 854x480 or 640x360
   HD = 2,    // 720p, 1280 x 720
   FHD = 3,   // 1080p, 1920 x 1080
   QHD = 4    // 2K, 2560 x 1440
}
AUDIO_SAMPLE_RATE
Indicates the audio sample rate for the audio object in handshake requests and responses.
enum AUDIO_SAMPLE_RATE
{
   SR_8K = 0,
   SR_16K = 1,
   SR_32K = 2,
   SR_48K = 3
}
AUDIO_CHANNEL
Indicates the audio channel configuration for the audio object in handshake requests and responses.
enum AUDIO_CHANNEL
{
   MONO = 1,
   STEREO = 2
}
TRANSMISSION_PROTOCOL
Indicates the transmission protocol in handshake requests and responses.
Currently, only WebSockets is supported.
enum TRANSMISSION_PROTOCOL
{
   WEBSOCKET = 1,
   RTMP = 2,
   UDP = 3,
   WEBRTC = 4
}
RTMS_TRANSCRIPT_LANGUAGE
Indicates the language of the transcript in handshake requests and responses.
enum RTMS_TRANSCRIPT_LANGUAGE
{
    LANGUAGE_ID_NONE = -1,
    LANGUAGE_ID_ARABIC = 0,
    LANGUAGE_ID_BENGALI = 1,
    LANGUAGE_ID_CANTONESE = 2,
    LANGUAGE_ID_CATALAN = 3,
    LANGUAGE_ID_CHINESE_SIMPLIFIED = 4,
    LANGUAGE_ID_CHINESE_TRADITIONAL = 5,
    LANGUAGE_ID_CZECH = 6,
    LANGUAGE_ID_DANISH = 7,
    LANGUAGE_ID_DUTCH = 8,
    LANGUAGE_ID_ENGLISH = 9,
    LANGUAGE_ID_ESTONIAN = 10,
    LANGUAGE_ID_FINNISH = 11,
    LANGUAGE_ID_FRENCH_CANADA = 12,
    LANGUAGE_ID_FRENCH_FRANCE = 13,
    LANGUAGE_ID_GERMAN = 14,
    LANGUAGE_ID_HEBREW = 15,
    LANGUAGE_ID_HINDI = 16,
    LANGUAGE_ID_HUNGARIAN = 17,
    LANGUAGE_ID_INDONESIAN = 18,
    LANGUAGE_ID_ITALIAN = 19,
    LANGUAGE_ID_JAPANESE = 20,
    LANGUAGE_ID_KOREAN = 21,
    LANGUAGE_ID_MALAY = 22,
    LANGUAGE_ID_PERSIAN = 23,
    LANGUAGE_ID_POLISH = 24,
    LANGUAGE_ID_PORTUGUESE = 25,
    LANGUAGE_ID_ROMANIAN = 26,
    LANGUAGE_ID_RUSSIAN = 27,
    LANGUAGE_ID_SPANISH = 28,
    LANGUAGE_ID_SWEDISH = 29,
    LANGUAGE_ID_TAGALOG = 30,
    LANGUAGE_ID_TAMIL = 31,
    LANGUAGE_ID_TELUGU = 32,
    LANGUAGE_ID_THAI = 33,
    LANGUAGE_ID_TURKISH = 34,
    LANGUAGE_ID_UKRAINIAN = 35,
    LANGUAGE_ID_VIETNAMESE = 36
}
Media parameter definitions
Audio
"audio": {
    "content_type": 2,      
    "sample_rate": 1,          
    "channel": 1,                
    "codec": 1,                   
    "data_opt": 1, 
    "send_rate": 20                 
}



Field
Type
Description
content_type
int
The audio data can be configured as either raw data or RTP based, where the default setting is raw audio. For more information, see MEDIA_CONTENT_TYPE.
sample_rate
int
The audio data sample rate supports multiple options including 8k, 16k, 32k, and 48k, where the default setting is 16k. For more information, see AUDIO_SAMPLE_RATE.
channel
int
The audio data channel configuration allows either mono or stereo, where where the default option is mono. For more information, see AUDIO_CHANNEL.
codec
int
The audio data codec supports various formats including Linear 16, G711, G722, and Opus, where the default setting is optimized at L16. For more information, see MEDIA_PAYLOAD_TYPE.
data_opt
int
The audio data option provides support for mixed stream and active speakers, where the default setting is established as mixed stream.

- AUDIO_MIXED_STREAM - All active speakers' audio is combined into a single mixed stream for output.

- AUDIO_MULTI_STREAMS - Each active speaker's audio is output as separate streams, with support for up to 3 speakers per 20ms.

For more information, see MEDIA_DATA_OPTION.
send_rate
int
The audio packets are transmitted according to the specified rate, which must be configured as a multiple of 20ms and cannot exceed 1000ms, where the default setting is 20ms.