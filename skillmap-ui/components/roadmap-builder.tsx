"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CheckCircle2,
  FileUp,
  Link as LinkIcon,
  ListChecks,
  Plus,
  Save,
  Sparkles,
  Swords,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ApiClientFacade } from "@/lib/api-client"
import {
  createChallengeRequest,
  getOtherUsers,
  publishRoadmapToCommunity,
  upsertRoadmap,
} from "@/lib/storage"
import type {
  ChecklistItem,
  PublicUser,
  ResourceItem,
  Roadmap,
  WeeklyTask,
} from "@/lib/types"

type ChecklistKind = "skills" | "certifications"

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`

export function emptyRoadmap(): Roadmap {
  const now = new Date().toISOString()
  return {
    id: createId(),
    title: "Untitled Roadmap",
    field: "IT",
    track: "Software Engineering",
    targetRole: "",
    skills: [],
    certifications: [],
    weeklyTasks: [],
    resources: [],
    createdAt: now,
    updatedAt: now,
  }
}

interface RoadmapBuilderProps {
  initial: Roadmap
  mode: "new" | "edit"
}

export function RoadmapBuilder({ initial, mode }: RoadmapBuilderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [roadmap, setRoadmap] = useState<Roadmap>(initial)
  const [newSkill, setNewSkill] = useState("")
  const [newCertification, setNewCertification] = useState("")
  const [taskDraft, setTaskDraft] = useState({ week: 1, title: "", description: "" })
  const [resourceDraft, setResourceDraft] = useState({ name: "", type: "link", reference: "" })
  const [templateSpecialization, setTemplateSpecialization] = useState("Frontend")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [challengeUsers, setChallengeUsers] = useState<PublicUser[]>([])
  const [challengeUserId, setChallengeUserId] = useState("")

  useEffect(() => {
    setRoadmap(initial)
  }, [initial])

  useEffect(() => {
    if (!user) return
    const users = getOtherUsers(user.id)
    setChallengeUsers(users)
    setChallengeUserId((current) => current || users[0]?.id || "")
  }, [user])

  const progress = useMemo(() => {
    const items = [...roadmap.skills, ...roadmap.certifications, ...roadmap.weeklyTasks]
    if (items.length === 0) return 0
    return Math.round((items.filter((i) => i.completed).length / items.length) * 100)
  }, [roadmap])

  const counts = useMemo(
    () => ({
      skills: roadmap.skills.length,
      skillsDone: roadmap.skills.filter((s) => s.completed).length,
      certs: roadmap.certifications.length,
      certsDone: roadmap.certifications.filter((c) => c.completed).length,
      tasks: roadmap.weeklyTasks.length,
      tasksDone: roadmap.weeklyTasks.filter((t) => t.completed).length,
      resources: roadmap.resources.length,
    }),
    [roadmap]
  )

  // ----- mutators -----

  const update = (changes: Partial<Roadmap>) =>
    setRoadmap((current) => ({ ...current, ...changes }))

  const addChecklistItem = (kind: ChecklistKind) => {
    const value = (kind === "skills" ? newSkill : newCertification).trim()
    if (!value) return
    const item: ChecklistItem = {
      id: createId(),
      name: value,
      category: kind === "skills" ? "skill" : "certification",
      completed: false,
    }
    setRoadmap((c) => ({ ...c, [kind]: [...c[kind], item] }))
    if (kind === "skills") setNewSkill("")
    else setNewCertification("")
  }

  const toggleChecklistItem = (kind: ChecklistKind, id: string, completed: boolean) =>
    setRoadmap((c) => ({
      ...c,
      [kind]: c[kind].map((i) => (i.id === id ? { ...i, completed } : i)),
    }))

  const removeChecklistItem = (kind: ChecklistKind, id: string) =>
    setRoadmap((c) => ({ ...c, [kind]: c[kind].filter((i) => i.id !== id) }))

  const addWeeklyTask = () => {
    if (!taskDraft.title.trim()) return
    const task: WeeklyTask = {
      id: createId(),
      week: taskDraft.week,
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
      completed: false,
    }
    setRoadmap((c) => ({ ...c, weeklyTasks: [...c.weeklyTasks, task] }))
    setTaskDraft({ week: taskDraft.week + 1, title: "", description: "" })
  }

  const toggleWeeklyTask = (id: string, completed: boolean) =>
    setRoadmap((c) => ({
      ...c,
      weeklyTasks: c.weeklyTasks.map((t) => (t.id === id ? { ...t, completed } : t)),
    }))

  const removeWeeklyTask = (id: string) =>
    setRoadmap((c) => ({ ...c, weeklyTasks: c.weeklyTasks.filter((t) => t.id !== id) }))

  const addResource = () => {
    if (!resourceDraft.name.trim()) return
    setRoadmap((c) => ({
      ...c,
      resources: [
        ...c.resources,
        {
          id: createId(),
          name: resourceDraft.name.trim(),
          type: resourceDraft.type,
          reference: resourceDraft.reference.trim(),
        },
      ],
    }))
    setResourceDraft({ name: "", type: "link", reference: "" })
  }

  const addUploadedResources = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    setRoadmap((c) => ({
      ...c,
      resources: [
        ...c.resources,
        ...files.map((f) => ({
          id: createId(),
          name: f.name,
          type: "file",
          reference: `${Math.ceil(f.size / 1024)} KB`,
        })),
      ],
    }))
    event.target.value = ""
  }

  const removeResource = (id: string) =>
    setRoadmap((c) => ({ ...c, resources: c.resources.filter((r) => r.id !== id) }))

  const loadVerifiedTemplate = async () => {
    setError(null)
    setMessage(null)
    try {
      // ---------------------------------------------------------
      // FACADE PATTERN: We no longer handle URLs or JSON parsing here.
      // The UI component simply asks the Facade for the template.
      // ---------------------------------------------------------
      const template = await ApiClientFacade.getTemplate(templateSpecialization)
      
      setRoadmap((c) => ({
        ...c,
        title: template.title,
        field: template.field,
        track: template.track,
        targetRole: template.specialization,
        skills: template.skills.map((i) => ({ ...i, id: createId() })),
        certifications: template.certifications.map((i) => ({ ...i, id: createId() })),
        weeklyTasks: template.weeklyTasks.map((i) => ({ ...i, id: createId() })),
      }))
      setMessage("Verified template loaded. You can edit it before saving.")
    } catch {
      setError("Could not load the verified template. Make sure the backend is running on port 8081.")
    }
  }

  // ----- save -----

  const getValidationError = () => {
    if (!roadmap.title.trim() || !roadmap.targetRole.trim()) {
      return "Roadmap title and target role are required."
    }
    if (
      roadmap.skills.length + roadmap.certifications.length + roadmap.weeklyTasks.length ===
      0
    ) {
      return "Add at least one skill, certification, or weekly task before saving."
    }
    return null
  }

  const saveRoadmap = async () => {
    setError(null)
    setMessage(null)
    if (!user) {
      setError("You must be signed in.")
      return
    }
    const validationError = getValidationError()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    const saved = upsertRoadmap(user.id, roadmap)
    const stored = saved.find((r) => r.id === roadmap.id) ?? roadmap

    try {
      // ---------------------------------------------------------
      // FACADE PATTERN: We offload the complex payload formatting 
      // and HTTP request to the Facade class.
      // ---------------------------------------------------------
      await ApiClientFacade.validateAndSave(stored)
      setMessage("Roadmap saved and validated by the backend builder.")
    } catch {
      setMessage("Roadmap saved locally. Backend validation is unavailable right now.")
    } finally {
      setSaving(false)
    }

    if (mode === "new") {
      router.replace(`/roadmaps/${stored.id}`)
    }
  }

  const publishRoadmap = () => {
    setError(null)
    setMessage(null)
    if (!user) {
      setError("You must be signed in.")
      return
    }
    const validationError = getValidationError()
    if (validationError) {
      setError(validationError.replace("saving", "publishing"))
      return
    }

    const published = publishRoadmapToCommunity(user, roadmap)
    setMessage(`${published.title} is now available in the community.`)
  }

  const sendChallenge = () => {
    setError(null)
    setMessage(null)
    if (!user) {
      setError("You must be signed in.")
      return
    }
    if (!challengeUserId) {
      setError("Create another user account before sending a challenge.")
      return
    }
    const validationError = getValidationError()
    if (validationError) {
      setError(validationError.replace("saving", "challenging"))
      return
    }

    try {
      const saved = upsertRoadmap(user.id, roadmap)
      const stored = saved.find((r) => r.id === roadmap.id) ?? roadmap
      setRoadmap(stored)
      const challenge = createChallengeRequest(user, challengeUserId, stored)
      setMessage(`Challenge sent to ${challenge.recipientName}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the challenge.")
    }
  }

  // ----- render -----

  return (
    <div className="flex flex-col">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="px-4 py-3 lg:px-8 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/roadmaps")}>
            <ArrowLeft />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0 flex-1">
            <input
              value={roadmap.title}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full bg-transparent font-serif text-xl lg:text-2xl tracking-tight outline-none focus:ring-0 placeholder:text-muted-foreground/60"
              placeholder="Untitled Roadmap"
            />
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {progress}% complete
          </Badge>
          <Button onClick={publishRoadmap} variant="outline" size="sm">
            <UploadCloud />
            Publish
          </Button>
          <Button onClick={saveRoadmap} disabled={saving} size="sm">
            <Save />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Action needed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Updated</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Roadmap details</CardTitle>
                <CardDescription>
                  Define the goal before adding skills, tasks, and resources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Target role</FieldLabel>
                    <Input
                      placeholder="e.g. Backend Developer"
                      value={roadmap.targetRole}
                      onChange={(e) => update({ targetRole: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Field</FieldLabel>
                    <Input
                      value={roadmap.field}
                      onChange={(e) => update({ field: e.target.value })}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel>Track</FieldLabel>
                    <Input
                      value={roadmap.track}
                      onChange={(e) => update({ track: e.target.value })}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Skills + Certs side by side */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BuilderList
                title="Skills"
                description="Practical skills you need to learn."
                icon={<BookOpenCheck className="size-4 text-primary" />}
                inputValue={newSkill}
                inputPlaceholder="e.g. Spring Boot"
                addLabel="Add skill"
                items={roadmap.skills}
                onInputChange={setNewSkill}
                onAdd={() => addChecklistItem("skills")}
                onToggle={(id, c) => toggleChecklistItem("skills", id, c)}
                onRemove={(id) => removeChecklistItem("skills", id)}
              />
              <BuilderList
                title="Certifications"
                description="Courses or credentials supporting the path."
                icon={<Award className="size-4 text-primary" />}
                inputValue={newCertification}
                inputPlaceholder="e.g. Oracle Java Certification"
                addLabel="Add certification"
                items={roadmap.certifications}
                onInputChange={setNewCertification}
                onAdd={() => addChecklistItem("certifications")}
                onToggle={(id, c) => toggleChecklistItem("certifications", id, c)}
                onRemove={(id) => removeChecklistItem("certifications", id)}
              />
            </div>

            {/* Weekly tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="size-5 text-primary" />
                  Weekly plan
                </CardTitle>
                <CardDescription>
                  Break the roadmap into week-by-week actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-[110px_minmax(0,1fr)]">
                  <Field>
                    <FieldLabel>Week</FieldLabel>
                    <Input
                      min={1}
                      type="number"
                      value={taskDraft.week}
                      onChange={(e) =>
                        setTaskDraft((c) => ({ ...c, week: Number(e.target.value) }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Task</FieldLabel>
                    <Input
                      placeholder="e.g. Build a portfolio API"
                      value={taskDraft.title}
                      onChange={(e) =>
                        setTaskDraft((c) => ({ ...c, title: e.target.value }))
                      }
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>Description (optional)</FieldLabel>
                    <Textarea
                      placeholder="Create CRUD endpoints and test them with sample data."
                      value={taskDraft.description}
                      onChange={(e) =>
                        setTaskDraft((c) => ({ ...c, description: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <Button variant="outline" onClick={addWeeklyTask}>
                  <Plus />
                  Add weekly task
                </Button>

                {roadmap.weeklyTasks.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {roadmap.weeklyTasks
                      .slice()
                      .sort((a, b) => a.week - b.week)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex gap-3 rounded-lg border bg-card p-3 transition hover:border-foreground/20"
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(c) => toggleWeeklyTask(task.id, c === true)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-[10px]">
                                Week {task.week}
                              </Badge>
                              <p
                                className={`font-medium ${
                                  task.completed
                                    ? "text-muted-foreground line-through"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </p>
                            </div>
                            {task.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Button
                            aria-label="Remove weekly task"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeWeeklyTask(task.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="size-5 text-primary" />
                  Supporting resources
                </CardTitle>
                <CardDescription>
                  Attach links, courses, books, or file references for the roadmap.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                  <Select
                    value={resourceDraft.type}
                    onValueChange={(type) =>
                      setResourceDraft((c) => ({ ...c, type }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="file">File note</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Resource name"
                    value={resourceDraft.name}
                    onChange={(e) =>
                      setResourceDraft((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                  <Input
                    className="md:col-span-2"
                    placeholder="URL, file note, or reference"
                    value={resourceDraft.reference}
                    onChange={(e) =>
                      setResourceDraft((c) => ({ ...c, reference: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={addResource}>
                    <LinkIcon />
                    Add resource
                  </Button>
                  <Button variant="outline" asChild>
                    <label>
                      <FileUp />
                      Upload file
                      <input
                        className="hidden"
                        multiple
                        type="file"
                        onChange={addUploadedResources}
                      />
                    </label>
                  </Button>
                </div>

                {roadmap.resources.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {roadmap.resources.map((r) => (
                      <ResourceRow
                        key={r.id}
                        resource={r}
                        onRemove={() => removeResource(r.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-[5.5rem] self-start">
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>
                  {progress}% complete across skills, certifications, and tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <Stat label="Skills" current={counts.skillsDone} total={counts.skills} />
                  <Stat label="Certs" current={counts.certsDone} total={counts.certs} />
                  <Stat label="Tasks" current={counts.tasksDone} total={counts.tasks} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" />
                  Verified templates
                </CardTitle>
                <CardDescription>
                  Start from a Factory-pattern template you can edit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={templateSpecialization}
                  onValueChange={setTemplateSpecialization}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="AI">AI & Machine Learning</SelectItem>
                    <SelectItem value="Cloud">Cloud Engineering</SelectItem>
                    <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={loadVerifiedTemplate}
                >
                  Load template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="size-4 text-primary" />
                  Challenge a friend
                </CardTitle>
                <CardDescription>
                  Send this roadmap as a head-to-head progress challenge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={challengeUserId}
                  onValueChange={setChallengeUserId}
                  disabled={challengeUsers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {challengeUsers.map((challengeUser) => (
                      <SelectItem key={challengeUser.id} value={challengeUser.id}>
                        {challengeUser.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={sendChallenge}
                  disabled={challengeUsers.length === 0}
                >
                  <Swords />
                  Send challenge
                </Button>
                {challengeUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add another account in this browser to challenge a friend.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  )
}

// ---------- Sub components ----------

function BuilderList({
  title,
  description,
  icon,
  inputValue,
  inputPlaceholder,
  addLabel,
  items,
  onInputChange,
  onAdd,
  onToggle,
  onRemove,
}: {
  title: string
  description: string
  icon: ReactNode
  inputValue: string
  inputPlaceholder: string
  addLabel: string
  items: ChecklistItem[]
  onInputChange: (value: string) => void
  onAdd: () => void
  onToggle: (id: string, checked: boolean) => void
  onRemove: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onAdd()
              }
            }}
          />
          <Button variant="outline" onClick={onAdd}>
            <Plus />
            <span className="sr-only sm:not-sr-only">{addLabel}</span>
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nothing here yet. Add your first item above.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-foreground/20"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(c) => onToggle(item.id, c === true)}
                />
                <p
                  className={`min-w-0 flex-1 truncate font-medium ${
                    item.completed ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {item.name}
                </p>
                <Button
                  aria-label={`Remove ${item.name}`}
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ResourceRow({
  resource,
  onRemove,
}: {
  resource: ResourceItem
  onRemove: () => void
}) {
  const isUrl =
    resource.reference.startsWith("http://") ||
    resource.reference.startsWith("https://")

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-foreground/20">
      <Badge variant="outline" className="capitalize">
        {resource.type}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{resource.name}</p>
        {resource.reference && (
          <p className="truncate text-sm text-muted-foreground">
            {isUrl ? (
              <a
                href={resource.reference}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline underline-offset-4"
              >
                {resource.reference}
              </a>
            ) : (
              resource.reference
            )}
          </p>
        )}
      </div>
      <Button
        aria-label="Remove resource"
        size="icon"
        variant="ghost"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

function Stat({ label, current, total }: { label: string; current: number; total: number }) {
  return (
    <div className="rounded-md border bg-secondary/30 p-3">
      <p className="font-serif text-xl tracking-tight">
        {current}
        <span className="text-muted-foreground text-sm font-sans">/{total}</span>
      </p>
      <p className="text-muted-foreground text-xs uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  )
}
