import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';
import { CartProvider } from '../context/CartContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

// Mock useCart hook directly instead of providing context, 
// because Header.tsx uses useCart() which might be hard to override via Provider if not exported
vi.mock('../context/CartContext', () => ({
    useCart: () => ({
        cartCount: (global as any).mockCartCount || 0,
        refreshCart: vi.fn()
    }),
    CartProvider: ({ children }: any) => <div>{children}</div>
}));

describe('Header Component', () => {
    it('renders navigation links', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText('header.collections')).toBeInTheDocument();
        expect(screen.getByText('header.deals')).toBeInTheDocument();
    });

    it('shows cart badge only when count > 0', () => {
        (global as any).mockCartCount = 0;
        const { rerender } = render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.queryByText('5')).not.toBeInTheDocument();

        (global as any).mockCartCount = 5;
        rerender(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows login button when user is not logged in', () => {
        localStorage.removeItem('user');
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText('login.signIn')).toBeInTheDocument();
    });

    it('shows user greeting when logged in', () => {
        const user = { name: 'Test User', email: 'test@test.com', role: 'customer' };
        localStorage.setItem('user', JSON.stringify(user));
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText(/header.hello/i)).toBeInTheDocument();
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
        localStorage.removeItem('user');
    });
});
