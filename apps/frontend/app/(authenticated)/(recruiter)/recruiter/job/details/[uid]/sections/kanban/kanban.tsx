'use client';

import { useState, useCallback } from 'react';
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
import { Applicant, Column, INITIAL_APPLICANTS, INITIAL_COLUMNS } from './data';
import { KanbanColumn } from './kanban-column';
import { ApplicantCard } from './applicant-card';

function Kanban() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Add Section dialog
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeApplicant = applicants.find((a) => a.id === activeId) ?? null;

  const getColumnApplicants = useCallback(
    (columnId: string) => applicants.filter((a) => a.column === columnId),
    [applicants],
  );

  // --- Drag handlers ---
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeApp = applicants.find((a) => a.id === active.id);
    if (!activeApp) return;

    const overIsColumn = columns.some((c) => c.id === over.id);
    const overApplicant = applicants.find((a) => a.id === over.id);
    const targetColumn = overIsColumn
      ? (over.id as string)
      : overApplicant
        ? overApplicant.column
        : activeApp.column;

    if (activeApp.column !== targetColumn) {
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === active.id ? { ...a, column: targetColumn } : a,
        ),
      );
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const activeApp = applicants.find((a) => a.id === active.id);
    const overApp = applicants.find((a) => a.id === over.id);

    if (!activeApp) return;

    if (overApp && activeApp.column === overApp.column) {
      const colApplicants = applicants.filter(
        (a) => a.column === activeApp.column,
      );
      const oldIndex = colApplicants.findIndex((a) => a.id === active.id);
      const newIndex = colApplicants.findIndex((a) => a.id === over.id);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(colApplicants, oldIndex, newIndex);
        setApplicants((prev) => {
          const others = prev.filter((a) => a.column !== activeApp.column);
          return [...others, ...reordered];
        });
      }
    }
  };

  // --- Column handlers ---
  const handleAddSection = () => {
    const title = newSectionTitle.trim();
    if (!title) return;
    const id = `col_${Date.now()}`;
    setColumns((prev) => [...prev, { id, title }]);
    setNewSectionTitle('');
    setAddSectionOpen(false);
  };

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c)),
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setApplicants((prev) => prev.filter((a) => a.column !== columnId));
  };

  // --- Card handlers ---
  const handleAddClick = (columnId: string) => {
    const newId = String(Date.now());
    const count = applicants.length + 1;
    setApplicants((prev) => [
      ...prev,
      {
        id: newId,
        num: String(count).padStart(3, '0'),
        name: 'New Applicant',
        email: 'applicant@example.com',
        status: 'Started',
        appliedDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }),
        appliedTime: new Date()
          .toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          .toLowerCase(),
        column: columnId,
        avatarUrl: `https://i.pravatar.cc/48?img=${count % 70}`,
      },
    ]);
  };

  const handleEdit = (applicant: Applicant) => {
    const newName = prompt('Edit name:', applicant.name);
    if (newName && newName.trim()) {
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicant.id ? { ...a, name: newName.trim() } : a,
        ),
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this applicant?')) {
      setApplicants((prev) => prev.filter((a) => a.id !== id));
    }
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
                applicants={getColumnApplicants(col.id)}
                onAddClick={handleAddClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Add Section button */}
            <div className="shrink-0 min-w-[365px]">
              <button
                onClick={() => setAddSectionOpen(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 text-gray-400 hover:text-blue-500 rounded-xl py-4 px-4 transition-all text-sm font-medium"
              >
                <Plus size={16} />
                Add Section
              </button>
            </div>
          </div>

          <DragOverlay>
            {activeApplicant ? (
              <div className="rotate-1 shadow-xl opacity-95">
                <ApplicantCard
                  applicant={activeApplicant}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Section name (e.g. Final Interview)"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSection}
              disabled={!newSectionTitle.trim()}
              className="bg-bg-brand-solid-primary text-white!"
            >
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Kanban;
