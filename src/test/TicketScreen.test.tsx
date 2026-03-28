import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketScreen } from '../components/TicketScreen';
import type { CivicTicket } from '../lib/gemini';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockTicket: CivicTicket = {
  id: 'CP-12345',
  issueType: 'Pothole',
  description: 'Large pothole on MG Road causing traffic hazards.',
  severity: 'High',
  department: 'BBMP',
  actionRequired: 'Fill and resurface immediately.',
  safetyRisk: true,
  estimatedResponseTime: '48 hours',
  image: 'https://picsum.photos/200',
  status: 'Open',
  createdAt: new Date().toISOString(),
};

describe('TicketScreen', () => {
  it('renders null when ticket is null', () => {
    const { container } = render(<TicketScreen ticket={null} reset={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays the ticket ID', () => {
    render(<TicketScreen ticket={mockTicket} reset={vi.fn()} />);
    expect(screen.getByText('#CP-12345')).toBeTruthy();
  });

  it('displays the issue type', () => {
    render(<TicketScreen ticket={mockTicket} reset={vi.fn()} />);
    expect(screen.getByText('Pothole')).toBeTruthy();
  });

  it('displays the department', () => {
    render(<TicketScreen ticket={mockTicket} reset={vi.fn()} />);
    expect(screen.getAllByText('BBMP').length).toBeGreaterThan(0);
  });

  it('shows High Risk when safetyRisk is true', () => {
    render(<TicketScreen ticket={mockTicket} reset={vi.fn()} />);
    expect(screen.getByText('High Risk')).toBeTruthy();
  });

  it('shows Minimal when safetyRisk is false', () => {
    render(<TicketScreen ticket={{ ...mockTicket, safetyRisk: false }} reset={vi.fn()} />);
    expect(screen.getByText('Minimal')).toBeTruthy();
  });

  it('calls reset when Report Another is clicked', () => {
    const reset = vi.fn();
    render(<TicketScreen ticket={mockTicket} reset={reset} />);
    fireEvent.click(screen.getByLabelText('Report Another Issue'));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('has success confirmation message', () => {
    render(<TicketScreen ticket={mockTicket} reset={vi.fn()} />);
    expect(screen.getByText('Ticket Generated Successfully')).toBeTruthy();
  });
});
