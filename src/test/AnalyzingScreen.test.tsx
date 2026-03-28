import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyzingScreen } from '../components/AnalyzingScreen';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const facts = ['Fact one about Bengaluru.', 'Fact two about Bengaluru.'];

describe('AnalyzingScreen', () => {
  it('renders the heading', () => {
    render(<AnalyzingScreen analyzingFact={0} blrFacts={facts} />);
    expect(screen.getByText('AI Analysis in Progress')).toBeTruthy();
  });

  it('displays the current fact', () => {
    render(<AnalyzingScreen analyzingFact={0} blrFacts={facts} />);
    expect(screen.getByText('Fact one about Bengaluru.')).toBeTruthy();
  });

  it('displays the second fact when index is 1', () => {
    render(<AnalyzingScreen analyzingFact={1} blrFacts={facts} />);
    expect(screen.getByText('Fact two about Bengaluru.')).toBeTruthy();
  });

  it('has aria-live="polite" on the fact container', () => {
    const { container } = render(<AnalyzingScreen analyzingFact={0} blrFacts={facts} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
  });

  it('has aria-busy on the spinner', () => {
    const { container } = render(<AnalyzingScreen analyzingFact={0} blrFacts={facts} />);
    const spinner = container.querySelector('[aria-busy="true"]');
    expect(spinner).toBeTruthy();
  });

  it('has a progressbar role', () => {
    render(<AnalyzingScreen analyzingFact={0} blrFacts={facts} />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
