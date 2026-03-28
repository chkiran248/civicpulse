import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Suppress console.error for expected errors in these tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function BrokenComponent({ message }: { message?: string }): React.ReactElement {
  throw new Error(message || 'Test error');
}

function HealthyComponent() {
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <HealthyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('System Error')).toBeTruthy();
  });

  it('shows generic error message for non-Firestore errors', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent message="Something broke" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('shows Firestore-specific message for JSON errors', () => {
    const firestoreMsg = JSON.stringify({ error: 'Permission denied', operationType: 'write' });
    render(
      <ErrorBoundary>
        <BrokenComponent message={firestoreMsg} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Database Error/i)).toBeTruthy();
  });

  it('has a Reload Application button', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Reload Application')).toBeTruthy();
  });

  it('reload button calls window.location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByText('Reload Application'));
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});
