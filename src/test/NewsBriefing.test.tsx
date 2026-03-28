import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewsBriefing } from '../components/NewsBriefing';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockBrief = {
  summary: 'BBMP resurfaced 10 km of roads today.',
  headlines: [
    { title: 'Road work update', url: 'https://example.com', source: 'Deccan Herald' },
    { title: 'BESCOM outage resolved', url: 'https://example2.com', source: 'The Hindu' },
  ],
  lastUpdated: new Date().toISOString(),
};

describe('NewsBriefing', () => {
  it('shows skeleton loader when loading with no data', () => {
    const { container } = render(<NewsBriefing newsBrief={null} isLoading={true} onRefresh={vi.fn()} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows empty state when not loading and no data', () => {
    render(<NewsBriefing newsBrief={null} isLoading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('No news updates available.')).toBeTruthy();
  });

  it('renders summary and headlines', () => {
    render(<NewsBriefing newsBrief={mockBrief} isLoading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText(/BBMP resurfaced/)).toBeTruthy();
    expect(screen.getByText('Road work update')).toBeTruthy();
    expect(screen.getByText('BESCOM outage resolved')).toBeTruthy();
  });

  it('shows source for each headline', () => {
    render(<NewsBriefing newsBrief={mockBrief} isLoading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('Deccan Herald')).toBeTruthy();
    expect(screen.getByText('The Hindu')).toBeTruthy();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<NewsBriefing newsBrief={mockBrief} isLoading={false} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByLabelText('Refresh News Briefing'));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('disables refresh button when loading', () => {
    render(<NewsBriefing newsBrief={mockBrief} isLoading={true} onRefresh={vi.fn()} />);
    expect(screen.getByLabelText('Refreshing news…')).toBeDisabled();
  });

  it('has aria-busy on refresh button when loading', () => {
    render(<NewsBriefing newsBrief={null} isLoading={true} onRefresh={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('headline links open in new tab with rel noopener', () => {
    render(<NewsBriefing newsBrief={mockBrief} isLoading={false} onRefresh={vi.fn()} />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('has a section with aria-labelledby for accessibility', () => {
    const { container } = render(<NewsBriefing newsBrief={null} isLoading={false} onRefresh={vi.fn()} />);
    const section = container.querySelector('section[aria-labelledby]');
    expect(section).toBeTruthy();
  });
});
