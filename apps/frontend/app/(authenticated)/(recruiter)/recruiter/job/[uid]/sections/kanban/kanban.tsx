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

  // --- Drag handlers ---
  const handleDragStart = ({ active }: DragStartEvent) => {
    console.log('active', active);
    setActiveId(active.id as string);
    setActiveApplicant(active.data.current?.applicant as Application);
  };

  // const handleDragOver = ({ active, over }: DragOverEvent) => {
  //   if (!over) return;
  //   // console.log('active', active);
  //   // console.log('over', over);

  //   const activeApp = active.data.current?.applicant as Application;
  //   if (!activeApp) return;

  //   const overIsColumn = columns.some((c) => c.id === over.id);
  //   const overApplicant = applicants.find((a) => a.id === over.id);
  //   const targetColumn = overIsColumn
  //     ? (over.id as string)
  //     : overApplicant
  //       ? overApplicant.column
  //       : activeApp.column;

  //   if (activeApp.column !== targetColumn) {
  //     setApplicants((prev) =>
  //       prev.map((a) =>
  //         a.id === active.id ? { ...a, column: targetColumn } : a,
  //       ),
  //     );
  //   }
  // };

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

    // return;

    if (!overApp && over.id === activeApp.status._id) {
      console.log('same column');
      return;
    }

    if (!overApp) {
      await moveApplicationToColumn({
        id: activeApp._id,
        payload: {
          targetStatusId: over.id as string,
          targetIndex: 0,
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
          // onDragOver={handleDragOver}
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
