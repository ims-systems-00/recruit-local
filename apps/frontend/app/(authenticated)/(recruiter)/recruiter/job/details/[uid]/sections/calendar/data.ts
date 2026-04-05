import { CalendarEvent } from './event-chip';

// Current month = April 2026
const Y = 2026;
const M = 3; // 0-indexed: April

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: new Date(Y, M, 6, 10, 0),
    end: new Date(Y, M, 6, 10, 30),
    color: 'default',
  },
  {
    id: '2',
    title: 'Design Review',
    start: new Date(Y, M, 6, 14, 0),
    end: new Date(Y, M, 6, 15, 0),
    color: 'pink',
    avatar: 'DR',
  },
  {
    id: '3',
    title: 'Sprint Planning',
    start: new Date(Y, M, 6, 9, 0),
    end: new Date(Y, M, 6, 10, 0),
    color: 'default',
  },
  {
    id: '4',
    title: 'Product Demo',
    start: new Date(Y, M, 6, 16, 0),
    end: new Date(Y, M, 6, 17, 0),
    color: 'pink',
    avatar: 'PD',
  },
  {
    id: '5',
    title: 'Client Call',
    start: new Date(Y, M, 16, 10, 0),
    end: new Date(Y, M, 16, 11, 0),
    color: 'default',
  },
  {
    id: '6',
    title: 'UX Workshop',
    start: new Date(Y, M, 16, 11, 0),
    end: new Date(Y, M, 16, 12, 30),
    color: 'pink',
    avatar: 'UX',
  },
  {
    id: '7',
    title: 'Board Meeting',
    start: new Date(Y, M, 16, 14, 0),
    end: new Date(Y, M, 16, 15, 0),
    color: 'default',
  },
  {
    id: '8',
    title: 'All Hands',
    start: new Date(Y, M, 16, 16, 0),
    end: new Date(Y, M, 16, 17, 0),
    color: 'pink',
    avatar: 'AH',
  },
  {
    id: '9',
    title: 'Investor Update',
    start: new Date(Y, M, 22, 10, 0),
    end: new Date(Y, M, 22, 11, 0),
    color: 'default',
  },
  {
    id: '10',
    title: 'Retrospective',
    start: new Date(Y, M, 28, 15, 0),
    end: new Date(Y, M, 28, 16, 0),
    color: 'pink',
    avatar: 'RT',
  },
  {
    id: '11',
    title: 'Sprint Planning 2',
    start: new Date(Y, M, 6, 9, 0),
    end: new Date(Y, M, 6, 9, 20),
    color: 'default',
  },
];
