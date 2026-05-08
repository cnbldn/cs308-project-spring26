import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import styles from './Account.module.css';

const API_BASE = 'http://localhost:5000/api';

type ProfileForm = {
  name: string;
  email: string;
  homeAddress: string;
  taxId: string;
};

const Account: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
    homeAddress: user?.homeAddress || '',
    taxId: user?.taxId || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const startEditing = () => {
    setProfile({
      name: user.name || '',
      email: user.email || '',
      homeAddress: user.homeAddress || '',
      taxId: user.taxId || '',
    });
    setProfileError(null);
    setProfileSuccess(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setProfileError(null);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profile.name.trim() || !profile.email.trim() || !profile.homeAddress.trim()) {
      setProfileError('All fields except Tax ID are required');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/auth/profile/${user.id}`, {
        name: profile.name.trim(),
        email: profile.email.trim(),
        homeAddress: profile.homeAddress.trim(),
        taxId: profile.taxId.trim(),
      });

      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError(t('account.currentPasswordRequired'));
      return;
    }
    if (!newPassword) {
      setPasswordError(t('account.newPasswordRequired'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('account.newPasswordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('account.passwordMismatch'));
      return;
    }

    setPasswordSaving(true);
    try {
      await axios.put(`${API_BASE}/auth/password/${user.id}`, {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(t('account.passwordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || t('account.passwordError'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('account.title')}</h2>
        <p className={styles.subtitle}>{t('account.subtitle')}</p>

        <form onSubmit={handleProfileSave} className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('account.title')}</h4>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.name')}</label>
            {isEditing ? (
              <input
                type="text"
                className={styles.input}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            ) : (
              <div className={styles.value}>{currentUser.name}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.email')}</label>
            {isEditing ? (
              <input
                type="email"
                className={styles.input}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            ) : (
              <div className={styles.value}>{currentUser.email}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.address')}</label>
            {isEditing ? (
              <input
                type="text"
                className={styles.input}
                value={profile.homeAddress}
                onChange={(e) => setProfile({ ...profile, homeAddress: e.target.value })}
              />
            ) : (
              <div className={styles.value}>{currentUser.homeAddress || '—'}</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.taxId')}</label>
            {isEditing ? (
              <input
                type="text"
                className={styles.input}
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              />
            ) : (
              <div className={styles.value}>{currentUser.taxId || '—'}</div>
            )}
          </div>

          {profileError && <div className={styles.error}>{profileError}</div>}
          {profileSuccess && <div className={styles.success}>{profileSuccess}</div>}

          {isEditing ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className={styles.button}
                disabled={profileSaving}
                style={{ flex: 1 }}
              >
                {profileSaving ? t('account.saving') : 'Save'}
              </button>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={cancelEditing}
                disabled={profileSaving}
                style={{ flex: 1, marginTop: 0 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.button}
              onClick={startEditing}
              style={{ marginTop: '0.5rem' }}
            >
              Edit Profile
            </button>
          )}
        </form>

        <form onSubmit={handlePasswordSave} className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('account.passwordSection')}</h4>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.currentPassword')}</label>
            <input
              type="password"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.newPassword')}</label>
            <input
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('account.confirmPassword')}</label>
            <input
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {passwordError && <div className={styles.error}>{passwordError}</div>}
          {passwordSuccess && <div className={styles.success}>{passwordSuccess}</div>}

          <button type="submit" className={styles.button} disabled={passwordSaving}>
            {passwordSaving ? t('account.saving') : t('account.savePassword')}
          </button>
        </form>

        <button onClick={handleLogout} className={styles.logoutButton}>
          {t('account.logout')}
        </button>
      </div>
    </div>
  );
};

export default Account;
