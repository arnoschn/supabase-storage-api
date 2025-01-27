import PgBoss from 'pg-boss'
import { getConfig } from '../config'
import { registerWorkers } from './workers'
import { BaseEvent } from './events'

type SubclassOfBaseClass = (new (payload: any) => BaseEvent<any>) & {
  [K in keyof typeof BaseEvent]: typeof BaseEvent[K]
}

export abstract class Queue {
  private static pgBoss?: PgBoss

  protected static events: SubclassOfBaseClass[] = []

  static async init() {
    if (Queue.pgBoss) {
      return Queue.pgBoss
    }

    const { isMultitenant, multitenantDatabaseUrl, pgQueueConnectionURL } = getConfig()

    let url = pgQueueConnectionURL ?? process.env.DATABASE_URL

    if (isMultitenant) {
      url = pgQueueConnectionURL ?? multitenantDatabaseUrl
    }
    Queue.pgBoss = new PgBoss({
      connectionString: url,
      max: 4,
      application_name: 'storage-pgboss',
      deleteAfterDays: 7,
      archiveCompletedAfterSeconds: 14_400,
      retentionDays: 7,
      retryBackoff: true,
      retryLimit: 20,
      expireInHours: 48,
    })

    registerWorkers()

    await Queue.pgBoss.start()
    await Queue.startWorkers()

    return Queue.pgBoss
  }

  protected static startWorkers() {
    const workers: Promise<string>[] = []

    Queue.events.forEach((event) => {
      workers.push(
        Queue.getInstance().work(event.getQueueName(), event.getWorkerOptions(), event.handle)
      )
    })

    return Promise.all(workers)
  }

  static getInstance() {
    if (!this.pgBoss) {
      throw new Error('pg boss not initialised')
    }

    return this.pgBoss
  }

  static register<T extends SubclassOfBaseClass>(event: T) {
    Queue.events.push(event)
  }
}
