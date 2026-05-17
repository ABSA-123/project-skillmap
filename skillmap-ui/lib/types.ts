// Shared types used across the SkillMap app.

export interface User {
  id: string
  name: string
  email: string
  bio?: string
  targetRole?: string
  passwordHash: string
  salt: string
  createdAt: string
}

export type PublicUser = Omit<User, "passwordHash" | "salt">

export interface ChecklistItem {
  id: string
  name: string
  category: string
  completed: boolean
}

export interface WeeklyTask {
  id: string
  week: number
  title: string
  description: string
  completed: boolean
}

export interface ResourceItem {
  id: string
  name: string
  type: string
  reference: string
}

export interface Roadmap {
  id: string
  title: string
  field: string
  track: string
  targetRole: string
  sourceCommunityId?: string
  sourceChallengeId?: string
  skills: ChecklistItem[]
  certifications: ChecklistItem[]
  weeklyTasks: WeeklyTask[]
  resources: ResourceItem[]
  createdAt: string
  updatedAt: string
}

export interface CommunityRoadmap extends Roadmap {
  authorId: string
  authorName: string
  sourceRoadmapId: string
  sourceCommunityId?: string
  publishedAt: string
  saves: number
  refinements: number
}

export type CommunityActivityType = "published" | "saved" | "refined"

export interface CommunityActivity {
  id: string
  type: CommunityActivityType
  roadmapId: string
  title: string
  actorName: string
  createdAt: string
}

export type ChallengeStatus = "pending" | "active" | "declined"

export interface RoadmapChallenge {
  id: string
  status: ChallengeStatus
  title: string
  targetRole: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  senderRoadmapId: string
  recipientRoadmapId?: string
  roadmapSnapshot: Roadmap
  createdAt: string
  respondedAt?: string
}

export type ChallengeActivityType = "requested" | "accepted" | "declined"

export interface ChallengeActivity {
  id: string
  type: ChallengeActivityType
  challengeId: string
  title: string
  actorName: string
  createdAt: string
}

export interface TemplateRoadmap {
  title: string
  field: string
  track: string
  specialization: string
  skills: Array<Omit<ChecklistItem, "id">>
  certifications: Array<Omit<ChecklistItem, "id">>
  weeklyTasks: Array<Omit<WeeklyTask, "id">>
}
