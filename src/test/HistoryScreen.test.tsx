import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryScreen } from '../components/HistoryScreen';
import type { CivicTicket } from '../lib/gemini';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockTickets: CivicTicket[] = [
  {
    id: 'CP-11111',
    issueType: 'Pothole',
    description: 'Deep pothole near Indiranagar.',
    severity: 'High',
    department: 'BBMP',
    actionRequired: 'Resurface road.',
    safetyRisk: true,
    estimatedResponseTime: '48 hours',
    image: 'https://picsum.photos/200',
    status: 'Open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'CP-22222',
    issueType: 'Street Light',
    description: 'Broken street light in Koramangala.',
    severity: 'Medium',
    department: 'BESCOM',
    actionRequired: 'Replace bulb.',
    safetyRisk: false,
    estimatedResponseTime: '72 hours',
    image: 'https://picsum.photos/201',
    status: 'In Progress',
    createdAt: new Date().toISOString(),
  },
];

describe('HistoryScreen', () => {
  it('shows empty state when no reports', () => {
    render(<HistoryScreen history={[]} setScreen={vi.fn()} setTicket={vi.fn()} />);
    expect(screen.getByText('No reports yet')).toBeTruthy();
  });

  it('shows total report count', () => {
    render(<HistoryScreen history={mockTickets} setScreen={vi.fn()} setTicket={vi.fn()} />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders each ticket card', () => {
    render(<HistoryScreen history={mockTickets} setScreen={vi.fn()} setTicket={vi.fn()} />);
    expect(screen.getByText('Pothole')).toBeTruthy();
    expect(screen.getByText('Street Light')).toBeTruthy();
  });

  it('calls setTicket and setScreen when a card is clicked', () => {
    const setTicket = vi.fn();
    const setScreen = vi.fn();
    render(<HistoryScreen history={mockTickets} setScreen={setScreen} setTicket={setTicket} />);
    fireEvent.click(screen.getByLabelText(/View Report Details for Pothole/i));
    expect(setTicket).toHaveBeenCalledWith(mockTickets[0]);
    expect(setScreen).toHaveBeenCalledWith('ticket');
  });

  it('navigates back on Back button click', () => {
    const setScreen = vi.fn();
    render(<HistoryScreen history={[]} setScreen={setScreen} setTicket={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Back to Reporting'));
    expect(setScreen).toHaveBeenCalledWith('upload');
  });

  it('shows Report First Issue button in empty state', () => {
    render(<HistoryScreen history={[]} setScreen={vi.fn()} setTicket={vi.fn()} />);
    expect(screen.getByLabelText('Report Your First Issue')).toBeTruthy();
  });
});
