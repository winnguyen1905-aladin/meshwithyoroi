"use client"; // BẮT BUỘC

import { useState } from 'react';
import { useUpdateUserSettings } from '@/hooks/use-user';

export default function SettingsPage() {
  const [theme, setTheme] = useState('dark');
  const [address, setAddress] = useState('0x123...');

  // Gọi hook mutation
  const { mutate: updateSettings, isPending, isError } = useUpdateUserSettings();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const settings = { theme };
    // Gọi mutation để gửi data
    updateSettings({ address, settings });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>User Settings</h2>
      {/* ... các input cho address, theme ... */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
      {isError && <p>Lỗi! Không thể lưu.</p>}
    </form>
  );
}