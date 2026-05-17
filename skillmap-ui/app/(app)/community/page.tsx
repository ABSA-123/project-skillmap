"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Download,
  GitFork,
  Globe2,
  Library,
  UploadCloud,
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
import { getCommunityActivity } from "@/lib/community-observer"
import {
  getCommunityRoadmaps,
  refineCommunityRoadmap,
  saveCommunityRoadmapToLibrary,
} from "@/lib/storage"
import type { CommunityActivity, CommunityRoadmap } from "@/lib/types"

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

function itemCount(roadmap: CommunityRoadmap): number {
  return (
    roadmap.skills.length +
    roadmap.certifications.length +
    roadmap.weeklyTasks.length
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [communityRoadmaps, setCommunityRoadmaps] = useState<CommunityRoadmap[]>([])
  const [activity, setActivity] = useState<CommunityActivity[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const refresh = () => {
    setCommunityRoadmaps(getCommunityRoadmaps())
    setActivity(getCommunityActivity())
  }

  useEffect(() => {
    refresh()
  }, [])

  const sorted = useMemo(
    () =>
      communityRoadmaps
        .slice()
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [communityRoadmaps]
  )

  const stats = useMemo(
    () => ({
      roadmaps: communityRoadmaps.length,
      saves: communityRoadmaps.reduce((sum, r) => sum + r.saves, 0),
      refinements: communityRoadmaps.reduce((sum, r) => sum + r.refinements, 0),
    }),
    [communityRoadmaps]
  )

  const handleSave = (id: string) => {
    if (!user) return
    const saved = saveCommunityRoadmapToLibrary(user, id)
    if (!saved) return
    refresh()
    setMessage(`${saved.title} was saved to your roadmaps.`)
  }

  const handleRefine = (id: string) => {
    if (!user) return
    const refined = refineCommunityRoadmap(user, id)
    if (!refined) return
    refresh()
    router.push(`/roadmaps/${refined.id}`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Shared roadmaps"
        description="Publish your roadmap, save plans from other users, or refine a shared plan into your own version."
        actions={
          <Button asChild size="sm">
            <Link href="/roadmaps">
              <UploadCloud />
              Publish one
            </Link>
          </Button>
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        {message && (
          <Alert>
            <Library className="size-4" />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Published" value={stats.roadmaps} />
          <StatCard label="Saved" value={stats.saves} />
          <StatCard label="Refined" value={stats.refinements} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {sorted.length === 0 ? (
            <EmptyCommunity />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sorted.map((roadmap) => (
                <CommunityCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  onSave={() => handleSave(roadmap.id)}
                  onRefine={() => handleRefine(roadmap.id)}
                />
              ))}
            </div>
          )}

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Community activity</CardTitle>
                <CardDescription>
                  Observer-driven updates from publish, save, and refine actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 6).map((item) => (
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

function CommunityCard({
  roadmap,
  onSave,
  onRefine,
}: {
  roadmap: CommunityRoadmap
  onSave: () => void
  onRefine: () => void
}) {
  return (
    <Card className="transition hover:border-foreground/25 hover:shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-serif text-lg leading-tight">
            {roadmap.title || "Untitled roadmap"}
          </CardTitle>
          <Badge variant="outline">{itemCount(roadmap)} items</Badge>
        </div>
        <CardDescription>
          By {roadmap.authorName} - {relativeTime(roadmap.publishedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{roadmap.targetRole}</p>
          <p className="text-sm text-muted-foreground">
            {roadmap.field} / {roadmap.track}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <Badge variant="secondary" className="font-normal">
            {roadmap.skills.length} skills
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {roadmap.certifications.length} certs
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {roadmap.weeklyTasks.length} tasks
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {roadmap.resources.length} resources
          </Badge>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {roadmap.saves} saves - {roadmap.refinements} refinements
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onSave}>
              <Download />
              Save
            </Button>
            <Button size="sm" onClick={onRefine}>
              <GitFork />
              Refine
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityRow({ activity }: { activity: CommunityActivity }) {
  const label =
    activity.type === "published"
      ? "published"
      : activity.type === "refined"
        ? "refined"
        : "saved"

  return (
    <div className="rounded-md border bg-secondary/20 p-3">
      <p className="text-sm">
        <span className="font-medium">{activity.actorName}</span> {label}{" "}
        <span className="font-medium">{activity.title}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {relativeTime(activity.createdAt)}
      </p>
    </div>
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
          <Globe2 className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyCommunity() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/20 px-6 py-20 text-center">
      <div className="mb-6 grid size-16 place-items-center rounded-full bg-background">
        <Globe2 className="size-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 font-serif text-2xl tracking-tight">
        No shared roadmaps yet
      </h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Open one of your roadmaps and publish it to make it available here.
      </p>
      <Button asChild>
        <Link href="/roadmaps">
          My roadmaps
          <ArrowUpRight />
        </Link>
      </Button>
    </div>
  )
}
