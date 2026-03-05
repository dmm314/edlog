type EventPayload = Record<string, unknown>

type EventHandler = (payload: EventPayload) => Promise<void>

const handlers: Record<string, EventHandler[]> = {}

export function on(event: string, handler: EventHandler) {
  if (!handlers[event]) {
    handlers[event] = []
  }

  handlers[event].push(handler)
}

export async function emit(event: string, payload: EventPayload) {
  const eventHandlers = handlers[event] || []

  for (const handler of eventHandlers) {
    await handler(payload)
  }
}
