'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
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
import {
  columnSortableId,
  KanbanColumn,
  KanbanColumnPreview,
  mergeColumnApplications,
} from './kanban-column';
import { ApplicantCardContent } from './applicant-card';
import { StatusData } from '@/services/status/status.type';
import {
  Application,
  ApplicationListResponse,
} from '@/services/application/application.type';
import {
  applicationKeys,
  useMoveApplicationToColumn,
} from '@/services/application/application.client';
import { useReorderStatuses } from '@/services/status/status.client';

const isColumnDrag = (data: Record<string, unknown> | undefined) =>
  data?.type === 'column';

// A column is both a sortable (dragged by its header grip) and a card drop zone.
// Only let each kind of drag land on its own kind of target, or a dragged card
// could resolve to a whole column's sortable and a column to a card.
const collisionDetection: CollisionDetection = (args) => {
  const draggingColumn = isColumnDrag(args.active.data.current);
  const droppableContainers = args.droppableContainers.filter(
    (container) => isColumnDrag(container.data.current) === draggingColumn,
  );
  const detect = draggingColumn ? closestCenter : closestCorners;
  return detect({ ...args, droppableContainers });
};

// Settle the lifted item into its slot instead of snapping.
const dropAnimation: DropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0' } },
  }),
};

function Kanban({
  statuses,
  jobId,
}: {
  statuses: StatusData[];
  jobId: string;
}) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [optimisticMap, setOptimisticMap] = useState<{
    [statusId: string]: Application[];
  }>({});

  const { moveApplicationToColumn, isPending: isMovingApplicationToColumn } =
    useMoveApplicationToColumn();
  const { reorderStatuses } = useReorderStatuses();

  const [activeApplicant, setActiveApplicant] = useState<Application | null>(
    null,
  );
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setColumns(
      [...statuses]
        .sort((a, b) => a.weight - b.weight)
        .map((status) => ({ id: status._id, title: status.label })),
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
    setActiveId(active.id as string);
    if (isColumnDrag(active.data.current)) {
      setActiveApplicant(null);
      setActiveColumnId(active.data.current?.statusId as string);
      return;
    }
    setActiveColumnId(null);
    setActiveApplicant(active.data.current?.applicant as Application);
  };
  // const handleDragOver = ({ active, over }: DragOverEvent) => {
  //   if (!over) return;

  //   const activeApp = active.data.current?.applicant as Application;
  //   const overApp = over.data.current?.applicant as Application;
  //   const overIndex = over.data.current?.index as number;

  //   if (!activeApp) return;

  //   const fromStatus = activeApp.status._id;

  //   let toStatus = fromStatus;
  //   let toStatusLabel = activeApp.status.label;
  //   let index = 0;

  //   if (overApp) {
  //     toStatus = overApp.status._id;
  //     toStatusLabel = overApp.status.label;
  //     index = overIndex ?? 0;
  //   } else {
  //     // hovering over column
  //     toStatus = over.id as string;
  //     const statusData = statuses.find((s) => s._id === toStatus);
  //     toStatusLabel = statusData?.label || '';
  //     index = 0;
  //   }

  //   if (
  //     fromStatus === toStatus &&
  //     optimisticMap[toStatus]?.some(
  //       (a, i) => a._id === activeApp._id && i === index,
  //     )
  //   ) {
  //     return;
  //   }

  //   moveOptimistically(activeApp, fromStatus, toStatus, toStatusLabel, index);
  // };
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setActiveColumnId(null);
    if (!over) return;

    if (isColumnDrag(active.data.current)) {
      await handleColumnDragEnd(active.id, over.id);
      return;
    }

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

  const handleColumnDragEnd = async (
    draggedId: string | number,
    overId: string | number,
  ) => {
    if (draggedId === overId) return;

    const from = columns.findIndex((c) => columnSortableId(c.id) === draggedId);
    const to = columns.findIndex((c) => columnSortableId(c.id) === overId);
    if (from === -1 || to === -1) return;

    const previous = columns;
    const next = arrayMove(columns, from, to);
    setColumns(next);

    await reorderStatuses({
      payload: {
        collectionName: 'jobs',
        collectionId: jobId,
        statusIds: next.map((c) => c.id),
      },
      onErrorCallback: () => setColumns(previous),
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveColumnId(null);
    setActiveApplicant(null);
  };

  // The lifted column's cards, straight from the cache its column already filled —
  // reading through the hook would mount a second observer and refetch.
  const activeColumn = columns.find((c) => c.id === activeColumnId);
  const activeColumnApplications = activeColumn
    ? (
        queryClient.getQueryData<InfiniteData<ApplicationListResponse>>(
          applicationKeys.list({ jobId, statusId: activeColumn.id }),
        )?.pages ?? []
      ).flatMap((page) => page.docs)
    : [];

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
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          // onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-spacing-4xl overflow-x-auto pb-2 items-start">
            <SortableContext
              items={columns.map((col) => columnSortableId(col.id))}
              strategy={horizontalListSortingStrategy}
            >
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
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeColumn ? (
              <KanbanColumnPreview
                title={activeColumn.title}
                count={activeColumnApplications.length}
                applications={mergeColumnApplications(
                  activeColumnApplications,
                  optimisticMap[activeColumn.id] || [],
                  removedIds,
                )}
              />
            ) : activeApplicant ? (
              <div className="rotate-1 shadow-xl opacity-95">
                <ApplicantCardContent applicant={activeApplicant} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

export default Kanban;
