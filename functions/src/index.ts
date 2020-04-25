import * as admin from "firebase-admin"
admin.initializeApp()

export { default as chatEventLogger } from "./chat-event-logger"
export { default as createCheckin } from "./create-checkin"
export { default as uniqueChattersView } from "./views/unique-chatters"
export { default as streamIntoBigQuery } from "./stream-into-bigquery"
export {
  default as createMarkerFromSpotlight
} from "./create-marker-from-spotlight"
export { redirect, token } from "./oauth"

export const idiot = "sdasd"
