interface FirebaseQueue {
}

interface FirebaseQueueStatic {
  new(ref: any, callback: (data: any, progress: any, resolve: any, reject: any) => void): FirebaseQueue
}

declare var FirebaseQueue: FirebaseQueueStatic

declare module 'firebase-queue' {
  export = FirebaseQueue
}
