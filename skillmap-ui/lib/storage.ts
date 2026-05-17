// Tiny localStorage wrapper. Keeps keys consistent and namespaced so each
// signed-in user has their own roadmap collection separate from others.

import { communitySubject } from "./community-observer"
import { challengeSubject } from "./challenge-observer"
import type {
  CommunityRoadmap,
  PublicUser,
  Roadmap,
  RoadmapChallenge,
  User,
} from "./types"

const KEYS = {
  users: "skillmap:users",
  session: "skillmap:session",
  roadmaps: (userId: string) => `skillmap:user:${userId}:roadmaps`,
  communityRoadmaps: "skillmap:community:roadmaps",
  challenges: "skillmap:challenges",
} as const

interface Session {
  userId: string
  signedInAt: string
}

function isBrowser() {
  return typeof window !== "undefined"
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, salt: _salt, ...publicUser } = user
  return publicUser
}

// ------- Users -------

export function getUsers(): User[] {
  return readJSON<User[]>(KEYS.users, [])
}

export function saveUsers(users: User[]) {
  writeJSON(KEYS.users, users)
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === normalized)
}

export function findUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function getOtherUsers(userId: string): PublicUser[] {
  return getUsers()
    .filter((user) => user.id !== userId)
    .map(toPublicUser)
}

export function upsertUser(user: User) {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === user.id)
  if (idx === -1) users.push(user)
  else users[idx] = user
  saveUsers(users)
}

// ------- Session -------

export function getSession(): Session | null {
  return readJSON<Session | null>(KEYS.session, null)
}

export function setSession(session: Session | null) {
  if (!isBrowser()) return
  if (session) writeJSON(KEYS.session, session)
  else window.localStorage.removeItem(KEYS.session)
}

// ------- Roadmaps (per user) -------

export function getRoadmaps(userId: string): Roadmap[] {
  return readJSON<Roadmap[]>(KEYS.roadmaps(userId), [])
}

export function saveRoadmaps(userId: string, roadmaps: Roadmap[]) {
  writeJSON(KEYS.roadmaps(userId), roadmaps)
}

export function upsertRoadmap(userId: string, roadmap: Roadmap): Roadmap[] {
  const list = getRoadmaps(userId)
  const idx = list.findIndex((r) => r.id === roadmap.id)
  const next = { ...roadmap, updatedAt: new Date().toISOString() }
  if (idx === -1) list.unshift(next)
  else list[idx] = next
  saveRoadmaps(userId, list)
  return list
}

export function deleteRoadmap(userId: string, roadmapId: string): Roadmap[] {
  const next = getRoadmaps(userId).filter((r) => r.id !== roadmapId)
  saveRoadmaps(userId, next)
  return next
}

export function getRoadmap(userId: string, roadmapId: string): Roadmap | undefined {
  return getRoadmaps(userId).find((r) => r.id === roadmapId)
}

export function progressOfRoadmap(roadmap: Roadmap): number {
  const items = [...roadmap.skills, ...roadmap.certifications, ...roadmap.weeklyTasks]
  if (items.length === 0) return 0
  return Math.round((items.filter((item) => item.completed).length / items.length) * 100)
}

// ------- Community roadmaps -------

export function getCommunityRoadmaps(): CommunityRoadmap[] {
  return readJSON<CommunityRoadmap[]>(KEYS.communityRoadmaps, [])
}

function saveCommunityRoadmaps(roadmaps: CommunityRoadmap[]) {
  writeJSON(KEYS.communityRoadmaps, roadmaps)
}

function resetChecklist(items: Roadmap["skills"]) {
  return items.map((item) => ({
    ...item,
    id: createId(),
    completed: false,
  }))
}

function resetWeeklyTasks(tasks: Roadmap["weeklyTasks"]) {
  return tasks.map((task) => ({
    ...task,
    id: createId(),
    completed: false,
  }))
}

function cloneResources(resources: Roadmap["resources"]) {
  return resources.map((resource) => ({
    ...resource,
    id: createId(),
  }))
}

function cloneRoadmapForChallenge(roadmap: Roadmap, challengeId: string): Roadmap {
  const now = new Date().toISOString()
  return {
    id: createId(),
    title: roadmap.title,
    field: roadmap.field,
    track: roadmap.track,
    targetRole: roadmap.targetRole,
    sourceCommunityId: roadmap.sourceCommunityId,
    sourceChallengeId: challengeId,
    skills: resetChecklist(roadmap.skills),
    certifications: resetChecklist(roadmap.certifications),
    weeklyTasks: resetWeeklyTasks(roadmap.weeklyTasks),
    resources: cloneResources(roadmap.resources),
    createdAt: now,
    updatedAt: now,
  }
}

export function publishRoadmapToCommunity(
  user: PublicUser,
  roadmap: Roadmap
): CommunityRoadmap {
  const now = new Date().toISOString()
  const communityRoadmap: CommunityRoadmap = {
    id: createId(),
    title: roadmap.title,
    field: roadmap.field,
    track: roadmap.track,
    targetRole: roadmap.targetRole,
    sourceRoadmapId: roadmap.id,
    sourceCommunityId: roadmap.sourceCommunityId,
    authorId: user.id,
    authorName: user.name,
    skills: resetChecklist(roadmap.skills),
    certifications: resetChecklist(roadmap.certifications),
    weeklyTasks: resetWeeklyTasks(roadmap.weeklyTasks),
    resources: cloneResources(roadmap.resources),
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    saves: 0,
    refinements: 0,
  }

  saveCommunityRoadmaps([communityRoadmap, ...getCommunityRoadmaps()])
  communitySubject.notify({
    type: "published",
    roadmapId: communityRoadmap.id,
    title: communityRoadmap.title,
    actorName: user.name,
    createdAt: now,
  })

  return communityRoadmap
}

export function saveCommunityRoadmapToLibrary(
  user: PublicUser,
  communityRoadmapId: string
): Roadmap | null {
  return copyCommunityRoadmapToLibrary(user, communityRoadmapId, "saved")
}

export function refineCommunityRoadmap(
  user: PublicUser,
  communityRoadmapId: string
): Roadmap | null {
  return copyCommunityRoadmapToLibrary(user, communityRoadmapId, "refined")
}

function copyCommunityRoadmapToLibrary(
  user: PublicUser,
  communityRoadmapId: string,
  action: "saved" | "refined"
): Roadmap | null {
  const communityRoadmaps = getCommunityRoadmaps()
  const communityRoadmap = communityRoadmaps.find((r) => r.id === communityRoadmapId)
  if (!communityRoadmap) return null

  const now = new Date().toISOString()
  const copy: Roadmap = {
    id: createId(),
    title:
      action === "refined"
        ? `${communityRoadmap.title} - refined`
        : communityRoadmap.title,
    field: communityRoadmap.field,
    track: communityRoadmap.track,
    targetRole: communityRoadmap.targetRole,
    sourceCommunityId: communityRoadmap.id,
    skills: resetChecklist(communityRoadmap.skills),
    certifications: resetChecklist(communityRoadmap.certifications),
    weeklyTasks: resetWeeklyTasks(communityRoadmap.weeklyTasks),
    resources: cloneResources(communityRoadmap.resources),
    createdAt: now,
    updatedAt: now,
  }

  upsertRoadmap(user.id, copy)

  saveCommunityRoadmaps(
    communityRoadmaps.map((item) =>
      item.id === communityRoadmap.id
        ? {
            ...item,
            saves: item.saves + 1,
            refinements:
              action === "refined" ? item.refinements + 1 : item.refinements,
          }
        : item
    )
  )

  communitySubject.notify({
    type: action,
    roadmapId: communityRoadmap.id,
    title: communityRoadmap.title,
    actorName: user.name,
    createdAt: now,
  })

  return copy
}

// ------- Friend challenges -------

export function getChallenges(): RoadmapChallenge[] {
  return readJSON<RoadmapChallenge[]>(KEYS.challenges, [])
}

function saveChallenges(challenges: RoadmapChallenge[]) {
  writeJSON(KEYS.challenges, challenges)
}

export function getChallengesForUser(userId: string): RoadmapChallenge[] {
  return getChallenges().filter(
    (challenge) => challenge.senderId === userId || challenge.recipientId === userId
  )
}

export function createChallengeRequest(
  sender: PublicUser,
  recipientId: string,
  roadmap: Roadmap
): RoadmapChallenge {
  if (sender.id === recipientId) {
    throw new Error("Choose another user for the challenge.")
  }

  const recipient = findUserById(recipientId)
  if (!recipient) {
    throw new Error("That user could not be found.")
  }

  const existing = getChallenges().find(
    (challenge) =>
      challenge.status !== "declined" &&
      challenge.senderId === sender.id &&
      challenge.recipientId === recipientId &&
      challenge.senderRoadmapId === roadmap.id
  )
  if (existing) {
    throw new Error("You already have a pending or active challenge for this roadmap.")
  }

  const now = new Date().toISOString()
  const challenge: RoadmapChallenge = {
    id: createId(),
    status: "pending",
    title: roadmap.title,
    targetRole: roadmap.targetRole,
    senderId: sender.id,
    senderName: sender.name,
    recipientId,
    recipientName: recipient.name,
    senderRoadmapId: roadmap.id,
    roadmapSnapshot: {
      ...roadmap,
      skills: resetChecklist(roadmap.skills),
      certifications: resetChecklist(roadmap.certifications),
      weeklyTasks: resetWeeklyTasks(roadmap.weeklyTasks),
      resources: cloneResources(roadmap.resources),
    },
    createdAt: now,
  }

  saveChallenges([challenge, ...getChallenges()])
  challengeSubject.notify({
    type: "requested",
    challengeId: challenge.id,
    title: challenge.title,
    actorName: sender.name,
    createdAt: now,
  })

  return challenge
}

export function acceptChallenge(user: PublicUser, challengeId: string): RoadmapChallenge | null {
  const challenges = getChallenges()
  const challenge = challenges.find((item) => item.id === challengeId)
  if (!challenge || challenge.recipientId !== user.id || challenge.status !== "pending") {
    return null
  }

  const now = new Date().toISOString()
  const recipientRoadmap = cloneRoadmapForChallenge(challenge.roadmapSnapshot, challenge.id)
  upsertRoadmap(user.id, recipientRoadmap)

  const updated: RoadmapChallenge = {
    ...challenge,
    status: "active",
    recipientRoadmapId: recipientRoadmap.id,
    respondedAt: now,
  }

  saveChallenges(challenges.map((item) => (item.id === challengeId ? updated : item)))
  challengeSubject.notify({
    type: "accepted",
    challengeId: updated.id,
    title: updated.title,
    actorName: user.name,
    createdAt: now,
  })

  return updated
}

export function declineChallenge(user: PublicUser, challengeId: string): RoadmapChallenge | null {
  const challenges = getChallenges()
  const challenge = challenges.find((item) => item.id === challengeId)
  if (!challenge || challenge.recipientId !== user.id || challenge.status !== "pending") {
    return null
  }

  const now = new Date().toISOString()
  const updated: RoadmapChallenge = {
    ...challenge,
    status: "declined",
    respondedAt: now,
  }

  saveChallenges(challenges.map((item) => (item.id === challengeId ? updated : item)))
  challengeSubject.notify({
    type: "declined",
    challengeId: updated.id,
    title: updated.title,
    actorName: user.name,
    createdAt: now,
  })

  return updated
}
