import type { CommunityActivity, CommunityActivityType } from "./types"

const ACTIVITY_KEY = "skillmap:community:activity"

export interface CommunityEvent {
  type: CommunityActivityType
  roadmapId: string
  title: string
  actorName: string
  createdAt: string
}

interface CommunityObserver {
  update(event: CommunityEvent): void
}

class CommunitySubject {
  private observers = new Set<CommunityObserver>()

  attach(observer: CommunityObserver) {
    this.observers.add(observer)
  }

  detach(observer: CommunityObserver) {
    this.observers.delete(observer)
  }

  notify(event: CommunityEvent) {
    this.observers.forEach((observer) => observer.update(event))
  }
}

class CommunityActivityObserver implements CommunityObserver {
  update(event: CommunityEvent) {
    if (typeof window === "undefined") return

    const activity = readActivity()
    const next: CommunityActivity = {
      id: createId(),
      ...event,
    }

    window.localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify([next, ...activity].slice(0, 25))
    )
  }
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

function readActivity(): CommunityActivity[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as CommunityActivity[]) : []
  } catch {
    return []
  }
}

export function getCommunityActivity(): CommunityActivity[] {
  return readActivity()
}

export const communitySubject = new CommunitySubject()
communitySubject.attach(new CommunityActivityObserver())
