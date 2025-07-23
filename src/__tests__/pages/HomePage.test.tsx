import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';
import { AuthContext } from '../../contexts/AuthContext';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { balance_ils: 1000 }, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'client' as const,
  balance_ils: 1000,
  created_at: '2024-01-01',
  last_login: '2024-01-01'
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  validatePasswordStrength: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  hasPermission: vi.fn(),
  isAdmin: false
};

const renderWithAuth = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <HomePage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user greeting', async () => {
    renderWithAuth();
    
    await waitFor(() => {
      expect(screen.getByText('שלום, Test!')).toBeInTheDocument();
    });
  });

  it('displays user balance', async () => {
    renderWithAuth();
    
    await waitFor(() => {
      expect(screen.getByText('יתרת חשבון: ₪1,000')).toBeInTheDocument();
    });
  });

  it('shows lottery grid', async () => {
    renderWithAuth();
    
    await waitFor(() => {
      expect(screen.getByText('בחר 6 מספרים מאושרים')).toBeInTheDocument();
    });
  });

  it('displays countdown timer', async () => {
    renderWithAuth();
    
    await waitFor(() => {
      expect(screen.getByText('זמן לטירה הבא')).toBeInTheDocument();
    });
  });

  it('shows admin panel link for admin users', async () => {
    const adminAuthContext = {
      ...mockAuthContext,
      user: { ...mockUser, role: 'admin' as const },
      isAdmin: true
    };
    
    renderWithAuth(adminAuthContext);
    
    await waitFor(() => {
      expect(screen.getByText('פאנל ניהול')).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    const mockLogout = vi.fn();
    const authContextWithLogout = {
      ...mockAuthContext,
      logout: mockLogout
    };
    
    renderWithAuth(authContextWithLogout);
    
    await waitFor(() => {
      const logoutButton = screen.getByText('התנתק');
      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    const loadingAuthContext = {
      ...mockAuthContext,
      loading: true
    };
    
    renderWithAuth(loadingAuthContext);
    
    expect(screen.getByText('טוען...')).toBeInTheDocument();
  });
});