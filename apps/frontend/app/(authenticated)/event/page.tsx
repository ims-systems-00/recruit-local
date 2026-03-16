'use client';

import React, { useState } from 'react';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useSoftDeleteEvent,
  useHardDeleteEvent,
  useRestoreEvent
} from '@/services/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RefreshCw, Plus, Trash2, Edit3, RotateCcw, Search, Loader2 } from 'lucide-react';
import { EVENT_MODE_ENUMS, EVENT_TYPE_ENUMS } from '@rl/types';

// Temporary helper to display date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export default function EventSimulationPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('Product Launch Webinar');
  const [newDescription, setNewDescription] = useState('Experience our latest product features live.');
  const [newLocation, setNewLocation] = useState('Online - Zoom');
  const [newCapacity, setNewCapacity] = useState(500);
  const [newType, setNewType] = useState<EVENT_TYPE_ENUMS>(EVENT_TYPE_ENUMS.WORKSHOP);
  const [newMode, setNewMode] = useState<EVENT_MODE_ENUMS>(EVENT_MODE_ENUMS.VIRTUAL);
  // Use future dates to satisfy backend date ordering: registrationEndDate <= startDate <= endDate
  const [newStartDate, setNewStartDate] = useState('2026-05-01');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndDate, setNewEndDate] = useState('2026-05-05');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newRegEndDate, setNewRegEndDate] = useState('2026-04-30');
  // Organizers must be valid MongoDB ObjectIds (not plain text strings)
  const [newOrganizers, setNewOrganizers] = useState('695f692615f032dd26f12ccb, 69439198f7831de4c1a425e5');
  const [newStatusId, setNewStatusId] = useState('69b7c9227e32d782ac90b131');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Service hooks
  const { events, isLoading, refetch, isFetching } = useEvents({ search: searchTerm });
  const { createEvent, isPending: isCreating } = useCreateEvent();
  const { updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { softDeleteEvent, isPending: isSoftDeleting } = useSoftDeleteEvent();
  const { hardDeleteEvent, isPending: isHardDeleting } = useHardDeleteEvent();
  const { restoreEvent, isPending: isRestoring } = useRestoreEvent();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    await createEvent({
      title: newTitle,
      description: newDescription,
      location: newLocation,
      capacity: newCapacity,
      type: newType as any,
      mode: newMode as any,
      startDate: "2026-02-16T23:59:00.000Z",
      startTime: "09:00",
      endDate: "2026-02-16T23:59:00.000Z",
      endTime: "17:00",
      registrationEndDate: "2026-02-16T23:59:00.000Z",
      organizers: [
        "695f692615f032dd26f12ccb",
        "69439198f7831de4c1a425e5"
      ],
      statusId: "69b7c9227e32d782ac90b131",
      virtualEvent: {
        link: 'https://zoom.us/j/123456789',
        id: '123456789',
        password: 'password123'
      }
    });
  };

  const handleUpdate = async (id: string) => {
    await updateEvent({
      id,
      payload: {
        title: editTitle,
      }
    });
    setEditingId(null);
  };

  const startEditing = (event: any) => {
    setEditingId(event._id);
    setEditTitle(event.title);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Service Simulation</h1>
          <p className="text-muted-foreground">Test CRUD operations for the Event service.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filters Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Filter</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by title..."
                />
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium">Quick Actions</p>
              <p className="text-xs text-muted-foreground">Status ID used for testing: {newStatusId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Create Event Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Add a new event with various configuration options.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="organizers">Organizers (comma separated)</Label>
                  <Input id="organizers" value={newOrganizers} onChange={(e) => setNewOrganizers(e.target.value)} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description (Limited to 5k chars)</Label>
                  <Textarea id="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / URL</Label>
                  <Input id="location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" value={newCapacity} onChange={(e) => setNewCapacity(parseInt(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as EVENT_TYPE_ENUMS)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EVENT_TYPE_ENUMS).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select value={newMode} onValueChange={(v) => setNewMode(v as EVENT_MODE_ENUMS)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EVENT_MODE_ENUMS).map(mode => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (HH:mm)</Label>
                  <Input id="startTime" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (HH:mm)</Label>
                  <Input id="endTime" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEndDate">Registration End Date</Label>
                  <Input id="regEndDate" type="date" value={newRegEndDate} onChange={(e) => setNewRegEndDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusId">Status ID (MongoDB Id)</Label>
                  <Input id="statusId" value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Simulation Event
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Simulated Events History</CardTitle>
          <CardDescription>View and manage existing events from the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No events found. Try creating one!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Org</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event: any) => (
                  <TableRow key={event._id}>
                    <TableCell className="font-medium">
                      {editingId === event._id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        event.title
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{event.type}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{event.mode}</Badge></TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {formatDate(event.startDate)} {event.startTime}
                        <div className="text-muted-foreground">to {formatDate(event.endDate)} {event.endTime}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {event.organizers?.map((org: string, idx: number) => (
                          <Badge key={idx} variant="ghost" className="text-[10px] h-4">{org}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.deletedAt ? (
                        <Badge variant="destructive">Trash</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === event._id ? (
                          <>
                            <Button size="sm" onClick={() => handleUpdate(event._id)} disabled={isUpdating}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            {event.deletedAt ? (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-blue-500"
                                onClick={() => restoreEvent(event._id)}
                                title="Restore"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => startEditing(event)}
                                title="Edit Title"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 text-orange-500"
                              onClick={() => softDeleteEvent(event._id)}
                              disabled={!!event.deletedAt}
                              title="Soft Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => {
                                if (confirm('Are you sure? This is permanent.')) {
                                  hardDeleteEvent(event._id);
                                }
                              }}
                              title="Hard Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
