# Zoom Contact Center Zoom Apps have specific APIs, shown below: 

# getEngagementContext

getEngagementContext(options?: GetEngagementContextOptions): Promise<EngagementContext>

API to get details of the current ZCC engagement (for e.g. engagementId, start time, engagement channel, queue name etc.) when a user accesses the app.

Note: Get details of the current ZCC engagement. When processing the response, check the ‘engagementId’ field as it is possible that the agent user has switched between engagements during the time of this API request. Your app should be “engagement-aware” meaning that it is capable of storing data about multiple engagements independently and maintaining proper engagement state to support agents switching between multiple engagements. Running context: inContactCenter

Supported roles: Agent, Supervisor

## getEngagementContext returned object 

All the data in this object is valid and doesn’t change throughout the lifetime of the current engagement (until the engagement is ended for the current Agent/App).

Thus this API should be called only once per engagement when the application starts or this API is not necessary if the corresponding event onEngagementContextChange is handled by the App.

Type declaration
engagementContext: { startTime: number; engagementId: string; acceptTime?: number; queueId?: string; queueName?: string; isTransfer?: string; transferType?: string; transferFromAgentId?: string; transferFromAgentName?: string }
startTime: number
The date when the engagement was first created in ISO 8601 format "yyyy-MM-dd'T'HH:mm:ss'Z'" or yyyy-MM-dd'T'HH:mm:ss’TZD’

**engagementId**: string
The engagement's ID

*Optional* **acceptTime**?: number
The time when the engagement was accepted by the current agent

*Optional* **queueId**?: string
The ID of the queue which the engagement is routed to

*Optional* **queueName**?: string
The name of the queue which the engagement is routed to

*Optional* **isTransfer**?: string
If the call has been transferred or not from a previous agent

*Optional* **transferType**?: string
type of transfer: direct, warm

*Optional* **transferFromAgentId**?: string
The ID of the agent who initiated the transfer

*Optional* **transferFromAgentName**?: string
The name of the agent who initiated the transfer

# getEngagementStatus 

getEngagementStatus(options: GetEngagementStatusOptions): Promise<EngagementStatus>
Get details of the current ZCC engagement.

Note: Get details of the current ZCC engagement. When processing the response, check the ‘engagementId’ field as it is possible that the agent user has switched between engagements during the time of this API request. Your app should be “engagement-aware” meaning that it is capable of storing data about multiple engagements independently and maintaining proper engagement state to support agents switching between multiple engagements.

*Running context*: inContactCenter

*Supported roles*: Agent, Supervisor

Parameters
options: GetEngagementStatusOptions
Returns Promise<EngagementStatus>


## getEngagementStatus returned object

Type declaration
engagementStatus: { engagementId: string; endTime?: number; state: "active" | "inactive" | "wrap-up" | "end"; channel: "voice" | "video" | "messaging" | "email"; source: "video_webVideo" | "video_inAppVideo" | "video_kiosk" | "messaging_webChat" | "messaging_inAppChat" | "messaging_facebook" | "messaging_whatsapp" | "messaging_sms" | ""; isConference: string; assignedAgentId?: string; assignedAgentName?: string; consumers: { consumerId?: string; consumerDisplayName?: string; consumerNumber?: string; consumerEmail?: string }[] }

**engagementId**: string
The engagement's ID

*Optional* **endTime**?: number
The data and time when the engagement ended (after wrap up) in timestamp, valid only when state=end

**state**: "active" | "inactive" | "wrap-up" | "end"
The current status of the engagment

**channel**: "voice" | "video" | "messaging" | "email"
The channel which the engagement is currently in. The engagment channel might change if the engagement is upgraded.

**source**: "video_webVideo" | "video_inAppVideo" | "video_kiosk" | "messaging_webChat" | "messaging_inAppChat" | "messaging_facebook" | "messaging_whatsapp" | "messaging_sms" | ""
isConference: string
if the call is a conference call or not

*Optional* **assignedAgentId**?: string
The ID of the agent who is assigned with the engagement

*Optional* **assignedAgentName**?: string

**consumers**: { consumerId?: string; consumerDisplayName?: string; consumerNumber?: string; consumerEmail?: string }[]
information about consumers