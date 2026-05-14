import { useState, useCallback, useRef, useMemo } from "react";
import { useEffect } from "react";
import {
  Home,
  Briefcase,
  Workflow,
  Boxes,
  Rocket,
  Compass,
  Settings,
  Bell,
  Upload,
  PenLine,
  Database,
  GitBranch,
  BarChart3,
  Tags,
  GraduationCap,
  Cpu,
  Sparkles,
  Plus,
  MoreHorizontal,
  FolderOpen,
  X,
  LogOut,
  ImageIcon,
  ChevronRight,
  LayoutGrid,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LabelingApp } from "@/components/labeling-app";
import { AI_MODELS } from "@/components/setup-page";
import { AssetsViewer } from "./assets-viewer";

function DisabledWrap({ children, label = "Not available — click disabled" }) {
  return (
    <span
      className="block w-full cursor-not-allowed text-muted-foreground/55"
      title={label}
    >
      {children}
    </span>
  );
}

const RAIL_ITEMS = [
  { id: "home", icon: Home, enabled: false, label: "Home" },
  { id: "projects", icon: Briefcase, enabled: true, label: "Project section" },
  { id: "workflows", icon: Workflow, enabled: false, label: "Workflows" },
  { id: "models", icon: Boxes, enabled: false, label: "Models" },
  { id: "deploy", icon: Rocket, enabled: false, label: "Deploy" },
  { id: "explore", icon: Compass, enabled: false, label: "Explore" },
  { id: "settings", icon: Settings, enabled: false, label: "Settings" },
];

const DATA_NAV = [
  { id: "upload", label: "Upload Data", icon: Upload, enabled: true },
  { id: "annotate", label: "Annotate", icon: PenLine, enabled: true },
  { id: "dataset", label: "Dataset", icon: Database, enabled: true },
  { id: "versions", label: "Versions", icon: GitBranch, enabled: false },
  { id: "analytics", label: "Analytics", icon: BarChart3, enabled: false },
  { id: "classes", label: "Classes & Tags", icon: Tags, enabled: false },
];

const MODELS_NAV = [
  { id: "train", label: "Train", icon: GraduationCap, enabled: false },
  { id: "models", label: "Models", icon: Cpu, enabled: false },
  { id: "nas", label: "NAS", icon: Sparkles, enabled: false },
];

const DEPLOY_NAV = [
  { id: "deployments", label: "Deployments", icon: Rocket, enabled: false },
];

function newProjectId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Committed rows for the Dataset tab (legacy projects used `fileEntries` only). */
function getDatasetEntries(p) {
  if (!p) return [];
  if (Array.isArray(p.datasetFileEntries)) return p.datasetFileEntries;
  if (Array.isArray(p.fileEntries)) return p.fileEntries;
  return [];
}

/** Staging for Upload + Annotate until the user clicks Continue. */
function getPendingEntries(p) {
  if (!p) return [];
  return Array.isArray(p.pendingFileEntries) ? p.pendingFileEntries : [];
}

export function WorkspaceApp({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectTab, setProjectTab] = useState("upload");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [uploadedStaged, setUploadedStaged] = useState([]);
  const [selectedModel, setSelectedModel] = useState("grounding-dino");
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const fileInputRef = useRef(null);
  /** When set, workspace root hides the projects dashboard and shows that rail section's menu. */
  const [railHubId, setRailHubId] = useState(null);
  /** Far-left rail hidden for more canvas space while annotating. */
  const [workspaceRailCollapsed, setWorkspaceRailCollapsed] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId],
  );

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5001/api/projects/list?userId=${user.id}`,
      );

      const data = await response.json();

      if (!data.success) {
        console.error(data.error);
        return;
      }

      const formattedProjects = data.projects.map((p) => ({
        id: p.projectId,
        name: p.name,

        model: p.model,

        taskType: "Object Detection",

        pendingFileEntries: [],
        datasetFileEntries: [],

        updatedAt: p.createdAt,

        backendProject: p,
      }));

      setProjects(formattedProjects);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchProjects();
  }, [user]);

  const openProjectsList = useCallback(() => {
    setActiveProjectId(null);
    setProjectTab("upload");
    setRailHubId(null);
    setWorkspaceRailCollapsed(false);
  }, []);

  const handleProjectRailClick = useCallback(() => {
    if (activeProjectId) {
      setWorkspaceRailCollapsed((c) => !c);
      return;
    }
    setRailHubId((prev) => (prev === "projects" ? null : "projects"));
  }, [activeProjectId]);

  const openProject = useCallback(
    (id) => {
      setActiveProjectId(id);
      setProjectTab("upload");
      setWorkspaceRailCollapsed(false);
      const p = projects.find((x) => x.id === id);
      if (p) {
        setUploadedStaged(getPendingEntries(p));
        setSelectedModel(p.model || "grounding-dino");
      }
    },
    [projects],
  );

  const persistPendingFiles = useCallback(
    (projectId, pendingFileEntries, model) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const next = {
            ...p,
            pendingFileEntries,
            model,
            updatedAt: Date.now(),
          };
          if (
            next.datasetFileEntries === undefined &&
            Array.isArray(p.fileEntries) &&
            p.fileEntries.length > 0
          ) {
            next.datasetFileEntries = [...p.fileEntries];
            next.fileEntries = undefined;
          }
          if (next.datasetFileEntries === undefined)
            next.datasetFileEntries = [];
          return next;
        }),
      );
    },
    [],
  );

  const goToProjectTab = useCallback(
    async (tab) => {
      if (!activeProjectId) {
        setProjectTab(tab);
        return;
      }

      // ---------------------------------------------------
      // Persist upload staging
      // ---------------------------------------------------

      if (
        projectTab === "upload" &&
        (tab === "annotate" || tab === "dataset")
      ) {
        persistPendingFiles(activeProjectId, uploadedStaged, selectedModel);
      }

      // ---------------------------------------------------
      // Restore upload staging
      // ---------------------------------------------------

      if (tab === "upload") {
        const p = projects.find((x) => x.id === activeProjectId);

        if (p) {
          setUploadedStaged(getPendingEntries(p));

          setSelectedModel(p.model || "grounding-dino");
        }
      }

      // ---------------------------------------------------
      // Fetch dataset assets from backend
      // ---------------------------------------------------

      if (tab === "dataset") {
        try {
          const response = await fetch(
            `http://127.0.0.1:5001/api/assets/list?projectId=${activeProjectId}`,
          );

          const data = await response.json();

          if (data.success) {
            const datasetEntries = data.assets.map((asset) => ({
              id: asset.id,

              name: asset.originalName || asset.image,

              preview: `http://127.0.0.1:5001/api/assets/image/${asset.image}?projectId=${activeProjectId}`,

              annotations: asset.annotations || [],

              labels: asset.labels || [],

              savedAt: asset.savedAt,
            }));

            setProjects((prev) =>
              prev.map((p) => {
                if (p.id !== activeProjectId) {
                  return p;
                }

                return {
                  ...p,
                  datasetFileEntries: datasetEntries,
                };
              }),
            );
          }
        } catch (err) {
          console.error("Failed loading dataset", err);
        }
      }

      // ---------------------------------------------------
      // Switch tab
      // ---------------------------------------------------

      setProjectTab(tab);
    },
    [
      activeProjectId,
      projectTab,
      uploadedStaged,
      selectedModel,
      projects,
      persistPendingFiles,
    ],
  );

  const handleFiles = useCallback((fileList) => {
    const imageFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) return;
    const withPreviews = imageFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setUploadedStaged((prev) => [...prev, ...withPreviews]);
  }, []);

  const removeStaged = useCallback((id) => {
    setUploadedStaged((prev) => {
      const row = prev.find((f) => f.id === id);
      if (row) URL.revokeObjectURL(row.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSaveToProjectAndAnnotate = useCallback(async () => {
    if (!activeProjectId || isSavingUpload) return;
    setIsSavingUpload(true);
    try {
      await new Promise((r) => requestAnimationFrame(r));
      persistPendingFiles(activeProjectId, uploadedStaged, selectedModel);
      await new Promise((r) => setTimeout(r, 280));
      setProjectTab("annotate");
    } finally {
      setIsSavingUpload(false);
    }
  }, [
    activeProjectId,
    uploadedStaged,
    selectedModel,
    persistPendingFiles,
    isSavingUpload,
  ]);

  const createProject = useCallback(async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:5001/api/projects/create",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: user.id,
            name: newProjectName,
            model: selectedModel,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        console.error(data.error);
        return;
      }

      const backendProject = data.project;

      const project = {
        id: backendProject.projectId,
        name: backendProject.name,
        taskType: "Object Detection",

        pendingFileEntries: [],
        datasetFileEntries: [],

        model: backendProject.model,

        updatedAt: Date.now(),

        backendProject: backendProject,
      };

      setProjects((prev) => [...prev, project]);

      setNewProjectName("");
      setShowNewProject(false);

      setUploadedStaged([]);

      setSelectedModel(backendProject.model || "grounding-dino");

      setActiveProjectId(backendProject.projectId);

      setProjectTab("upload");

      setWorkspaceRailCollapsed(false);
    } catch (err) {
      console.error("Project creation failed", err);
    }
  }, [newProjectName, user, selectedModel]);

  const handleContinueToDataset = useCallback(
    async (entries, annotationsByImage = {}, labels = []) => {
      if (!activeProjectId || !entries?.length) return;

      try {
        // ---------------------------------------------------
        // Save all annotated images to backend
        // ---------------------------------------------------

        const savedDatasetEntries = [];

        for (const entry of entries) {
          const formData = new FormData();

          formData.append("image", entry.file);

          formData.append(
            "annotations",
            JSON.stringify(annotationsByImage?.[entry.id] || []),
          );

          formData.append("labels", JSON.stringify(labels || []));

          formData.append("imageName", entry.name);

          formData.append("projectId", activeProjectId);

          const response = await fetch(
            "http://127.0.0.1:5001/api/assets/save",
            {
              method: "POST",
              body: formData,
            },
          );

          const data = await response.json();

          if (!data.success) {
            console.error("Failed saving asset", data.error);

            continue;
          }

          // -----------------------------------------------
          // Create dataset row from backend response
          // -----------------------------------------------

          savedDatasetEntries.push({
            id: data.assetId,

            name: entry.name,

            file: entry.file,

            preview: `http://127.0.0.1:5001/api/assets/image/${data.image}?projectId=${activeProjectId}`,

            backendImage: data.image,

            annotationsFile: data.annotationsFile,

            savedAt: data.savedAt,
          });
        }

        // ---------------------------------------------------
        // Update project state
        // ---------------------------------------------------

        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== activeProjectId) {
              return p;
            }

            const prevPending = getPendingEntries(p);

            const transferred = new Set(entries.map((e) => e.preview));

            for (const row of prevPending) {
              if (!transferred.has(row.preview)) {
                URL.revokeObjectURL(row.preview);
              }
            }

            return {
              ...p,

              datasetFileEntries: [
                ...getDatasetEntries(p),
                ...savedDatasetEntries,
              ],

              pendingFileEntries: [],

              fileEntries: undefined,

              updatedAt: Date.now(),
            };
          }),
        );

        // ---------------------------------------------------
        // Move to dataset tab
        // ---------------------------------------------------

        setProjectTab("dataset");
      } catch (err) {
        console.error("Dataset save failed", err);
      }
    },
    [activeProjectId],
  );

  const fetchAssets = async () => {
    const response = await fetch(
      `http://127.0.0.1:5001/api/assets/list?projectId=${activeProjectId}`,
    );

    const data = await response.json();

    if (data.success) {
      setDatasetAssets(data.assets);
    }
  };

  const annotateKey = useMemo(() => {
    const pending = getPendingEntries(activeProject);
    if (!pending.length) return "0";
    return pending.map((f) => `${f.name}:${f.file.size}`).join("|");
  }, [activeProject]);

  const labelingInitialFiles = getPendingEntries(activeProject).map(
    (e) => e.file,
  );

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden relative">
      {/* Workspace nav rail — hidden when collapsed inside a project */}
      {!workspaceRailCollapsed && (
        <aside className="w-[200px] shrink-0 flex flex-col border-r border-border bg-card z-30 py-3 px-2">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg bg-primary/10 border border-primary/15">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">
                Annotation
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Studio
              </p>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-1 w-full min-h-0">
            {RAIL_ITEMS.map((item) => {
              const Icon = item.icon;
              const isProjects = item.id === "projects";

              if (item.enabled) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={
                      isProjects
                        ? activeProjectId
                          ? workspaceRailCollapsed
                            ? "Show workspace menu"
                            : "Hide workspace menu"
                          : railHubId === "projects"
                            ? "Show project grid"
                            : "Project section menu"
                        : item.label
                    }
                    onClick={handleProjectRailClick}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                      (isProjects &&
                        !!activeProjectId &&
                        !workspaceRailCollapsed) ||
                        (isProjects &&
                          !activeProjectId &&
                          railHubId !== "projects")
                        ? "bg-primary/15 text-primary ring-1 ring-primary/35 shadow-sm"
                        : isProjects &&
                            !activeProjectId &&
                            railHubId === "projects"
                          ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                          : isProjects &&
                              !!activeProjectId &&
                              workspaceRailCollapsed
                            ? "bg-primary/5 text-primary/80 ring-1 ring-primary/15"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <DisabledWrap key={item.id}>
                  <div
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 pointer-events-none",
                      "text-muted-foreground/45",
                    )}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0 opacity-70"
                      strokeWidth={2}
                    />
                    <span className="text-sm truncate">{item.label}</span>
                  </div>
                </DisabledWrap>
              );
            })}
          </nav>
          <DisabledWrap>
            <div className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 pointer-events-none text-muted-foreground/45 mt-1 border-t border-border pt-2">
              <Bell className="h-5 w-5 shrink-0 opacity-70" strokeWidth={2} />
              <span className="text-sm truncate">Activity</span>
            </div>
          </DisabledWrap>
        </aside>
      )}

      {workspaceRailCollapsed && (
        <button
          type="button"
          onClick={() => setWorkspaceRailCollapsed(false)}
          className="fixed left-0 top-1/2 z-60 -translate-y-1/2 flex items-center gap-1 rounded-r-lg border border-l-0 border-border bg-card py-3 pl-1 pr-2 shadow-lg hover:bg-secondary transition-colors"
          title="Show workspace menu"
        >
          <PanelLeftOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[10px] font-medium text-muted-foreground max-w-12 leading-tight text-left hidden sm:block">
            Menu
          </span>
        </button>
      )}

      {/* Projects list or rail section hub (no project open) */}
      {!activeProjectId &&
        (railHubId === "projects" ? (
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border flex items-center px-6 gap-4 shrink-0 bg-card/50">
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <h1 className="text-sm font-semibold">Project section</h1>
                  <p className="text-[11px] text-muted-foreground">
                    Choose what to do next
                  </p>
                </div>
              </div>
              <div className="flex-1" />
              {user && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                        {(user.name || user.email || "U").charAt(0)}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate">
                      {user.name || user.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={onLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </Button>
                </div>
              )}
            </header>
            <ScrollArea className="flex-1">
              <div className="p-8 max-w-lg mx-auto space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The main project grid is hidden here. Open it when you want to
                  pick a project, or start a new one.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="default"
                    className="h-auto min-h-[4.5rem] justify-start gap-4 px-4 py-4 text-left"
                    onClick={() => setRailHubId(null)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block">
                        Browse all projects
                      </span>
                      <span className="text-xs font-normal text-primary-foreground/80 block mt-0.5">
                        Show the project grid ({projects.length} project
                        {projects.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto min-h-[4.5rem] justify-start gap-4 px-4 py-4 text-left border-dashed"
                    onClick={() => setShowNewProject(true)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block text-foreground">
                        New project
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Create a project, then upload and annotate
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground border-t border-border pt-4">
                  Click{" "}
                  <strong className="text-foreground">Project section</strong>{" "}
                  in the left rail again to switch between this menu and the
                  grid.
                </p>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border flex items-center px-6 gap-4 shrink-0 bg-card/50">
              <div>
                <h1 className="text-sm font-semibold">Projects</h1>
                <p className="text-[11px] text-muted-foreground">
                  Workspace · Annotation Studio
                </p>
              </div>
              <div className="flex-1" />
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                        {(user.name || user.email || "U").charAt(0)}
                      </div>
                    )}
                    <span className="max-w-[140px] truncate">
                      {user.name || user.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={onLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setShowNewProject(true)}
              >
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-6 max-w-6xl mx-auto">
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-12 text-center">
                    <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">No projects yet</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Create a project, then use Upload, Annotate, and Dataset.
                    </p>
                    <Button onClick={() => setShowNewProject(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New project
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openProject(p.id)}
                        className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="h-14 w-full max-w-[120px] rounded-lg bg-muted overflow-hidden border border-border">
                            {(() => {
                              const thumb =
                                getDatasetEntries(p)[0] ||
                                getPendingEntries(p)[0];
                              return thumb ? (
                                <img
                                  src={thumb.preview}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                  <ImageIconPlaceholder />
                                </div>
                              );
                            })()}
                          </div>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                        <p className="font-semibold text-sm truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {p.taskType}
                        </p>
                        <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span>{getDatasetEntries(p).length} in dataset</span>
                          {getPendingEntries(p).length > 0 && (
                            <span className="text-amber-500/90">
                              {getPendingEntries(p).length} in review
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}

      {/* Project shell: sidebar + main */}
      {activeProjectId && activeProject && (
        <>
          <aside className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
            <div className="p-3 border-b border-border">
              <button
                type="button"
                onClick={openProjectsList}
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider mb-2"
              >
                ← Workspace
              </button>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                  {(() => {
                    const thumb =
                      getDatasetEntries(activeProject)[0] ||
                      getPendingEntries(activeProject)[0];
                    return thumb ? (
                      <img
                        src={thumb.preview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-[10px]">
                        OD
                      </div>
                    );
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    {activeProject.taskType}
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {activeProject.name}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-4">
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Data
                  </p>
                  <nav className="space-y-0.5">
                    {DATA_NAV.map((item) => {
                      const Icon = item.icon;
                      const active = projectTab === item.id;
                      const count =
                        item.id === "dataset"
                          ? getDatasetEntries(activeProject).length
                          : null;
                      if (!item.enabled) {
                        return (
                          <DisabledWrap key={item.id}>
                            <div
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50",
                                "pointer-events-none",
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </div>
                          </DisabledWrap>
                        );
                      }
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goToProjectTab(item.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors",
                            active
                              ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/25"
                              : "text-foreground hover:bg-secondary",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{item.label}</span>
                          {count != null && (
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div>
                  <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Models
                  </p>
                  <nav className="space-y-0.5">
                    {MODELS_NAV.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DisabledWrap key={item.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50",
                              "pointer-events-none",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </DisabledWrap>
                      );
                    })}
                  </nav>
                </div>

                <div>
                  <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Deploy
                  </p>
                  <nav className="space-y-0.5">
                    {DEPLOY_NAV.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DisabledWrap key={item.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50",
                              "pointer-events-none",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </DisabledWrap>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {projectTab === "upload" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 border-b border-border flex items-center px-6 shrink-0 gap-4">
                  <div>
                    <h1 className="text-lg font-semibold">Upload</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Staging only — images appear in Dataset after you click
                      Continue in Annotate.
                    </p>
                  </div>
                  <div className="flex-1" />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    title="Save images and model to this project, then open Annotate"
                    disabled={isSavingUpload}
                    onClick={handleSaveToProjectAndAnnotate}
                    className={cn(
                      "gap-2 min-w-[148px] border border-border transition-all",
                      "hover:bg-primary/12 hover:text-primary hover:border-primary/35 hover:shadow-sm",
                      "active:scale-[0.98] disabled:pointer-events-none",
                    )}
                  >
                    {isSavingUpload ? (
                      <>
                        <Spinner className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      "Save to project"
                    )}
                  </Button>
                </header>
                <ScrollArea className="flex-1">
                  <div className="p-6 max-w-3xl mx-auto space-y-6">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFiles(e.dataTransfer.files);
                      }}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium mb-1">
                        Drag and drop images
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Select files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {uploadedStaged.length > 0 && (
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {uploadedStaged.map((f) => (
                          <div
                            key={f.id}
                            className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                          >
                            <img
                              src={f.preview}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                              onClick={() => removeStaged(f.id)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold mb-3">AI model</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AI_MODELS.map((m) => {
                          const Icon = m.icon;
                          const disabled = !!m.comingSoon;
                          const sel = selectedModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                !disabled && setSelectedModel(m.id)
                              }
                              className={cn(
                                "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all",
                                disabled && "opacity-50 cursor-not-allowed",
                                sel &&
                                  !disabled &&
                                  "border-primary bg-primary/10 ring-1 ring-primary/30",
                              )}
                            >
                              <Icon
                                className="h-5 w-5 shrink-0 mt-0.5"
                                style={{ color: m.color }}
                              />
                              <div>
                                <p className="font-medium">{m.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {m.category}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {projectTab === "annotate" && (
              <>
                {labelingInitialFiles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <PenLine className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">
                      No images in this project
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Upload images first, save to project, then open Annotate.
                    </p>
                    <Button onClick={() => goToProjectTab("upload")}>
                      Go to Upload
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <LabelingApp
                      projectId={activeProjectId}
                      key={`${activeProjectId}-${annotateKey}`}
                      initialFiles={labelingInitialFiles}
                      selectedModel={activeProject.model || selectedModel}
                      onBack={() => goToProjectTab("dataset")}
                      user={user}
                      onLogout={onLogout}
                      onContinueToDataset={handleContinueToDataset}
                    />
                  </div>
                )}
              </>
            )}

            {projectTab === "dataset" && (
              <AssetsViewer
                assets={getDatasetEntries(activeProject)}
                project={activeProject}
                projectId={activeProjectId}
              />
            )}
          </main>
        </>
      )}

      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Name your project. You can upload images and annotate next.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProject()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button onClick={createProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageIconPlaceholder() {
  return <ImageIcon className="h-5 w-5 opacity-40" />;
}
