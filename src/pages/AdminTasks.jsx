import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { ADMIN_PASSWORD } from "../constants/admin";
import { isAdminSessionAuthenticated } from "../utils/adminSession";
import { adminContent } from "../constants/adminContent";
import { TASK_CATEGORIES } from "../constants/tasks";
import {
  buildTaskStats,
  createEmptyTask,
  normalizeTasks,
  persistTasks,
  validateTask,
} from "../services/tasksService";
import {
  discardAdminTaskChanges,
  getAdminTaskChangesSummary,
  loadAdminDataOnce,
  markAdminDataSaved,
  removeAdminTask,
  setAdminTasks,
  upsertAdminTask,
} from "../services/adminDataStore";
import {
  AdminPageShell,
  AdminPendingChangesActions,
  AdminTableSection,
  EditorDialog as AdminEditorDialog,
  UnsavedChangesDialog,
} from "../components/admin/common";
import {
  TaskCategoryPanel,
  TaskFilters,
  TaskForm,
  TaskTableActions,
  TaskTotalsPanel,
} from "../components/admin/tasks";
import CinematicPage from "../components/cinematic/CinematicPage";
import CinematicStaggeredRevealItem from "../components/cinematic/CinematicStaggeredRevealItem";
import DeleteDialog from "../components/ui/DeleteDialog";
import Spinner from "../components/ui/Spinner";
import StatusDialog from "../components/ui/StatusDialog";
import useIsMobileView from "../hooks/useIsMobileView";
import useSpinner from "../hooks/useSpinner";
import useAdminLocalChanges from "../hooks/useAdminLocalChanges";
import { filterTasks } from "../utils/taskPageUtils";
import { getStableJson } from "../utils/objectSnapshot";

const getTaskKey = (task) => task.id;

export default function AdminTasks() {
  const spinner = useSpinner();
  const tasksRef = useRef(null);
  const tasksInView = useInView(tasksRef, {
    once: true,
    amount: 0.12,
  });
  const isAuthenticated = isAdminSessionAuthenticated();
  const isMobileView = useIsMobileView();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskSnapshot, setEditingTaskSnapshot] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState({
    message: "",
    open: false,
    title: "",
    type: "success",
  });
  const pendingChanges = getAdminTaskChangesSummary();
  const hasPendingChanges = pendingChanges.length > 0;
  const stats = useMemo(() => buildTaskStats(tasks), [tasks]);
  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        dateFrom,
        dateTo,
        priority: priorityFilter,
        query,
        status: statusFilter,
      }),
    [dateFrom, dateTo, priorityFilter, query, statusFilter, tasks],
  );
  const groupedTasks = useMemo(
    () =>
      TASK_CATEGORIES.map((category) => ({
        category,
        tasks: filteredTasks.filter((task) => task.category === category.value),
      })),
    [filteredTasks],
  );
  const emptyState =
    tasks.length > 0
      ? {
          text: adminContent.tasks.list.noFilterText,
          title: adminContent.tasks.list.emptyTitle,
        }
      : {
          text: adminContent.tasks.list.emptyText,
          title: adminContent.tasks.list.emptyTitle,
        };

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    loadAdminDataOnce({ password: ADMIN_PASSWORD })
      .then((snapshot) => {
        if (cancelled) return;

        const normalizedTasks = normalizeTasks(snapshot.tasks || []);

        setTasks(normalizedTasks);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error(error);
        setPopup({
          message: adminContent.tasks.dialogs.loadError,
          open: true,
          title: adminContent.tasks.dialogs.problemTitle,
          type: "error",
        });
        setTasks([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const applyTasks = (nextTasks) => {
    const normalizedTasks = normalizeTasks(nextTasks);

    setTasks(normalizedTasks);
    setAdminTasks(normalizedTasks);
  };
  const showPendingPopup = () => {
    setPopup({
      message: adminContent.tasks.dialogs.pendingMessage,
      open: true,
      title: adminContent.tasks.dialogs.pendingTitle,
      type: "success",
    });
  };
  const handleCreateTask = () => {
    const task = createEmptyTask();

    setErrors({});
    setEditingTask(task);
    setEditingTaskSnapshot(getStableJson(task));
  };
  const handleEditTask = (task) => {
    const draft = createEmptyTask(task);

    setErrors({});
    setEditingTask(draft);
    setEditingTaskSnapshot(getStableJson(draft));
  };
  const handleChange = (field, value) => {
    setEditingTask((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();

    if (getStableJson(editingTask) === editingTaskSnapshot) return;

    const validationErrors = validateTask(editingTask);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) return;

    applyTasks(upsertAdminTask(editingTask));
    setEditingTask(null);
    setEditingTaskSnapshot("");
    showPendingPopup();
  };
  const handleToggleStatus = (task) => {
    applyTasks(
      tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: item.status === "completed" ? "pending" : "completed",
            }
          : item,
      ),
    );
    showPendingPopup();
  };
  const handleDelete = () => {
    if (!deleteTarget) return;

    applyTasks(removeAdminTask(deleteTarget.id));
    setDeleteTarget(null);
    showPendingPopup();
  };
  const handleDiscard = () => {
    const restoredTasks = discardAdminTaskChanges();

    setTasks(restoredTasks);
    setEditingTask(null);
    setEditingTaskSnapshot("");
    setDeleteTarget(null);
  };
  const handleSavePendingChanges = async () => {
    if (!hasPendingChanges) return true;

    try {
      spinner.show(adminContent.tasks.spinner.save);
      const normalizedTasks = await persistTasks({
        password: ADMIN_PASSWORD,
        tasks,
      });

      setAdminTasks(normalizedTasks);
      markAdminDataSaved({ tasks: normalizedTasks });
      setTasks(normalizedTasks);
      setPopup({
        message: adminContent.tasks.dialogs.savedMessage,
        open: true,
        title: adminContent.tasks.dialogs.savedTitle,
        type: "success",
      });
      return true;
    } catch (error) {
      console.error(error);
      setPopup({
        message: adminContent.tasks.dialogs.saveError,
        open: true,
        title: adminContent.tasks.dialogs.problemTitle,
        type: "error",
      });
      return false;
    } finally {
      spinner.hide();
    }
  };
  const {
    blocker,
    cancelBlockedNavigation,
    discardAndContinueNavigation,
    saveAndContinueNavigation,
  } = useAdminLocalChanges({
    hasPendingChanges,
    onDiscard: handleDiscard,
    onSave: handleSavePendingChanges,
  });

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <CinematicPage>
      {spinner.loading && <Spinner text={spinner.text} />}

      <AdminPageShell
        header={adminContent.tasks.header}
        innerClassName="max-w-7xl py-6"
        isVisible={tasksInView}
        rootRef={tasksRef}
      >
        <CinematicStaggeredRevealItem index={2} isVisible={tasksInView}>
          <TaskTotalsPanel loading={loading} stats={stats} />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={3} isVisible={tasksInView}>
          <AdminPendingChangesActions
            changes={pendingChanges}
            discardLabel={adminContent.tasks.actions.discardChanges}
            discardDialogText={adminContent.tasks.dialogs.discardText}
            discardDialogTitle={adminContent.tasks.dialogs.discardTitle}
            hasPendingChanges={hasPendingChanges}
            loading={loading}
            onDiscard={handleDiscard}
            onSave={handleSavePendingChanges}
            saveLabel={adminContent.tasks.actions.saveChanges}
            saving={spinner.loading}
            showText={!isMobileView}
          />
        </CinematicStaggeredRevealItem>

        <CinematicStaggeredRevealItem index={4} isVisible={tasksInView}>
          <AdminTableSection
            className="mt-4"
            actions={
              <TaskTableActions
                loading={loading}
                onCreate={handleCreateTask}
                showText={!isMobileView}
              />
            }
            actionsFullWidth
            eyebrow={adminContent.tasks.list.eyebrow}
            filters={
              <TaskFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onPriorityChange={setPriorityFilter}
                onQueryChange={setQuery}
                onStatusChange={setStatusFilter}
                priority={priorityFilter}
                query={query}
                status={statusFilter}
              />
            }
            getKey={getTaskKey}
            isMobileView={isMobileView}
            items={filteredTasks}
            loading={loading}
            skeletonConfig={{
              actionCount: 1,
              content: {
                itemClassName: "min-h-40",
                lines: 3,
              },
              filters: true,
            }}
            title={adminContent.tasks.list.title}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {groupedTasks.map(({ category, tasks: categoryTasks }) => (
                <TaskCategoryPanel
                  category={category}
                  emptyText={emptyState.text}
                  emptyTitle={emptyState.title}
                  key={category.value}
                  onDelete={setDeleteTarget}
                  onEdit={handleEditTask}
                  onToggleStatus={handleToggleStatus}
                  tasks={categoryTasks}
                />
              ))}
            </div>
          </AdminTableSection>
        </CinematicStaggeredRevealItem>
      </AdminPageShell>

      {editingTask && (
        <AdminEditorDialog
          onClose={() => {
            setEditingTask(null);
            setEditingTaskSnapshot("");
          }}
          title={
            tasks.some((task) => task.id === editingTask.id)
              ? adminContent.tasks.dialogs.editTitle
              : adminContent.tasks.dialogs.createTitle
          }
          titleId="task-editor-title"
        >
          <TaskForm
            errors={errors}
            form={editingTask}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitDisabled={getStableJson(editingTask) === editingTaskSnapshot}
          />
        </AdminEditorDialog>
      )}

      {deleteTarget && (
        <DeleteDialog
          confirmText={adminContent.tasks.actions.delete}
          message={adminContent.tasks.dialogs.deleteMessage(
            deleteTarget.title || "esta tarea",
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={adminContent.tasks.dialogs.deleteTitle}
        />
      )}

      {blocker.state === "blocked" && (
        <UnsavedChangesDialog
          changes={pendingChanges}
          labels={{
            eyebrow: adminContent.tasks.dialogs.warningEyebrow,
            exitWithoutSaving: adminContent.tables.dialogs.exitWithoutSaving,
            keepEditing: adminContent.tables.dialogs.keepEditing,
            saveAndExit: adminContent.tables.dialogs.saveAndExit,
            text: adminContent.tasks.dialogs.unsavedText,
            title: adminContent.tasks.dialogs.unsavedTitle,
          }}
          onCancel={cancelBlockedNavigation}
          onConfirm={discardAndContinueNavigation}
          onSaveAndExit={saveAndContinueNavigation}
          titleId="admin-tasks-unsaved-changes-title"
        />
      )}

      <StatusDialog
        eyebrow={adminContent.tasks.dialogs.warningEyebrow}
        message={popup.message}
        onClose={() => setPopup((current) => ({ ...current, open: false }))}
        open={popup.open}
        title={popup.title}
        type={popup.type}
      />
    </CinematicPage>
  );
}

