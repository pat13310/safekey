import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <div className={`language-selector ${className} px-2`}>
      <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('settings.language')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={handleLanguageChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="fr">{t('settings.french')}</option>
        <option value="en">{t('settings.english')}</option>
        <option value="es">{t('settings.spanish')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
