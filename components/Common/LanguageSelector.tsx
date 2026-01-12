import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'es', label: 'Español', flag: '🇪🇸' }
    ];

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 group"
            >
                <Globe size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700">{currentLanguage.label}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-fade-in-up">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{lang.flag}</span>
                                <span className={`text-sm font-medium ${i18n.language === lang.code ? 'text-brand-600 font-bold' : 'text-slate-600'}`}>
                                    {lang.label}
                                </span>
                            </div>
                            {i18n.language === lang.code && (
                                <Check size={14} className="text-brand-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
