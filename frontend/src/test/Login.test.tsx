import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';

// Mock Translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

describe('Login Component', () => {
    it('renders login form fields', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        expect(screen.getByPlaceholderText('login.emailPlaceholder')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('login.passwordPlaceholder')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'login.signIn' })).toBeInTheDocument();
    });

    it('updates input values on change', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        const emailInput = screen.getByPlaceholderText('login.emailPlaceholder') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('login.passwordPlaceholder') as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('shows register link', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        expect(screen.getByText('login.createAccount')).toBeInTheDocument();
    });
});
