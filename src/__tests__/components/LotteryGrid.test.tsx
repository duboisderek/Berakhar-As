import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LotteryGrid from '../../components/LotteryGrid';

const mockOnPurchaseTicket = vi.fn();

describe('LotteryGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lottery grid with numbers 1-37', () => {
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={1000}
      />
    );

    // Check that numbers 1-37 are rendered
    for (let i = 1; i <= 37; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }

    // Check for the selection text using a function matcher
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'נותרו לבחירה: 6 מספרים';
    })).toBeInTheDocument();
  });

  it('allows selecting up to 6 numbers', () => {
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={1000}
      />
    );

    // Select 6 numbers
    for (let i = 1; i <= 6; i++) {
      fireEvent.click(screen.getByText(i.toString()));
    }

    // Try to select 7th number - should show error
    fireEvent.click(screen.getByText('7'));
    
    // Should still only have 6 selected (0 remaining)
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'נותרו לבחירה: 0 מספרים';
    })).toBeInTheDocument();
  });

  it('prevents purchase with insufficient balance', () => {
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={30} // Less than 50
      />
    );

    // Select 6 numbers
    for (let i = 1; i <= 6; i++) {
      fireEvent.click(screen.getByText(i.toString()));
    }

    const purchaseButton = screen.getByText('רכוש כרטיס - ₪50');
    expect(purchaseButton).toBeDisabled();
    expect(screen.getByText('יתרה לא מספיקה - יש צורך להפקיד כסף')).toBeInTheDocument();
  });

  it('calls onPurchaseTicket with selected numbers', async () => {
    mockOnPurchaseTicket.mockResolvedValue(undefined);
    
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={1000}
      />
    );

    // Select 6 numbers
    const selectedNumbers = [1, 2, 3, 4, 5, 6];
    selectedNumbers.forEach(num => {
      fireEvent.click(screen.getByText(num.toString()));
    });

    // Click purchase button
    fireEvent.click(screen.getByText('רכוש כרטיס - ₪50'));

    await waitFor(() => {
      expect(mockOnPurchaseTicket).toHaveBeenCalledWith(selectedNumbers);
    });
  });

  it('clears selection when clear button is clicked', () => {
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={1000}
      />
    );

    // Select some numbers
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    
    // Check that 4 numbers remain to be selected
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'נותרו לבחירה: 4 מספרים';
    })).toBeInTheDocument();

    // Clear selection
    fireEvent.click(screen.getByText('נקה בחירה'));
    
    // Check that all 6 numbers are available again
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'נותרו לבחירה: 6 מספרים';
    })).toBeInTheDocument();
  });

  it('disables grid when disabled prop is true', () => {
    render(
      <LotteryGrid 
        onPurchaseTicket={mockOnPurchaseTicket}
        userBalance={1000}
        disabled={true}
      />
    );

    const numberButton = screen.getByText('1');
    expect(numberButton).toBeDisabled();
  });
});