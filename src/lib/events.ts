type EventPayload = Record<string, unknown>

type EventHandler<T extends EventPayload = EventPayload> = (
  payload: T
) => Promise<void> | void

const handlers: Record<string, EventHandler[]> = {}

export function on<T extends EventPayload>(event: string, handler: EventHandler<T>) {
  if (!handlers[event]) {
    handlers[event] = []
  }

  handlers[event].push(handler as EventHandler)
}

export async function emit<T extends EventPayload>(event: string, payload: T) {
  const eventHandlers = handlers[event] || []

  for (const handler of eventHandlers) {
    await handler(payload)
  }
}
