import type { ChallengeActivity, ChallengeActivityType } from "./types"

const ACTIVITY_KEY = "skillmap:challenges:activity"

export interface ChallengeEvent {
  type: ChallengeActivityType
  challengeId: string
  title: string
  actorName: string
  createdAt: string
}

interface ChallengeObserver {
  update(event: ChallengeEvent): void
}

class ChallengeSubject {
  private observers = new Set<ChallengeObserver>()

  attach(observer: ChallengeObserver) {
    this.observers.add(observer)
  }

  detach(observer: ChallengeObserver) {
    this.observers.delete(observer)
  }

  notify(event: ChallengeEvent) {
    this.observers.forEach((observer) => observer.update(event))
  }
}

class ChallengeActivityObserver implements ChallengeObserver {
  update(event: ChallengeEvent) {
    if (typeof window === "undefined") return

    const next: ChallengeActivity = {
      id: createId(),
      ...event,
    }

    window.localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify([next, ...readActivity()].slice(0, 30))
    )
  }
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

function readActivity(): ChallengeActivity[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as ChallengeActivity[]) : []
  } catch {
    return []
  }
}

export function getChallengeActivity(): ChallengeActivity[] {
  return readActivity()
}

export const challengeSubject = new ChallengeSubject()
challengeSubject.attach(new ChallengeActivityObserver())
