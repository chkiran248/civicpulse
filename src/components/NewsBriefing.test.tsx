import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewsBriefing } from './NewsBriefing';
import '@testing-library/jest-dom';

const mockNewsBrief = {
  summary: "Test summary for Bengaluru news.",
  headlines: [
    { title: "Test Headline", url: "https://test.com", source: "Test Source" }
  ],
  lastUpdated: new Date().toISOString()
};

describe('NewsBriefing Component', () => {
  it('renders loading state correctly', () => {
    render(<NewsBriefing newsBrief={null} isLoading={true} onRefresh={() => {}} />);
    expect(screen.getByText(/Daily Bengaluru Pulse/i)).toBeInTheDocument();
  });

  it('renders news content correctly', () => {
    render(<NewsBriefing newsBrief={mockNewsBrief} isLoading={false} onRefresh={() => {}} />);
    expect(screen.getByText(/Test summary for Bengaluru news/i)).toBeInTheDocument();
    // Use getByRole to be more specific and avoid multiple matches with aria-label
    expect(screen.getByRole('link', { name: /Read full article: Test Headline from Test Source/i })).toBeInTheDocument();
    expect(screen.getByText(/Test Source/i)).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<NewsBriefing newsBrief={mockNewsBrief} isLoading={false} onRefresh={onRefresh} />);
    const refreshButton = screen.getByLabelText(/Refresh News Briefing/i);
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders empty state correctly', () => {
    render(<NewsBriefing newsBrief={null} isLoading={false} onRefresh={() => {}} />);
    expect(screen.getByText(/No news updates available/i)).toBeInTheDocument();
  });
});
