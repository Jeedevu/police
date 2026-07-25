import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check, Zap } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../i18n";

export default function LanguageSwitcher({ variant = "dropdown" }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangCode = i18n.language || "en";
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    if (code === currentLangCode) {
      setIsOpen(false);
      return;
    }

    // Trigger smooth fade transition effect (250ms)
    setIsTransitioning(true);
    document.body.style.opacity = "0.75";
    document.body.style.transition = "opacity 200ms ease-in-out";

    setTimeout(() => {
      i18n.changeLanguage(code);
      localStorage.setItem("ksp_language", code);
      setIsOpen(false);
      setTimeout(() => {
        document.body.style.opacity = "1";
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  // Demo Mode 1-click Quick Toggle between EN and KN
  const toggleDemoLanguage = () => {
    const nextLang = currentLangCode === "kn" ? "en" : "kn";
    changeLanguage(nextLang);
  };

  if (variant === "demo_toggle") {
    return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Globe size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">🌐 {t("auth.demo_mode_title", "Demo Language")}</h4>
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap size={10} /> HACKATHON STAGE MODE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("auth.demo_mode_desc", "Instant English <-> Kannada toggle for live judging presentation.")}
            </p>
          </div>
        </div>

        <button
          onClick={toggleDemoLanguage}
          disabled={isTransitioning}
          className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <span>{currentLangCode === "kn" ? "🇮🇳 English ಗೆ ಬದಲಾಯಿಸಿ" : "🇮🇳 ಕನ್ನಡ ಗೆ ಬದಲಾಯಿಸಿ"}</span>
          <Globe size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-semibold transition-all shadow-sm"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span>{currentLang.nativeName}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Language / ಭಾಷೆ ಆಯ್ಕೆ
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLangCode;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({lang.name})</span>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
