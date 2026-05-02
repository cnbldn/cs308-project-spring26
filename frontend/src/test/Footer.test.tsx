import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

// Mock Translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (key === 'footer.copyright') return `© ${options?.year || 2026} Game Vault. All rights reserved.`;
            if (key === 'footer.privacyTerms') return 'Privacy Policy | Terms of Service';
            return key;
        },
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

describe('Footer Component', () => {
    it('renders the copyright text with brand name', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        expect(screen.getByText(/Game Vault/i)).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    it('contains privacy and terms text', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
        expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    });

    it('displays the current year', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        const year = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });
});
