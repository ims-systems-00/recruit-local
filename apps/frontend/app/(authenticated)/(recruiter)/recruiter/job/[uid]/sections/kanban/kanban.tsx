'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Column } from './data';
import { KanbanColumn } from './kanban-column';
import { ApplicantCard } from './applicant-card';
import { StatusData } from '@/services/status/status.type';
import { Application } from '@/services/application/application.type';
import { useMoveApplicationToColumn } from '@/services/application/application.client';

function Kanban({
  statuses,
  jobId,
}: {
  statuses: StatusData[];
  jobId: string;
}) {
  console.log('statuses', statuses);
  const [columns, setColumns] = useState<Column[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [optimisticMap, setOptimisticMap] = useState<{
    [statusId: string]: Application[];
  }>({});
  const { moveApplicationToColumn, isPending: isMovingApplicationToColumn } =
    useMoveApplicationToColumn();

  const [activeApplicant, setActiveApplicant] = useState<Application | null>(
    null,
  );

  useEffect(() => {
    setColumns(
      statuses.map((status) => ({ id: status._id, title: status.label })),
    );
  }, [statuses]);

  // const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const moveOptimistically = (
    app: Application,
    fromStatus: string,
    toStatus: string,
    toStatusLabel: string,
    toIndex: number,
  ) => {
    setOptimisticMap((prev) => {
      const next = { ...prev };
      setRemovedIds((prevIds) => new Set(prevIds).add(app._id));
      // remove from source
      next[fromStatus] = (next[fromStatus] || []).filter(
        (a) => a._id !== app._id,
      );

      // insert into target
      const targetList = next[toStatus] || [];
      const newTarget = [...targetList];
      newTarget.splice(toIndex, 0, {
        ...app,
        status: { ...app.status, _id: toStatus, label: toStatusLabel },
      });

      next[toStatus] = newTarget;

      return next;
    });
  };

  const rollbackMove = (
    app: Application,
    fromStatus: string,
    toStatus: string,
  ) => {
    setOptimisticMap((prev) => {
      const next = { ...prev };

      // remove from wrong column
      next[toStatus] = (next[toStatus] || []).filter((a) => a._id !== app._id);

      // restore to original
      next[fromStatus] = [...(next[fromStatus] || []), app];

      return next;
    });
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(app._id); // ✅ restore original
      return next;
    });
  };

  // --- Drag handlers ---
  const handleDragStart = ({ active }: DragStartEvent) => {
    console.log('active', active);
    setActiveId(active.id as string);
    setActiveApplicant(active.data.current?.applicant as Application);
  };
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;

    const activeApp = active.data.current?.applicant as Application;
    const overApp = over.data.current?.applicant as Application;
    const overIndex = over.data.current?.index as number;

    if (!activeApp) return;

    const fromStatus = activeApp.status._id;

    let toStatus = fromStatus;
    let toStatusLabel = activeApp.status.label;
    let index = 0;

    if (overApp) {
      toStatus = overApp.status._id;
      toStatusLabel = overApp.status.label;
      index = overIndex ?? 0;
    } else {
      // hovering over column
      toStatus = over.id as string;
      const statusData = statuses.find((s) => s._id === toStatus);
      toStatusLabel = statusData?.label || '';
      index = 0;
    }

    // 🚫 prevent unnecessary updates
    if (
      fromStatus === toStatus &&
      optimisticMap[toStatus]?.some(
        (a, i) => a._id === activeApp._id && i === index,
      )
    ) {
      return;
    }

    moveOptimistically(activeApp, fromStatus, toStatus, toStatusLabel, index);
  };
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    console.log('active end', active);
    console.log('over end', over);

    const activeApp = active.data.current?.applicant as Application;
    const overIndex = over.data.current?.index as number;
    const overApp = over.data.current?.applicant as Application;

    if (over.id === active.id) return;

    if (!activeApp) return;

    const fromStatus = activeApp.status._id;
    const fromStatusLabel = activeApp.status.label;
    let toStatus = fromStatus;
    let toStatusLabel = fromStatusLabel;
    let index = 0;

    if (overApp) {
      toStatus = overApp.status._id;
      toStatusLabel = overApp.status.label;
      index = overIndex || 0;
    } else {
      toStatus = over.id as string;
      index = 0;
      const toStatusData = statuses.find((s) => s._id === toStatus);
      toStatusLabel = toStatusData?.label || '';
    }

    // return;

    if (!overApp && over.id === activeApp.status._id) {
      console.log('same column');
      return;
    }

    moveOptimistically(activeApp, fromStatus, toStatus, toStatusLabel, index);

    if (!overApp) {
      await moveApplicationToColumn({
        id: activeApp._id,
        payload: {
          targetStatusId: over.id as string,
          targetIndex: 0,
        },
        onErrorCallback: () => {
          rollbackMove(activeApp, fromStatus, toStatus);
        },
      });

      return;
    }

    await moveApplicationToColumn({
      id: activeApp._id,
      payload: {
        targetStatusId: overApp.status._id,
        targetIndex: overIndex || 0,
      },
      onErrorCallback: () => {
        rollbackMove(activeApp, fromStatus, toStatus);
      },
    });
  };

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c)),
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    // setApplicants((prev) => prev.filter((a) => a.column !== columnId));
  };

  return (
    <>
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-spacing-4xl overflow-x-auto pb-2 items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                // applicants={getColumnApplicants(col.id)}
                // onAddClick={handleAddClick}
                // onEdit={handleEdit}
                // onDelete={handleDelete}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                jobId={jobId}
                optimisticItems={optimisticMap[col.id] || []}
                removedIds={removedIds}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApplicant ? (
              <div className="rotate-1 shadow-xl opacity-95">
                <ApplicantCard applicant={activeApplicant} index={0} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

export default Kanban;
