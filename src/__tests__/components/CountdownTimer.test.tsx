import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CountdownTimer from '../../components/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays countdown correctly', () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    
    render(<CountdownTimer targetDate={futureDate} />);

    expect(screen.getByText('זמן לטירה הבא')).toBeInTheDocument();
    expect(screen.getByText('ימים')).toBeInTheDocument();
    expect(screen.getByText('שעות')).toBeInTheDocument();
    expect(screen.getByText('דקות')).toBeInTheDocument();
    expect(screen.getByText('שניות')).toBeInTheDocument();
  });

  it('calls onComplete when countdown reaches zero', () => {
    const onComplete = vi.fn();
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    
    render(<CountdownTimer targetDate={pastDate} onComplete={onComplete} />);

    // Fast forward time to trigger the interval
    vi.advanceTimersByTime(1000);

    expect(onComplete).toHaveBeenCalled();
  });

  it('updates countdown every second', () => {
    const futureDate = new Date(Date.now() + 61 * 1000); // 61 seconds from now
    
    render(<CountdownTimer targetDate={futureDate} />);

    // Should show 01 minute initially - look for the minutes display
    expect(screen.getByText(/01/)).toBeInTheDocument();

    // Fast forward 1 second
    vi.advanceTimersByTime(1000);

    // Should still show 01 minute (60 seconds remaining)
    expect(screen.getByText(/01/)).toBeInTheDocument();
  });

  it('displays Hebrew weekday correctly', () => {
    const futureDate = new Date('2024-01-01T20:00:00'); // Monday
    
    render(<CountdownTimer targetDate={futureDate} />);

    expect(screen.getByText(/יום/)).toBeInTheDocument();
  });
});