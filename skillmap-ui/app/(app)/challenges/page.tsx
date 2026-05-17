"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Check,
  Clock3,
  Swords,
  Trophy,
  X,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getChallengeActivity } from "@/lib/challenge-observer"
import {
  acceptChallenge,
  declineChallenge,
  getChallengesForUser,
  getRoadmap,
  progressOfRoadmap,
} from "@/lib/storage"
import type { ChallengeActivity, RoadmapChallenge } from "@/lib/types"

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const day = 86_400_000
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function ChallengesPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<RoadmapChallenge[]>([])
  const [activity, setActivity] = useState<ChallengeActivity[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const refresh = () => {
    if (!user) return
    setChallenges(getChallengesForUser(user.id))
    setActivity(getChallengeActivity())
  }

  useEffect(() => {
    refresh()
  }, [user])

  const grouped = useMemo(
    () => ({
      active: challenges.filter((challenge) => challenge.status === "active"),
      incoming: challenges.filter(
        (challenge) => challenge.status === "pending" && challenge.recipientId === user?.id
      ),
      outgoing: challenges.filter(
        (challenge) => challenge.status === "pending" && challenge.senderId === user?.id
      ),
      declined: challenges.filter((challenge) => challenge.status === "declined"),
    }),
    [challenges, user?.id]
  )

  const handleAccept = (challengeId: string) => {
    if (!user) return
    const accepted = acceptChallenge(user, challengeId)
    if (!accepted) return
    refresh()
    setMessage(`${accepted.title} is now an active challenge.`)
  }

  const handleDecline = (challengeId: string) => {
    if (!user) return
    const declined = declineChallenge(user, challengeId)
    if (!declined) return
    refresh()
    setMessage(`Declined ${declined.title}.`)
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="Friends"
        title="Challenges"
        description="Send roadmap challenges to other users, accept incoming requests, and compare progress after both sides join."
        actions={
          <Button asChild size="sm">
            <Link href="/roadmaps">
              <Swords />
              Challenge from a roadmap
            </Link>
          </Button>
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        {message && (
          <Alert>
            <Trophy className="size-4" />
            <AlertTitle>Challenge updated</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active" value={grouped.active.length} />
          <StatCard label="Incoming" value={grouped.incoming.length} />
          <StatCard label="Sent" value={grouped.outgoing.length} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Section title="Active challenges">
              {grouped.active.length === 0 ? (
                <EmptyPanel text="No active challenges yet." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {grouped.active.map((challenge) => (
                    <ActiveChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Incoming requests">
              {grouped.incoming.length === 0 ? (
                <EmptyPanel text="No incoming challenge requests." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {grouped.incoming.map((challenge) => (
                    <IncomingChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onAccept={() => handleAccept(challenge.id)}
                      onDecline={() => handleDecline(challenge.id)}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Sent requests">
              {grouped.outgoing.length === 0 ? (
                <EmptyPanel text="No pending sent requests." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {grouped.outgoing.map((challenge) => (
                    <PendingChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenge activity</CardTitle>
                <CardDescription>
                  Observer-driven updates from request, accept, and decline actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No challenge activity yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 8).map((item) => (
                      <ActivityRow key={item.id} activity={item} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </>
  )
}

function ActiveChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: RoadmapChallenge
  currentUserId: string
}) {
  const senderRoadmap = getRoadmap(challenge.senderId, challenge.senderRoadmapId)
  const recipientRoadmap = challenge.recipientRoadmapId
    ? getRoadmap(challenge.recipientId, challenge.recipientRoadmapId)
    : undefined
  const senderProgress = senderRoadmap ? progressOfRoadmap(senderRoadmap) : 0
  const recipientProgress = recipientRoadmap ? progressOfRoadmap(recipientRoadmap) : 0
  const currentUserRoadmapId =
    currentUserId === challenge.senderId
      ? challenge.senderRoadmapId
      : challenge.recipientRoadmapId

  return (
    <Card className="transition hover:border-foreground/25 hover:shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-lg">{challenge.title}</CardTitle>
            <CardDescription>
              {challenge.targetRole} - accepted {relativeTime(challenge.respondedAt ?? challenge.createdAt)}
            </CardDescription>
          </div>
          <Badge>Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressRow name={challenge.senderName} value={senderProgress} />
        <ProgressRow name={challenge.recipientName} value={recipientProgress} />
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Leader: {senderProgress === recipientProgress
              ? "Tie"
              : senderProgress > recipientProgress
                ? challenge.senderName
                : challenge.recipientName}
          </span>
          {currentUserRoadmapId && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/roadmaps/${currentUserRoadmapId}`}>
                Open mine
                <ArrowUpRight />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function IncomingChallengeCard({
  challenge,
  onAccept,
  onDecline,
}: {
  challenge: RoadmapChallenge
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-lg">{challenge.title}</CardTitle>
            <CardDescription>
              From {challenge.senderName} - {relativeTime(challenge.createdAt)}
            </CardDescription>
          </div>
          <Badge variant="outline">Request</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Accepting creates your own copy of this roadmap and starts the shared
          progress comparison.
        </p>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
          <Button variant="outline" size="sm" onClick={onDecline}>
            <X />
            Decline
          </Button>
          <Button size="sm" onClick={onAccept}>
            <Check />
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PendingChallengeCard({ challenge }: { challenge: RoadmapChallenge }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-lg">{challenge.title}</CardTitle>
            <CardDescription>
              Sent to {challenge.recipientName} - {relativeTime(challenge.createdAt)}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            <Clock3 className="size-3" />
            Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Waiting for {challenge.recipientName} to accept the challenge.
        </p>
      </CardContent>
    </Card>
  )
}

function ProgressRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="font-mono text-xs">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

function ActivityRow({ activity }: { activity: ChallengeActivity }) {
  return (
    <div className="rounded-md border bg-secondary/20 p-3">
      <p className="text-sm">
        <span className="font-medium">{activity.actorName}</span>{" "}
        {activity.type} <span className="font-medium">{activity.title}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {relativeTime(activity.createdAt)}
      </p>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="font-serif text-3xl tracking-tight">{value}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-md bg-secondary/60">
          <Swords className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-secondary/20 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
