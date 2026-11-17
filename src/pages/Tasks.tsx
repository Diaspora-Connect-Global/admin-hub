import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { CreatedByMeTab, MyTasksTab, TeamBoardTab, TeamProgressTab } from "@/components/tasks/TaskLists";
import { useToast } from "@/hooks/use-toast";
import type { AdminTaskDetail } from "@/lib/adminTasks";

const TABS = ["mine", "team", "createdByMe", "progress"] as const;
type TabId = (typeof TABS)[number];

/**
 * Platform admins give each other tasks and track progress. The open task lives
 * in the URL (`?task=<id>`) so notification emails can link straight to it;
 * the id is only ever a route/query param, never rendered.
 */
export default function Tasks() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>("mine");
  const [newOpen, setNewOpen] = useState(false);
  const openTaskId = searchParams.get("task");

  const openTask = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("task", id);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeTask = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("task");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const onCreated = (detail: AdminTaskDetail) => {
    toast({ title: t("tasks.toast.created") });
    openTask(detail.task.id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("tasks.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("tasks.subtitle")}</p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("tasks.newTask")}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <TabsList className="h-auto flex-wrap justify-start">
            {TABS.map((id) => (
              <TabsTrigger key={id} value={id}>
                {t(`tasks.tabs.${id}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Radix mounts only the active panel, so only that tab's queries run. */}
          <TabsContent value="mine" className="mt-4">
            <MyTasksTab onOpen={openTask} />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <TeamBoardTab onOpen={openTask} />
          </TabsContent>
          <TabsContent value="createdByMe" className="mt-4">
            <CreatedByMeTab onOpen={openTask} />
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            <TeamProgressTab />
          </TabsContent>
        </Tabs>
      </div>

      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} onCreated={onCreated} />
      {openTaskId && <TaskDrawer taskId={openTaskId} onClose={closeTask} />}
    </AdminLayout>
  );
}
