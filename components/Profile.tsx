import React, { useState } from 'react';
import { User } from '../types';
import { TRANSLATIONS } from '../constants';
import { LogOut, User as UserIcon, X, ChevronDown, Camera, ChevronLeft, Palette, Globe, ShieldCheck } from 'lucide-react';

interface ProfileProps {
  user: User;
  updateUser: (u: User) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onRestore: (data: any) => void;
  language: 'ta' | 'en';
  onLanguageChange: (lang: 'ta' | 'en') => void;
  onResetApp: () => void;
  customAppName: string;
  setCustomAppName: (name: string) => void;
  themeColor: string;
  onThemeChange: (color: string) => void;
  buttonColor: string;
  onButtonColorChange: (color: string) => void;
  onBack: () => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, updateUser, onLogout, onLoginClick, language, onLanguageChange, customAppName, setCustomAppName, themeColor, onThemeChange, buttonColor, onButtonColorChange, onBack, showInstallBtn, onInstall }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editMobile, setEditMobile] = useState(user.mobile || '');
  const [editAddress, setEditAddress] = useState(user.address || '');

  const t = TRANSLATIONS[language];

  const handleSaveProfile = () => {
    updateUser({
      ...user,
      name: editName,
      mobile: editMobile,
      address: editAddress
    });
    setIsEditingProfile(false);
  };

  const themeColors = [
    { name: 'Zinc', class: 'bg-zinc-50', border: 'border-zinc-200' },
    { name: 'Rose', class: 'bg-rose-50', border: 'border-rose-200' },
    { name: 'Blue', class: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Green', class: 'bg-emerald-50', border: 'border-emerald-200' },
    { name: 'Purple', class: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Orange', class: 'bg-orange-50', border: 'border-orange-200' }
  ];

  const buttonColorsList = [
    { name: 'Zinc', class: 'bg-zinc-600 hover:bg-zinc-700', border: 'border-zinc-400', displayClass: 'bg-zinc-600' },
    { name: 'Rose', class: 'bg-rose-600 hover:bg-rose-700', border: 'border-rose-400', displayClass: 'bg-rose-600' },
    { name: 'Blue', class: 'bg-blue-600 hover:bg-blue-700', border: 'border-blue-400', displayClass: 'bg-blue-600' },
    { name: 'Green', class: 'bg-emerald-600 hover:bg-emerald-700', border: 'border-emerald-400', displayClass: 'bg-emerald-600' },
    { name: 'Purple', class: 'bg-purple-600 hover:bg-purple-700', border: 'border-purple-400', displayClass: 'bg-purple-600' },
    { name: 'Orange', class: 'bg-orange-600 hover:bg-orange-700', border: 'border-orange-400', displayClass: 'bg-orange-600' }
  ];

  const [showColorSettings, setShowColorSettings] = useState(false);
  const [colorConfirm, setColorConfirm] = useState<{ type: 'theme' | 'button', colorClass: string } | null>(null);

  const handleConfirmColor = () => {
    if (colorConfirm) {
      if (colorConfirm.type === 'theme') {
        onThemeChange(colorConfirm.colorClass);
      } else {
        onButtonColorChange(colorConfirm.colorClass);
      }
      setColorConfirm(null);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 md:pb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-zinc-50 transition">
          <ChevronLeft size={20} className="text-zinc-600" />
        </button>
        <h2 className="text-xl font-black tamil-font text-zinc-900">
          {t.profile}
        </h2>
      </div>

      {/* User Profile Header */}
      <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-lg relative overflow-hidden border border-zinc-100">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <ShieldCheck size={140} className="text-zinc-900" />
        </div>
        <div className="relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white overflow-hidden">
               {user.avatar ? (
                 <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl font-black">{user.name[0]?.toUpperCase() || 'U'}</span>
               )}
            </div>
            <button onClick={() => setIsEditingProfile(true)} className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md text-zinc-800 hover:bg-zinc-100 transition">
              <Camera size={16} />
            </button>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-1">{user.name}</h3>
          <p className="text-zinc-500 font-medium mb-4">{user.email}</p>
          {user.mobile && <p className="text-zinc-600 font-medium text-sm mb-1">{user.mobile}</p>}
          {user.address && <p className="text-zinc-500 text-sm max-w-xs mx-auto">{user.address}</p>}
          
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="mt-6 px-6 py-2 bg-zinc-100 text-zinc-800 font-bold rounded-full hover:bg-zinc-200 transition text-sm"
          >
            {t.editProfile}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Settings Section */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{t.settings}</h4>
          
          <div className="space-y-4">
            {/* Language Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-zinc-600">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{t.language}</p>
                  <p className="text-xs text-zinc-500">{t.changeLanguage}</p>
                </div>
              </div>
              <div className="flex bg-zinc-200/50 p-1 rounded-xl">
                <button 
                  onClick={() => onLanguageChange('ta')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${language === 'ta' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  தமிழ்
                </button>
                <button 
                  onClick={() => onLanguageChange('en')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${language === 'en' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Color Settings */}
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <button 
                onClick={() => setShowColorSettings(!showColorSettings)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-zinc-600">
                    <Palette size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-zinc-900">{t.colorSettings}</p>
                    <p className="text-xs text-zinc-500">{t.changeColors}</p>
                  </div>
                </div>
                <ChevronDown size={20} className={`text-zinc-400 transition-transform ${showColorSettings ? 'rotate-180' : ''}`} />
              </button>

              {showColorSettings && (
                <div className="mt-6 space-y-6 border-t border-zinc-200 pt-6 animate-in fade-in slide-in-from-top-2">
                  {/* Background Color */}
                  <div>
                    <p className="text-sm font-bold text-zinc-700 mb-3">{t.backgroundColor}</p>
                    <div className="flex flex-wrap gap-3">
                      {themeColors.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setColorConfirm({ type: 'theme', colorClass: color.class })}
                          className={`w-10 h-10 rounded-full border-2 transition-transform ${color.class} ${themeColor === color.class ? 'border-zinc-900 scale-110' : color.border}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Button Color */}
                  <div>
                    <p className="text-sm font-bold text-zinc-700 mb-3">{t.buttonColor}</p>
                    <div className="flex flex-wrap gap-3">
                      {buttonColorsList.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setColorConfirm({ type: 'button', colorClass: color.class })}
                          className={`w-10 h-10 rounded-full border-2 transition-transform ${color.displayClass} ${buttonColor === color.class ? 'border-zinc-900 scale-110' : color.border}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* App Name Customization */}
            <div className="p-4 bg-zinc-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-zinc-600">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{t.appNameLabel}</p>
                  <p className="text-xs text-zinc-500">{t.setShopName}</p>
                </div>
              </div>
              <input 
                type="text" 
                value={customAppName}
                onChange={(e) => setCustomAppName(e.target.value)}
                placeholder={t.shopNamePlaceholder}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Install App Section */}
        {showInstallBtn && (
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[2rem] p-6 shadow-xl text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Camera size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-black tamil-font text-lg">{t.installAppTitle || 'அப்ளிகேஷனை நிறுவுங்கள்'}</h4>
                <p className="text-xs text-zinc-400 font-medium">{t.installAppDesc || 'வேகமான அணுகலுக்கு உங்கள் போனில் நிறுவுங்கள்'}</p>
              </div>
            </div>
            <button 
              onClick={onInstall}
              className="w-full bg-white text-zinc-900 font-black py-4 rounded-2xl shadow-lg active:scale-[0.98] transition"
            >
              {t.installNow || 'இப்போதே நிறுவு'}
            </button>
          </div>
        )}

        {/* Logout / Login Button */}
        {user.uid ? (
          <button 
            onClick={onLogout} 
            className="w-full bg-rose-50 p-6 rounded-[1.5rem] shadow-sm flex items-center justify-center gap-4 text-rose-600 font-black border border-rose-100 hover:bg-rose-100 transition active:scale-[0.98]"
          >
            <LogOut size={24} />
            <span className="uppercase tracking-widest text-sm">{t.logout}</span>
          </button>
        ) : (
          <button 
            onClick={onLoginClick} 
            className={`w-full ${buttonColor} p-6 rounded-[1.5rem] shadow-sm flex items-center justify-center gap-4 text-white font-black transition active:scale-[0.98]`}
          >
            <UserIcon size={24} />
            <span className="uppercase tracking-widest text-sm">{t.loginSignUp}</span>
          </button>
        )}
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-xl font-black tamil-font text-zinc-900">{t.editProfile}</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-white rounded-full text-zinc-400 hover:text-zinc-600 shadow-sm transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.name}</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.phone}</label>
                <input 
                  type="tel" 
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.address}</label>
                <textarea 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 transition min-h-[100px] resize-none"
                  placeholder="Your Address"
                />
              </div>
              
              <button 
                onClick={handleSaveProfile}
                className={`w-full ${buttonColor} text-white font-bold py-4 rounded-xl transition active:scale-[0.98] shadow-md`}
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Confirm Modal */}
      {colorConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-xl font-black tamil-font text-zinc-900 mb-2">
                {t.changeColorAsk}
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                {t.applyColorConfirm}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setColorConfirm(null)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleConfirmColor}
                  className={`flex-1 py-3 ${colorConfirm.type === 'button' ? colorConfirm.colorClass : buttonColor} text-white font-bold rounded-xl transition shadow-md`}
                >
                  {t.apply}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
