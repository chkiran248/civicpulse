import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  user: null,
  reset: vi.fn(),
  setScreen: vi.fn(),
  handleLogout: vi.fn(),
  handleLogin: vi.fn(),
};

describe('Header', () => {
  it('renders the CivicPulse logo', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByText(/CivicPulse/i)).toBeTruthy();
  });

  it('shows Sign In button when not authenticated', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByLabelText('Sign In with Google')).toBeTruthy();
  });

  it('calls handleLogin on Sign In click', () => {
    const handleLogin = vi.fn();
    render(<Header {...baseProps} handleLogin={handleLogin} />);
    fireEvent.click(screen.getByLabelText('Sign In with Google'));
    expect(handleLogin).toHaveBeenCalledOnce();
  });

  it('shows user name and logout when authenticated', () => {
    const user = {
      displayName: 'Surya Kiran',
      email: 'chkiran@gmail.com',
      photoURL: 'https://example.com/photo.jpg',
      uid: 'abc123',
    } as never;
    render(<Header {...baseProps} user={user} />);
    expect(screen.getByText('Surya Kiran')).toBeTruthy();
    expect(screen.getByLabelText('Sign Out')).toBeTruthy();
  });

  it('calls handleLogout on Sign Out click', () => {
    const handleLogout = vi.fn();
    const user = {
      displayName: 'Surya',
      email: 'a@b.com',
      photoURL: '',
      uid: 'x',
    } as never;
    render(<Header {...baseProps} user={user} handleLogout={handleLogout} />);
    fireEvent.click(screen.getByLabelText('Sign Out'));
    expect(handleLogout).toHaveBeenCalledOnce();
  });

  it('calls reset when logo is clicked', () => {
    const reset = vi.fn();
    render(<Header {...baseProps} reset={reset} />);
    fireEvent.click(screen.getByLabelText('CivicPulse Home'));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('has a skip-to-content link', () => {
    render(<Header {...baseProps} />);
    expect(screen.getByText('Skip to Content')).toBeTruthy();
  });
});
